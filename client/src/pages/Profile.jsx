import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/users/${username}`)
      .then(p => {
        setProfile(p);
        return Promise.all([
          api.get(`/api/posts/user/${p.id}`),
          currentUser ? api.get(`/api/users/${currentUser.id}/following`).catch(() => []) : Promise.resolve([]),
        ]);
      })
      .then(([userPosts, followingList]) => {
        setPosts(userPosts);
        if (profile) {
          setFollowing(followingList.some(f => f.id === profile.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (profile && currentUser) {
      api.get(`/api/users/${currentUser.id}/following`)
        .then(list => setFollowing(list.some(f => f.id === profile.id)))
        .catch(() => {});
    }
  }, [profile, currentUser]);

  const toggleFollow = async () => {
    if (!profile) return;
    try {
      if (following) {
        await api.delete(`/api/users/${profile.id}/follow`);
        setFollowing(false);
        setProfile(p => ({ ...p, followerCount: p.followerCount - 1 }));
      } else {
        await api.post(`/api/users/${profile.id}/follow`);
        setFollowing(true);
        setProfile(p => ({ ...p, followerCount: p.followerCount + 1 }));
      }
    } catch { /* ignore */ }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="error">User not found</div>;

  const isOwn = currentUser && currentUser.id === profile.id;

  return (
    <div className="profile-page">
      <header className="profile-header">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="avatar-lg" />
        ) : (
          <div className="avatar-lg avatar-placeholder">{profile.username[0].toUpperCase()}</div>
        )}
        <div className="profile-info">
          <div className="profile-top">
            <h2>{profile.username}</h2>
            {isOwn ? (
              <Link to="/settings" className="btn-secondary">Edit profile</Link>
            ) : currentUser ? (
              <button onClick={toggleFollow} className={following ? 'btn-secondary' : 'btn-primary'}>
                {following ? 'Unfollow' : 'Follow'}
              </button>
            ) : null}
            {currentUser && !isOwn && (
              <Link to={`/messages/${profile.id}`} className="btn-secondary">Message</Link>
            )}
          </div>
          <div className="profile-stats">
            <span><strong>{profile.postCount}</strong> posts</span>
            <span><strong>{profile.followerCount}</strong> followers</span>
            <span><strong>{profile.followingCount}</strong> following</span>
          </div>
          {profile.displayName && <div className="display-name">{profile.displayName}</div>}
          {profile.bio && <div className="bio">{profile.bio}</div>}
        </div>
      </header>

      <div className="profile-posts-grid">
        {posts.length === 0 ? (
          <p className="empty-state">No posts yet.</p>
        ) : (
          posts.map(p => (
            <Link key={p.id} to={`/post/${p.id}`} className="grid-item">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" />
              ) : (
                <div className="grid-text-post">{p.caption}</div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
