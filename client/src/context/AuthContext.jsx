import { createContext, useContext, useState, useEffect } from 'react';
import api from '../hooks/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('haven_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/api/auth/me')
      .then(res => setUser(res))
      .catch(() => localStorage.removeItem('haven_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (login, password) => {
    const res = await api.post('/api/auth/login', { login, password });
    localStorage.setItem('haven_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (username, email, password, displayName) => {
    const res = await api.post('/api/auth/register', { username, email, password, displayName });
    localStorage.setItem('haven_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('haven_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
