const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { createToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const id = uuidv4();
    const hashed = await bcrypt.hash(password, 12);

    db.prepare(
      'INSERT INTO users (id, username, email, password, display_name) VALUES (?, ?, ?, ?, ?)'
    ).run(id, username, email, hashed, displayName || username);

    const { token, jti } = createToken(id);

    // Create session record
    const sessionId = uuidv4();
    db.prepare(
      'INSERT INTO sessions (id, user_id, token_jti, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(sessionId, id, jti, req.headers['user-agent'] || '', req.ip || '');

    res.status(201).json({ token, user: { id, username, displayName: displayName || username } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const user = db.prepare(
      'SELECT id, username, email, password, display_name, bio, avatar_url FROM users WHERE username = ? OR email = ?'
    ).get(login, login);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { token, jti } = createToken(user.id);

    // Create session record
    const sessionId = uuidv4();
    db.prepare(
      'INSERT INTO sessions (id, user_id, token_jti, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(sessionId, user.id, jti, req.headers['user-agent'] || '', req.ip || '');

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, display_name, bio, avatar_url, created_at FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  try {
    if (req.tokenJti) {
      db.prepare('UPDATE sessions SET is_active = 0 WHERE token_jti = ?').run(req.tokenJti);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
