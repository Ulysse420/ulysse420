import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('bio', bio);
    if (avatar) formData.append('avatar', avatar);

    try {
      await api.put('/api/users/me', formData, true);
      setMessage('Profile updated!');
      // Refresh user data
      const updated = await api.get('/api/auth/me');
      setUser(updated);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="edit-profile-page">
      <h2>Edit Profile</h2>
      {message && <div className="info">{message}</div>}
      <form onSubmit={handleSubmit}>
        <label>Display name</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />

        <label>Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />

        <label>Avatar</label>
        <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} />

        <button type="submit" className="btn-primary">Save changes</button>
      </form>
    </div>
  );
}
