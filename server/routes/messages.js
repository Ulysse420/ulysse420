const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations — list of people you've messaged
router.get('/conversations', authenticate, (req, res) => {
  const conversations = db.prepare(`
    SELECT DISTINCT
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id
    FROM messages
    WHERE sender_id = ? OR receiver_id = ?
  `).all(req.userId, req.userId, req.userId);

  const result = conversations.map(c => {
    const user = db.prepare('SELECT id, username, display_name, avatar_url FROM users WHERE id = ?').get(c.other_id);
    const lastMsg = db.prepare(`
      SELECT body, created_at FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at DESC LIMIT 1
    `).get(req.userId, c.other_id, c.other_id, req.userId);

    return {
      user: user ? { id: user.id, username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url } : null,
      lastMessage: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.created_at } : null,
    };
  });

  res.json(result.filter(r => r.user));
});

// GET /api/messages/:userId — conversation with a specific user
router.get('/:userId', authenticate, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, req.params.userId, req.params.userId, req.userId, limit, offset);

  res.json(messages.reverse().map(m => ({
    id: m.id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    body: m.body,
    createdAt: m.created_at,
  })));
});

// POST /api/messages/:userId
router.post('/:userId', authenticate, (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body required' });

  if (req.params.userId === req.userId) {
    return res.status(400).json({ error: 'Cannot message yourself' });
  }

  const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.userId);
  if (!recipient) return res.status(404).json({ error: 'User not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, body) VALUES (?, ?, ?, ?)').run(
    id, req.userId, req.params.userId, body.trim(),
  );

  res.status(201).json({
    id,
    senderId: req.userId,
    receiverId: req.params.userId,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  });
});

module.exports = router;
