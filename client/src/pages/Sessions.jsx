import { useState, useEffect } from 'react';
import api from '../hooks/api';

function parseUserAgent(ua) {
  if (!ua) return 'Unknown device';
  // Extract browser
  let browser = 'Unknown browser';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';

  // Extract OS
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr + 'Z');
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await api.get('/api/sessions');
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function revokeSession(id) {
    setRevoking(id);
    try {
      await api.delete(`/api/sessions/${id}`);
      setSessions(prev => prev.map(s =>
        s.id === id ? { ...s, isActive: false } : s
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAll() {
    setRevoking('all');
    try {
      await api.delete('/api/sessions');
      setSessions(prev => prev.map(s =>
        s.isCurrent ? s : { ...s, isActive: false }
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(null);
    }
  }

  if (loading) return <div className="loading">Loading sessions...</div>;

  const activeSessions = sessions.filter(s => s.isActive);
  const revokedSessions = sessions.filter(s => !s.isActive);

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h2>Active Sessions</h2>
        {activeSessions.length > 1 && (
          <button
            className="btn-secondary btn-sm"
            onClick={revokeAll}
            disabled={revoking === 'all'}
          >
            {revoking === 'all' ? 'Revoking...' : 'Revoke all others'}
          </button>
        )}
      </div>

      <p className="sessions-description">
        These are the devices currently logged into your account. Revoke any session you don't recognize.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="session-list">
        {activeSessions.map(session => (
          <div key={session.id} className={`session-item ${session.isCurrent ? 'current' : ''}`}>
            <div className="session-info">
              <div className="session-device">
                {parseUserAgent(session.userAgent)}
                {session.isCurrent && <span className="session-badge">Current</span>}
              </div>
              <div className="session-meta">
                <span>ID: {session.id.slice(0, 8)}...</span>
                <span>Created: {timeAgo(session.createdAt)}</span>
                <span>Last active: {timeAgo(session.lastActiveAt)}</span>
              </div>
            </div>
            {!session.isCurrent && (
              <button
                className="btn-danger btn-sm"
                onClick={() => revokeSession(session.id)}
                disabled={revoking === session.id}
              >
                {revoking === session.id ? 'Revoking...' : 'Revoke'}
              </button>
            )}
          </div>
        ))}
        {activeSessions.length === 0 && (
          <div className="empty-state">No active sessions found.</div>
        )}
      </div>

      {revokedSessions.length > 0 && (
        <>
          <h3 className="revoked-heading">Revoked Sessions</h3>
          <div className="session-list">
            {revokedSessions.map(session => (
              <div key={session.id} className="session-item revoked">
                <div className="session-info">
                  <div className="session-device">{parseUserAgent(session.userAgent)}</div>
                  <div className="session-meta">
                    <span>ID: {session.id.slice(0, 8)}...</span>
                    <span>Created: {timeAgo(session.createdAt)}</span>
                  </div>
                </div>
                <span className="session-revoked-label">Revoked</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
