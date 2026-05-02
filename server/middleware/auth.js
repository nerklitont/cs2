const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cs2-upgrade-secret-key-2024';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
