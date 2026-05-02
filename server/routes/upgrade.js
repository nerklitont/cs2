const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  try {
    const { inventoryItemId, targetSkinId, customChance } = req.body;
    const userId = req.userId;

    const invItem = db.prepare(`
      SELECT ui.*, s.price as from_price, s.name as from_name, s.image_url as from_image,
             s.rarity as from_rarity, s.rarity_color as from_rarity_color, s.weapon as from_weapon
      FROM user_inventory ui
      JOIN skins s ON ui.skin_id = s.id
      WHERE ui.id = ? AND ui.user_id = ? AND ui.status = 'available'
    `).get(inventoryItemId, userId);

    if (!invItem) {
      return res.status(400).json({ error: 'Предмет не найден в инвентаре' });
    }

    const targetSkin = db.prepare('SELECT * FROM skins WHERE id = ?').get(targetSkinId);
    if (!targetSkin) {
      return res.status(400).json({ error: 'Целевой скин не найден' });
    }

    if (targetSkin.price <= invItem.from_price) {
      return res.status(400).json({ error: 'Целевой скин должен быть дороже' });
    }

    let chance = (invItem.from_price / targetSkin.price) * 100;
    const multiplier = targetSkin.price / invItem.from_price;

    if (customChance && customChance > 0 && customChance <= chance) {
      chance = customChance;
    }

    chance = Math.min(Math.max(chance, 1), 95);

    const roll = Math.random() * 100;
    const success = roll < chance;

    const upgradeTransaction = db.transaction(() => {
      db.prepare("UPDATE user_inventory SET status = 'locked' WHERE id = ?").run(inventoryItemId);

      if (success) {
        db.prepare('INSERT INTO user_inventory (user_id, skin_id) VALUES (?, ?)').run(userId, targetSkinId);
      }

      db.prepare('DELETE FROM user_inventory WHERE id = ?').run(inventoryItemId);

      const result = db.prepare(
        'INSERT INTO upgrades (user_id, from_skin_id, to_skin_id, chance, multiplier, success) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(userId, invItem.skin_id, targetSkinId, chance, multiplier, success ? 1 : 0);

      if (success) {
        db.prepare('UPDATE site_stats SET total_upgrades = total_upgrades + 1, total_wins = total_wins + 1 WHERE id = 1').run();
      } else {
        db.prepare('UPDATE site_stats SET total_upgrades = total_upgrades + 1, total_losses = total_losses + 1 WHERE id = 1').run();
      }

      const user = db.prepare('SELECT username, avatar_url FROM users WHERE id = ?').get(userId);

      return {
        upgradeId: result.lastInsertRowid,
        success,
        chance: Math.round(chance * 100) / 100,
        multiplier: Math.round(multiplier * 100) / 100,
        roll: Math.round(roll * 100) / 100,
        fromSkin: {
          name: invItem.from_name,
          price: invItem.from_price,
          image_url: invItem.from_image,
          rarity: invItem.from_rarity,
          rarity_color: invItem.from_rarity_color,
          weapon: invItem.from_weapon
        },
        toSkin: {
          name: targetSkin.name,
          price: targetSkin.price,
          image_url: targetSkin.image_url,
          rarity: targetSkin.rarity,
          rarity_color: targetSkin.rarity_color,
          weapon: targetSkin.weapon
        },
        user: {
          id: userId,
          username: user.username,
          avatar_url: user.avatar_url
        }
      };
    });

    const result = upgradeTransaction();

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('upgrade', result);
      const stats = db.prepare('SELECT * FROM site_stats WHERE id = 1').get();
      io.emit('stats', stats);
    }

    res.json(result);
  } catch (err) {
    console.error('Upgrade error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/feed', (_req, res) => {
  try {
    const feed = db.prepare(`
      SELECT u.id, u.user_id, u.from_skin_id, u.to_skin_id, u.chance, u.multiplier, u.success, u.created_at,
             us.username, us.avatar_url,
             sf.name as from_name, sf.price as from_price, sf.image_url as from_image,
             sf.rarity as from_rarity, sf.rarity_color as from_rarity_color, sf.weapon as from_weapon,
             st.name as to_name, st.price as to_price, st.image_url as to_image,
             st.rarity as to_rarity, st.rarity_color as to_rarity_color, st.weapon as to_weapon
      FROM upgrades u
      JOIN users us ON u.user_id = us.id
      JOIN skins sf ON u.from_skin_id = sf.id
      JOIN skins st ON u.to_skin_id = st.id
      ORDER BY u.created_at DESC
      LIMIT 20
    `).all();

    res.json(feed);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/top', (_req, res) => {
  try {
    const top = db.prepare(`
      SELECT u.id, u.user_id, u.chance, u.multiplier, u.success, u.created_at,
             us.username, us.avatar_url,
             sf.name as from_name, sf.price as from_price, sf.image_url as from_image,
             sf.rarity_color as from_rarity_color,
             st.name as to_name, st.price as to_price, st.image_url as to_image,
             st.rarity_color as to_rarity_color
      FROM upgrades u
      JOIN users us ON u.user_id = us.id
      JOIN skins sf ON u.from_skin_id = sf.id
      JOIN skins st ON u.to_skin_id = st.id
      WHERE u.success = 1
      ORDER BY u.multiplier DESC
      LIMIT 1
    `).get();

    res.json(top || null);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/stats', (_req, res) => {
  try {
    const stats = db.prepare('SELECT * FROM site_stats WHERE id = 1').get();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
