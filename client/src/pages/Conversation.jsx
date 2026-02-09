import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

export default function Conversation() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/api/messages/${userId}`).then(setMessages).catch(() => {});
    // Fetch other user's info by iterating users endpoint isn't ideal,
    // but we can get it from conversation or just show the ID for now
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/api/messages/${userId}`).then(setMessages).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const send = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      const msg = await api.post(`/api/messages/${userId}`, { body: newMsg.trim() });
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch { /* ignore */ }
  };

  return (
    <div className="conversation-page">
      <h2>Conversation</h2>
      <div className="message-list">
        {messages.map(m => (
          <div key={m.id} className={`message ${m.senderId === user.id ? 'sent' : 'received'}`}>
            <div className="message-bubble">{m.body}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary btn-sm">Send</button>
      </form>
    </div>
  );
}
