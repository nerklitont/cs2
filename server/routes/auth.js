const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Имя пользователя от 3 до 20 символов' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, hash);

    const token = jwt.sign({ id: result.lastInsertRowid, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    const user = db.prepare('SELECT id, username, email, balance, avatar_url, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);
    if (!user) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
