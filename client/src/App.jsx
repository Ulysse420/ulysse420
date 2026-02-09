import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Login from './pages/Login';
import Register from './pages/Register';
import NewPost from './pages/NewPost';
import EditProfile from './pages/EditProfile';
import Sessions from './pages/Sessions';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/new" element={<ProtectedRoute><NewPost /></ProtectedRoute>} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:userId" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
