import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../hooks/api';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/messages/conversations')
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="messages-page">
      <h2>Messages</h2>
      {conversations.length === 0 ? (
        <p className="empty-state">No conversations yet. Visit someone's profile to send them a message.</p>
      ) : (
        <div className="conversation-list">
          {conversations.map(c => (
            <Link key={c.user.id} to={`/messages/${c.user.id}`} className="conversation-item">
              {c.user.avatarUrl ? (
                <img src={c.user.avatarUrl} alt="" className="avatar-sm" />
              ) : (
                <div className="avatar-sm avatar-placeholder">{c.user.username[0].toUpperCase()}</div>
              )}
              <div className="conversation-info">
                <span className="username">{c.user.username}</span>
                {c.lastMessage && (
                  <span className="last-message">{c.lastMessage.body}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
