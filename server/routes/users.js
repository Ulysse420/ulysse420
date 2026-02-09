const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/users/:username — public profile
router.get('/:username', (req, res) => {
  const user = db.prepare(`
    SELECT id, username, display_name, bio, avatar_url, created_at FROM users WHERE username = ?
  `).get(req.params.username);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;
  const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    postCount,
    followerCount,
    followingCount,
  });
});

// PUT /api/users/me — update own profile
router.put('/me', authenticate, upload.single('avatar'), (req, res) => {
  const { displayName, bio } = req.body;
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const current = db.prepare('SELECT display_name, bio, avatar_url FROM users WHERE id = ?').get(req.userId);
  if (!current) return res.status(404).json({ error: 'User not found' });

  db.prepare(`
    UPDATE users SET display_name = ?, bio = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?
  `).run(
    displayName ?? current.display_name,
    bio ?? current.bio,
    avatarUrl ?? current.avatar_url,
    req.userId,
  );

  res.json({ success: true });
});

// POST /api/users/:id/follow
router.post('/:id/follow', authenticate, (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  try {
    db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.userId, req.params.id);
    res.json({ following: true });
  } catch {
    res.status(500).json({ error: 'Could not follow user' });
  }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', authenticate, (req, res) => {
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.userId, req.params.id);
  res.json({ following: false });
});

// GET /api/users/:id/followers
router.get('/:id/followers', (req, res) => {
  const followers = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_url
    FROM follows f JOIN users u ON u.id = f.follower_id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `).all(req.params.id);

  res.json(followers.map(u => ({
    id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url,
  })));
});

// GET /api/users/:id/following
router.get('/:id/following', (req, res) => {
  const following = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_url
    FROM follows f JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `).all(req.params.id);

  res.json(following.map(u => ({
    id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url,
  })));
});

// GET /api/users/search?q=term
router.get('/', (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 2) return res.json([]);

  const users = db.prepare(`
    SELECT id, username, display_name, avatar_url FROM users
    WHERE username LIKE ? OR display_name LIKE ?
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`);

  res.json(users.map(u => ({
    id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url,
  })));
});

module.exports = router;
