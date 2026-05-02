const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, rarity, search, sort, order, page = 1, limit = 24, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM skins WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (rarity) {
      query += ' AND rarity = ?';
      params.push(rarity);
    }
    if (search) {
      query += ' AND (name LIKE ? OR weapon LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = db.prepare(countQuery).get(...params).total;

    const sortField = ['price', 'name', 'rarity'].includes(sort) ? sort : 'price';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const skins = db.prepare(query).all(...params);

    res.json({
      skins,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Get skins error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/categories', (_req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM skins ORDER BY category').all();
    res.json(categories.map(c => c.category));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/rarities', (_req, res) => {
  try {
    const rarities = db.prepare('SELECT DISTINCT rarity, rarity_color FROM skins ORDER BY rarity').all();
    res.json(rarities);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const skin = db.prepare('SELECT * FROM skins WHERE id = ?').get(req.params.id);
    if (!skin) return res.status(404).json({ error: 'Скин не найден' });
    res.json(skin);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
