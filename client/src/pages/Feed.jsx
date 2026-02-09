import { useState, useEffect } from 'react';
import api from '../hooks/api';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/api/posts/feed')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading">Loading your feed...</div>;

  return (
    <div className="feed-page">
      <h2>Your Feed</h2>
      {posts.length === 0 ? (
        <div className="empty-state">
          <p>Nothing here yet. Follow people or create your first post!</p>
        </div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} onUpdate={load} />)
      )}
    </div>
  );
}
