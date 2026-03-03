import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

// ✅ Axios instance with auto token
const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Attach token to EVERY request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ✅ Handle expired token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// ✅ messagesApi — matches ALL calls in Messages.jsx
// ============================================
export const messagesApi = {

  // messagesApi.conversations() → GET /api/messages/conversations
  conversations: async () => {
    const res = await api.get('/api/messages/conversations');
    return res.data;
  },

  // messagesApi.list() → GET /api/messages (all your messages)
  list: async () => {
    const res = await api.get('/api/messages');
    return res.data;
  },

  // messagesApi.send({ receiverId, content, skillId? })
  send: async (payload) => {
    const res = await api.post('/api/messages', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },

  // messagesApi.uploadPdf(file) → { url, originalName }
  uploadPdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/messages/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // messagesApi.markRead(messageId)
  markRead: async (id) => {
    const res = await api.patch(`/api/messages/${id}/read`);
    return res.data;
  },

  // messagesApi.delete(messageId)
  delete: async (id) => {
    const res = await api.delete(`/api/messages/${id}`);
    return res.data;
  },
};

// ---------- new APIs ----------

export const authApi = {
  register: async (payload) => {
    const res = await api.post('/api/auth/register', payload);
    return res.data;
  },
  login: async (payload) => {
    const res = await api.post('/api/auth/login', payload);
    return res.data;
  },
  me: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};

export const skillsApi = {
  list: async () => {
    const res = await api.get('/api/skills');
    return res.data;
  },
  my: async () => {
    const res = await api.get('/api/skills/my');
    return res.data;
  },
  add: async (payload) => {
    const res = await api.post('/api/skills', payload);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/skills/${id}`);
    return res.data;
  },
};

export const reportsApi = {
  // Submit a report
  submit: async (data) => {
    const res = await api.post('/api/reports', data);
    return res.data;
  },
  
  // Get my submitted reports
  myReports: async () => {
    const res = await api.get('/api/reports/my-reports');
    return res.data;
  },
  
  // Get reports against me
  againstMe: async () => {
    const res = await api.get('/api/reports/against-me');
    return res.data;
  },
};

// ============================================
// ✅ adminApi — Admin panel functions
// ============================================
export const adminApi = {
  // Get all users
  getUsers: async () => {
    const res = await api.get('/api/admin/users');
    return res.data;
  },

  // Get single user
  getUser: async (id) => {
    const res = await api.get(`/api/admin/users/${id}`);
    return res.data;
  },

  // Update user
  updateUser: async (id, data) => {
    const res = await api.put(`/api/admin/users/${id}`, data);
    return res.data;
  },

  // Ban/Unban user
  banUser: async (id, isBanned) => {
    const res = await api.put(`/api/admin/users/${id}/ban`, { isBanned });
    return res.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const res = await api.delete(`/api/admin/users/${id}`);
    return res.data;
  },

  // Get stats
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data;
  },
};

export default api;