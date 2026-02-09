import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/posts/${id}`),
      api.get(`/api/posts/${id}/comments`),
    ])
      .then(([p, c]) => { setPost(p); setComments(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const c = await api.post(`/api/posts/${id}/comments`, { body: newComment.trim() });
      setComments(prev => [...prev, c]);
      setNewComment('');
    } catch { /* ignore */ }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!post) return <div className="error">Post not found</div>;

  return (
    <div className="post-detail-page">
      <article className="post-detail">
        <div className="post-header">
          <Link to={`/user/${post.author.username}`} className="post-author">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="avatar-sm" />
            ) : (
              <div className="avatar-sm avatar-placeholder">{post.author.username[0].toUpperCase()}</div>
            )}
            <span className="username">{post.author.username}</span>
          </Link>
        </div>

        {post.imageUrl && <img src={post.imageUrl} alt="" className="post-image" />}

        {post.caption && (
          <div className="post-caption">
            <Link to={`/user/${post.author.username}`} className="username">{post.author.username}</Link>{' '}
            {post.caption}
          </div>
        )}

        <div className="post-meta">
          {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'} &middot;{' '}
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </article>

      <section className="comments-section">
        <h3>Comments</h3>
        {comments.length === 0 && <p className="empty-state">No comments yet.</p>}
        {comments.map(c => (
          <div key={c.id} className="comment">
            <Link to={`/user/${c.author.username}`} className="username">{c.author.username}</Link>{' '}
            <span>{c.body}</span>
          </div>
        ))}

        {user && (
          <form onSubmit={submitComment} className="comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-sm">Post</button>
          </form>
        )}
      </section>
    </div>
  );
}
