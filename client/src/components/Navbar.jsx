import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">Haven</Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/" title="Feed">Home</Link>
              <Link to="/explore" title="Explore">Explore</Link>
              <Link to="/new" title="New post">+ Post</Link>
              <Link to="/messages" title="Messages">Messages</Link>
              <Link to={`/user/${user.username}`} title="Profile">Profile</Link>
              <button onClick={handleLogout} className="btn-link">Logout</button>
            </>
          ) : (
            <>
              <Link to="/explore">Explore</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
