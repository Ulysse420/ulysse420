import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../hooks/api';
import PostCard from '../components/PostCard';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/posts/explore')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/api/users?q=${encodeURIComponent(searchQuery)}`)
        .then(setSearchResults)
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="explore-page">
      <h2>Explore</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search people..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(u => (
            <Link key={u.id} to={`/user/${u.username}`} className="search-result-item">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" className="avatar-sm" />
              ) : (
                <div className="avatar-sm avatar-placeholder">{u.username[0].toUpperCase()}</div>
              )}
              <div>
                <div className="username">{u.username}</div>
                {u.displayName !== u.username && <div className="display-name">{u.displayName}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="post-grid">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
