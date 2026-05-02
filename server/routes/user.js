const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, email, balance, avatar_url, role, created_at FROM users WHERE id = ?'
    ).get(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/inventory', authMiddleware, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT ui.id as inventory_id, ui.status, ui.obtained_at,
             s.id as skin_id, s.name, s.weapon, s.category, s.rarity, s.rarity_color,
             s.price, s.image_url, s.exterior
      FROM user_inventory ui
      JOIN skins s ON ui.skin_id = s.id
      WHERE ui.user_id = ? AND ui.status = 'available'
      ORDER BY s.price DESC
    `).all(req.userId);
    res.json(items);
  } catch (err) {
    console.error('Inventory error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/history', authMiddleware, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT u.id, u.chance, u.multiplier, u.success, u.created_at,
             sf.name as from_name, sf.price as from_price, sf.image_url as from_image,
             sf.rarity_color as from_rarity_color,
             st.name as to_name, st.price as to_price, st.image_url as to_image,
             st.rarity_color as to_rarity_color
      FROM upgrades u
      JOIN skins sf ON u.from_skin_id = sf.id
      JOIN skins st ON u.to_skin_id = st.id
      WHERE u.user_id = ?
      ORDER BY u.created_at DESC
      LIMIT 50
    `).all(req.userId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/deposit', authMiddleware, (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0 || amount > 100000) {
      return res.status(400).json({ error: 'Неверная сумма' });
    }
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.userId);
    const user = db.prepare('SELECT id, username, email, balance, avatar_url, role FROM users WHERE id = ?').get(req.userId);
    res.json({ balance: user.balance, user });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/withdraw', authMiddleware, (req, res) => {
  try {
    const { inventoryId } = req.body;
    const item = db.prepare(
      "SELECT * FROM user_inventory WHERE id = ? AND user_id = ? AND status = 'available'"
    ).get(inventoryId, req.userId);
    if (!item) return res.status(404).json({ error: 'Предмет не найден' });

    db.prepare("UPDATE user_inventory SET status = 'withdrawn' WHERE id = ?").run(inventoryId);
    res.json({ message: 'Запрос на вывод создан' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
