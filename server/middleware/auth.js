const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-random-secret-in-production';

function createToken(userId) {
  const jti = uuidv4();
  const token = jwt.sign({ userId, jti }, JWT_SECRET, { expiresIn: '30d' });
  return { token, jti };
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = decoded.userId;
    req.tokenJti = decoded.jti;

    // Validate that the session is still active (if jti present)
    if (decoded.jti) {
      const session = db.prepare(
        'SELECT id, is_active FROM sessions WHERE token_jti = ?'
      ).get(decoded.jti);

      if (session && !session.is_active) {
        return res.status(401).json({ error: 'Session has been revoked' });
      }

      // Update last_active_at (throttle to avoid excessive writes)
      if (session) {
        db.prepare(
          "UPDATE sessions SET last_active_at = datetime('now') WHERE id = ?"
        ).run(session.id);
      }
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { createToken, authenticate, JWT_SECRET };
