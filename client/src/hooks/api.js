const BASE = '';

async function request(method, url, body, isFormData = false) {
  const headers = {};
  const token = localStorage.getItem('haven_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };

  if (body) {
    if (isFormData) {
      opts.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}${url}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  get: (url) => request('GET', url),
  post: (url, body, isFormData) => request('POST', url, body, isFormData),
  put: (url, body, isFormData) => request('PUT', url, body, isFormData),
  delete: (url) => request('DELETE', url),
};

export default api;
