const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = 'SELECT id, username, email, balance, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countQ = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
    const total = db.prepare(countQ).get(...params).total;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const users = db.prepare(query).all(...params);
    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/users/:id/balance', (req, res) => {
  try {
    const { balance } = req.body;
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(balance, req.params.id);
    const user = db.prepare('SELECT id, username, email, balance, role FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    const user = db.prepare('SELECT id, username, email, balance, role FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    db.prepare('DELETE FROM user_inventory WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM upgrades WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/stats', (_req, res) => {
  try {
    const stats = db.prepare('SELECT * FROM site_stats WHERE id = 1').get();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const skinCount = db.prepare('SELECT COUNT(*) as count FROM skins').get().count;
    const totalInventory = db.prepare('SELECT COUNT(*) as count FROM user_inventory').get().count;
    const totalBalance = db.prepare('SELECT SUM(balance) as total FROM users').get().total || 0;

    res.json({
      ...stats,
      userCount,
      skinCount,
      totalInventory,
      totalBalance: Math.round(totalBalance * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/upgrades', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = db.prepare('SELECT COUNT(*) as count FROM upgrades').get().count;

    const upgrades = db.prepare(`
      SELECT u.*, us.username,
             sf.name as from_name, sf.price as from_price,
             st.name as to_name, st.price as to_price
      FROM upgrades u
      JOIN users us ON u.user_id = us.id
      JOIN skins sf ON u.from_skin_id = sf.id
      JOIN skins st ON u.to_skin_id = st.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    res.json({ upgrades, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/withdrawals', (_req, res) => {
  try {
    const items = db.prepare(`
      SELECT ui.id, ui.user_id, ui.status, ui.obtained_at,
             u.username, s.name, s.price, s.image_url
      FROM user_inventory ui
      JOIN users u ON ui.user_id = u.id
      JOIN skins s ON ui.skin_id = s.id
      WHERE ui.status = 'withdrawn'
      ORDER BY ui.obtained_at DESC
    `).all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/skins/:id', (req, res) => {
  try {
    const { price } = req.body;
    db.prepare('UPDATE skins SET price = ? WHERE id = ?').run(price, req.params.id);
    const skin = db.prepare('SELECT * FROM skins WHERE id = ?').get(req.params.id);
    res.json(skin);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
