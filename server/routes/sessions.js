const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/sessions — list all sessions for the current user
router.get('/', authenticate, (req, res) => {
  try {
    const sessions = db.prepare(
      `SELECT id, user_agent, ip_address, created_at, last_active_at, is_active
       FROM sessions
       WHERE user_id = ?
       ORDER BY created_at DESC`
    ).all(req.userId);

    // Mark which session is the current one
    const result = sessions.map(s => ({
      id: s.id,
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      createdAt: s.created_at,
      lastActiveAt: s.last_active_at,
      isActive: !!s.is_active,
      isCurrent: s.id === getCurrentSessionId(req),
    }));

    res.json(result);
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sessions/:id — get a specific session by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const session = db.prepare(
      `SELECT id, user_id, user_agent, ip_address, created_at, last_active_at, is_active
       FROM sessions
       WHERE id = ? AND user_id = ?`
    ).get(req.params.id, req.userId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      userAgent: session.user_agent,
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastActiveAt: session.last_active_at,
      isActive: !!session.is_active,
      isCurrent: session.id === getCurrentSessionId(req),
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sessions/:id — revoke a specific session
router.delete('/:id', authenticate, (req, res) => {
  try {
    const session = db.prepare(
      'SELECT id, token_jti FROM sessions WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if trying to revoke the current session
    const currentId = getCurrentSessionId(req);
    if (session.id === currentId) {
      return res.status(400).json({ error: 'Cannot revoke your current session. Use logout instead.' });
    }

    db.prepare('UPDATE sessions SET is_active = 0 WHERE id = ?').run(session.id);

    res.json({ message: 'Session revoked' });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sessions — revoke all other sessions
router.delete('/', authenticate, (req, res) => {
  try {
    const currentId = getCurrentSessionId(req);

    db.prepare(
      'UPDATE sessions SET is_active = 0 WHERE user_id = ? AND id != ?'
    ).run(req.userId, currentId || '');

    res.json({ message: 'All other sessions revoked' });
  } catch (err) {
    console.error('Revoke all sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to find the current session ID from the token's jti
function getCurrentSessionId(req) {
  if (!req.tokenJti) return null;
  const session = db.prepare(
    'SELECT id FROM sessions WHERE token_jti = ?'
  ).get(req.tokenJti);
  return session ? session.id : null;
}

module.exports = router;
