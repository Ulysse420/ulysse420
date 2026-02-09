import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const toggleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        await api.delete(`/api/posts/${post.id}/like`);
        setLiked(false);
        setLikeCount(c => c - 1);
      } else {
        await api.post(`/api/posts/${post.id}/like`);
        setLiked(true);
        setLikeCount(c => c + 1);
      }
      if (onUpdate) onUpdate();
    } catch { /* ignore */ }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <Link to={`/user/${post.author.username}`} className="post-author">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="" className="avatar-sm" />
          ) : (
            <div className="avatar-sm avatar-placeholder">{post.author.username[0].toUpperCase()}</div>
          )}
          <span className="username">{post.author.username}</span>
        </Link>
        <span className="post-time">{timeAgo(post.createdAt)}</span>
      </div>

      {post.imageUrl && (
        <Link to={`/post/${post.id}`}>
          <img src={post.imageUrl} alt={post.caption} className="post-image" />
        </Link>
      )}

      <div className="post-actions">
        <button onClick={toggleLike} className={`btn-icon ${liked ? 'liked' : ''}`}>
          {liked ? '\u2665' : '\u2661'} {likeCount}
        </button>
        <Link to={`/post/${post.id}`} className="btn-icon">
          {'\u{1F4AC}'} {post.commentCount}
        </Link>
      </div>

      {post.caption && (
        <div className="post-caption">
          <Link to={`/user/${post.author.username}`} className="username">{post.author.username}</Link>{' '}
          {post.caption}
        </div>
      )}
    </article>
  );
}
