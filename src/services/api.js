const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('ev_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('ev_token');
    window.location.href = '/login';
    throw new Error('登录已过期，请重新登录');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
};

// Helper methods
const get = (url) => fetch(`${BASE_URL}${url}`, { headers: getHeaders() }).then(handleResponse);
const post = (url, body) => fetch(`${BASE_URL}${url}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);
const put = (url, body) => fetch(`${BASE_URL}${url}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);
const del = (url) => fetch(`${BASE_URL}${url}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse);

// Auth APIs
export const authAPI = {
  login: (phone, password) => post('/auth/login', { phone, password }),
  register: (phone, password, name) => post('/auth/register', { phone, password, name }),
  getProfile: () => get('/auth/profile'),
  updateProfile: (name) => put('/auth/profile', { name }),
  recharge: (amount) => post('/auth/recharge', { amount }),
};

// Station APIs
export const stationAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return get(`/stations${query ? '?' + query : ''}`);
  },
  get: (id) => get(`/stations/${id}`),
  getPlugs: (id) => get(`/stations/${id}/plugs`),
  getStats: (id) => get(`/stations/${id}/stats`),
  create: (data) => post('/stations', data),
  update: (id, data) => put(`/stations/${id}`, data),
};

// Session APIs
export const sessionAPI = {
  start: (stationId) => post('/sessions/start', { station_id: stationId }),
  stop: (id) => post(`/sessions/${id}/stop`),
  getActive: () => get('/sessions/active'),
  getHistory: (page = 1, pageSize = 10) => get(`/sessions/history?page=${page}&pageSize=${pageSize}`),
  get: (id) => get(`/sessions/${id}`),
};

// Payment APIs
export const paymentAPI = {
  getHistory: (page = 1, pageSize = 10) => get(`/payments/history?page=${page}&pageSize=${pageSize}`),
  create: (sessionId, method) => post('/payments/create', { session_id: sessionId, method }),
  confirm: (id) => post(`/payments/${id}/confirm`),
  getStats: () => get('/payments/stats'),
};

// Reservation APIs
export const reservationAPI = {
  create: (data) => post('/reservations', data),
  list: () => get('/reservations'),
  cancel: (id) => del(`/reservations/${id}`),
  getByStation: (stationId) => get(`/reservations/station/${stationId}`),
};

// Stats APIs (admin)
export const statsAPI = {
  getOverview: () => get('/stats/overview'),
  getRevenueTrend: (days = 7) => get(`/stats/revenue-trend?days=${days}`),
  getHourlySessions: () => get('/stats/hourly-sessions'),
  getUserSegments: () => get('/stats/user-segments'),
  getStationRanking: (sortBy = 'revenue') => get(`/stats/station-ranking?sortBy=${sortBy}`),
  getBehaviorMetrics: () => get('/stats/behavior-metrics'),
};

// User management APIs (admin)
export const userAPI = {
  list: (page = 1, pageSize = 10, search = '', status = '') => {
    const params = new URLSearchParams({ page, pageSize, search, status });
    return get(`/users?${params}`);
  },
  updateStatus: (id, status) => put(`/users/${id}/status`, { status }),
  getDetails: (id) => get(`/users/${id}/details`),
};

export default { authAPI, stationAPI, sessionAPI, paymentAPI, reservationAPI, statsAPI, userAPI };
