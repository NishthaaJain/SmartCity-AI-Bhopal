import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_city_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const complaintsAPI = {
  submit: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  checkDuplicate: (data) => api.post('/complaints/check-duplicate', data),
  getUserComplaints: () => api.get('/complaints'),
  getById: (id) => api.get(`/complaints/${id}`),
  reopen: (id, remark) => api.post(`/complaints/${id}/reopen`, { remark }),
};

export const adminAPI = {
  getAllComplaints: (params) => api.get('/admin/complaints', { params }),
  updateStatus: (id, status, resolution_remark = null) => api.patch(`/admin/complaints/${id}/status`, { status, resolution_remark }),
  getAnalytics: () => api.get('/admin/analytics'),
  getDepartments: () => api.get('/admin/super/departments'),
  getUsers: () => api.get('/admin/super/users'),
  reassignDepartment: (id, department_id) => api.post(`/admin/super/reassign/${id}`, { department_id }),
  correctCategory: (id, category) => api.patch(`/admin/super/complaints/${id}/category`, { category }),
};

export const predictAPI = {
  classifyComplaint: (description) => api.post('/predict/classify-complaint', { description }),
  analyzeComplaint: (description) => api.post('/predict/analyze-complaint', { description }),
  getTraffic: (params) => api.get('/predict/traffic', { params }),
  getWaste: (params) => api.get('/predict/waste', { params }),
  getPollution: (params) => api.get('/predict/pollution', { params }),
};


export default api;
