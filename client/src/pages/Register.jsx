import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.username, form.email, form.password, form.displayName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Join Haven</h1>
        <p className="subtitle">No ads. No tracking. Just people.</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Display name" value={form.displayName} onChange={update('displayName')} />
          <input type="text" placeholder="Username" value={form.username} onChange={update('username')} required />
          <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
          <input type="password" placeholder="Password (8+ characters)" value={form.password} onChange={update('password')} required minLength={8} />
          <button type="submit" className="btn-primary">Create account</button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
