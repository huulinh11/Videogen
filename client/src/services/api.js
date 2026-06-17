const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('videogen_admin_token');
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // API Keys
  getKeys: () => request('/keys'),
  getActiveKeys: () => request('/keys/active'),
  createKey: (key_value, label) =>
    request('/keys', {
      method: 'POST',
      body: JSON.stringify({ key_value, label }),
    }),
  updateKey: (id, data) =>
    request(`/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteKey: (id) =>
    request(`/keys/${id}`, { method: 'DELETE' }),

  // Generate
  generate: (payload, api_key_id) =>
    request('/generate', {
      method: 'POST',
      body: JSON.stringify({ payload, api_key_id }),
    }),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob: (id) => request(`/jobs/${id}`),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),

  // Upload
  upload: (filename, mimeType, base64Data) =>
    request('/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, mimeType, base64Data }),
    }),

  // Models
  getModels: () => request('/models'),

  // Test
  testGenerate: (api_key, payload) =>
    request('/test/generate', {
      method: 'POST',
      body: JSON.stringify({ api_key, payload }),
    }),
  testUpload: (api_key, filename, mimeType, base64Data) =>
    request('/test/upload', {
      method: 'POST',
      body: JSON.stringify({ api_key, filename, mimeType, base64Data }),
    }),
  testJobStatus: (api_key, job_id) =>
    request('/test/job-status', {
      method: 'POST',
      body: JSON.stringify({ api_key, job_id }),
    }),
  getSavedKeys: () => request('/test/saved-keys'),
};
