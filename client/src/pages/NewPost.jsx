import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../hooks/api';

export default function NewPost() {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !caption.trim()) {
      setError('Add an image or write something');
      return;
    }
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    if (file) formData.append('image', file);
    if (caption.trim()) formData.append('caption', caption.trim());

    try {
      const post = await api.post('/api/posts', formData, true);
      navigate(`/post/${post.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-post-page">
      <h2>New Post</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="upload-area">
          {preview ? (
            <img src={preview} alt="Preview" className="upload-preview" />
          ) : (
            <label className="upload-label">
              <span>Click to add a photo</span>
              <input type="file" accept="image/*" onChange={handleFile} hidden />
            </label>
          )}
          {preview && (
            <button type="button" className="btn-link" onClick={() => { setFile(null); setPreview(null); }}>
              Remove
            </button>
          )}
        </div>
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
        />
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Posting...' : 'Share'}
        </button>
      </form>
    </div>
  );
}
