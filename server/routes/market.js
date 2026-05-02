const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/buy', authMiddleware, (req, res) => {
  try {
    const { skinId } = req.body;
    const userId = req.userId;

    const skin = db.prepare('SELECT * FROM skins WHERE id = ?').get(skinId);
    if (!skin) return res.status(404).json({ error: 'Скин не найден' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (user.balance < skin.price) {
      return res.status(400).json({ error: 'Недостаточно средств' });
    }

    const buyTransaction = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(skin.price, userId);
      db.prepare('INSERT INTO user_inventory (user_id, skin_id) VALUES (?, ?)').run(userId, skinId);
      const updatedUser = db.prepare('SELECT id, username, email, balance, avatar_url, role FROM users WHERE id = ?').get(userId);
      return updatedUser;
    });

    const updatedUser = buyTransaction();

    res.json({
      message: 'Скин куплен',
      balance: updatedUser.balance,
      user: updatedUser
    });
  } catch (err) {
    console.error('Buy error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/sell', authMiddleware, (req, res) => {
  try {
    const { inventoryId } = req.body;
    const userId = req.userId;

    const item = db.prepare(
      'SELECT ui.*, s.price FROM user_inventory ui JOIN skins s ON ui.skin_id = s.id WHERE ui.id = ? AND ui.user_id = ? AND ui.status = ?'
    ).get(inventoryId, userId, 'available');

    if (!item) return res.status(404).json({ error: 'Предмет не найден' });

    const sellTransaction = db.transaction(() => {
      db.prepare('DELETE FROM user_inventory WHERE id = ?').run(inventoryId);
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(item.price * 0.9, userId);
      return db.prepare('SELECT id, username, email, balance, avatar_url, role FROM users WHERE id = ?').get(userId);
    });

    const updatedUser = sellTransaction();

    res.json({
      message: 'Скин продан',
      balance: updatedUser.balance,
      user: updatedUser
    });
  } catch (err) {
    console.error('Sell error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
