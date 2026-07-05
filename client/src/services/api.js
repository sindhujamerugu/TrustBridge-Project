import axios from 'axios';

// VITE_API_URL should be '/api' in dev (uses Vite proxy) or the full URL in production.
// VITE_BACKEND_URL is the backend origin used for /uploads/ image URLs.
const API_URL     = import.meta.env.VITE_API_URL     || '/api';
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Exported for image URL resolution only — not used for API calls.
export const BACKEND_URL = BACKEND_ORIGIN;

// Resolve a potentially-relative image path to a full URL.
export function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
  `${API_URL}/auth/refresh`,
  { refreshToken }
);
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }),
  googleAuth: (credential, role) => api.post('/auth/google', { credential, role }),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCommunityProfile: (data) => api.put('/users/me/community-profile', data),
  getResidents: (params) => api.get('/users/residents', { params }),
  getResident: (id) => api.get(`/users/residents/${id}`),
  getNewcomers: (params) => api.get('/users/newcomers', { params }),
  getSettings: () => api.get('/users/me/settings'),
  updateSettings: (data) => api.put('/users/me/settings', data),
  changePassword: (data) => api.put('/users/me/change-password', data),
};

export const serviceAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getCategories: () => api.get('/services/categories'),
  getLocations: () => api.get('/services/locations'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  patchStatus: (id, status) => api.patch(`/services/${id}/status`, { status }),
  delete: (id) => api.delete(`/services/${id}`),
  getMyServices: () => api.get('/services/provider/my-services'),
  uploadImages: (id, formData) => api.post(`/services/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteImage: (id, imageUrl) => api.delete(`/services/${id}/images`, { data: { imageUrl } }),
  // New workflow endpoints
  uploadDocuments: (id, formData) => api.post(`/services/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getVerificationStatus: (id) => api.get(`/services/${id}/verification-status`),
  activateService: (id) => api.post(`/services/${id}/activate`),
};

export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

export const reviewAPI = {
  getByService: (serviceId) => api.get(`/reviews/service/${serviceId}`),
  create: (data) => {
    // If images are included, send as multipart/form-data
    if (data.images && data.images.length > 0) {
      const fd = new FormData();
      fd.append('serviceId', data.serviceId);
      fd.append('rating',    String(data.rating));
      fd.append('content',   data.content);
      if (data.bookingId) fd.append('bookingId', data.bookingId);
      data.images.forEach(img => fd.append('images', img));
      return api.post('/reviews', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    // No images — send as JSON (preserves duplicate/relevance check body parsing)
    return api.post('/reviews', data);
  },
  getPending: () => api.get('/reviews/pending'),
  moderate: (id, action) => api.patch(`/reviews/${id}/moderate`, { action }),
};

export const paymentAPI = {
  getPlans:        ()                    => api.get('/payments/plans'),
  createOrder:     (plan, serviceId)     => api.post('/payments/create-order', { plan, serviceId }),
  verify:          (data)                => api.post('/payments/verify', data),
  recordFailure:   (data)                => api.post('/payments/failure', data),
  getSubscription: ()                    => api.get('/payments/subscription'),
  getHistory:      ()                    => api.get('/payments/history'),
};

export const communityAPI = {
  getAll:       (params) => api.get('/community', { params }),
  getById:      (id)     => api.get(`/community/${id}`),
  create:       (data)   => api.post('/community', data),
  addAnswer:    (id, content) => api.post(`/community/${id}/answers`, { content }),
  resolve:      (id)     => api.patch(`/community/${id}/resolve`),
  likePost:     (id)     => api.post(`/community/${id}/like`),
  likeAnswer:   (id, answerId) => api.post(`/community/${id}/answers/${answerId}/like`),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (participantId) => api.post('/chat/conversations', { participantId }),
  getMessages: (id) => api.get(`/chat/conversations/${id}/messages`),
  sendMessage: (id, data) => api.post(`/chat/conversations/${id}/messages`, data),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const rewardAPI = {
  getAll: () => api.get('/rewards'),
};

export const verificationAPI = {
  sendOTP: (phone) => api.post('/verification/otp/send', { phone }),
  verifyOTP: (phone, otp) => api.post('/verification/otp/verify', { phone, otp }),
  // New: upload Aadhaar image for AI OCR verification
  uploadAadhaarDocument: (file) => {
    const fd = new FormData();
    fd.append('aadhaar', file);
    return api.post('/verification/aadhaar/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Legacy text-based fallback
  uploadAadhaar: (data) => api.post('/verification/aadhaar', data),
  uploadSelfie: (data) => api.post('/verification/selfie', data),
  uploadAddress: (data) => api.post('/verification/address', data),
  getStatus: () => api.get('/verification/status'),
  updateProfile: (data) => api.put('/verification/profile', data),
};

export const providerAPI = {
  register: (data) => api.post('/providers/register', data),
  getStatus: () => api.get('/providers/status'),
  getAnalytics: () => api.get('/providers/analytics'),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getPendingProviders: () => api.get('/admin/providers/pending'),
  verifyProvider: (id, action) => api.patch(`/admin/providers/${id}/verify`, { action }),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
  getDuplicates: () => api.get('/admin/fraud/duplicates'),
};
