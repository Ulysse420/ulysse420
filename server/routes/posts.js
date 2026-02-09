const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function enrichPost(post, currentUserId) {
  const likeCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(post.id).count;
  const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(post.id).count;
  const liked = currentUserId
    ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(currentUserId, post.id)
    : false;

  return {
    id: post.id,
    caption: post.caption,
    imageUrl: post.image_url,
    createdAt: post.created_at,
    author: {
      id: post.user_id,
      username: post.username,
      displayName: post.display_name,
      avatarUrl: post.avatar_url,
    },
    likeCount,
    commentCount,
    liked,
  };
}

// GET /api/posts/feed — posts from people you follow
router.get('/feed', authenticate, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;

  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_url
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
       OR p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, req.userId, limit, offset);

  res.json(posts.map(p => enrichPost(p, req.userId)));
});

// GET /api/posts/explore — recent posts from everyone
router.get('/explore', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;

  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_url
    FROM posts p JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json(posts.map(p => enrichPost(p, null)));
});

// GET /api/posts/user/:userId
router.get('/user/:userId', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_url
    FROM posts p JOIN users u ON u.id = p.user_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.userId);

  res.json(posts.map(p => enrichPost(p, null)));
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_url
    FROM posts p JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(enrichPost(post, null));
});

// POST /api/posts
router.post('/', authenticate, upload.single('image'), (req, res) => {
  const { caption } = req.body;
  if (!req.file && !caption) {
    return res.status(400).json({ error: 'Post must have an image or caption' });
  }

  const id = uuidv4();
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  db.prepare('INSERT INTO posts (id, user_id, caption, image_url) VALUES (?, ?, ?, ?)').run(
    id, req.userId, caption || '', imageUrl,
  );

  const post = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_url
    FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(id);

  res.status(201).json(enrichPost(post, req.userId));
});

// DELETE /api/posts/:id
router.delete('/:id', authenticate, (req, res) => {
  const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.userId) return res.status(403).json({ error: 'Not your post' });

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// POST /api/posts/:id/like
router.post('/:id/like', authenticate, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)').run(req.userId, req.params.id);
    res.json({ liked: true });
  } catch {
    res.status(500).json({ error: 'Could not like post' });
  }
});

// DELETE /api/posts/:id/like
router.delete('/:id/like', authenticate, (req, res) => {
  db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.userId, req.params.id);
  res.json({ liked: false });
});

// GET /api/posts/:id/comments
router.get('/:id/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json(comments.map(c => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: { id: c.user_id, username: c.username, displayName: c.display_name, avatarUrl: c.avatar_url },
  })));
});

// POST /api/posts/:id/comments
router.post('/:id/comments', authenticate, (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Comment body is required' });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, post_id, user_id, body) VALUES (?, ?, ?, ?)').run(
    id, req.params.id, req.userId, body.trim(),
  );

  const comment = db.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?
  `).get(id);

  res.status(201).json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.created_at,
    author: { id: comment.user_id, username: comment.username, displayName: comment.display_name, avatarUrl: comment.avatar_url },
  });
});

module.exports = router;
