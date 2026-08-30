import apiClient from './apiClient.js';

/**
 * Thin wrapper over the /auth endpoints. Each function returns the unwrapped
 * payload the caller actually needs, so components and context never touch the
 * axios response envelope directly.
 */
const authService = {
  async login(username, password) {
    const { data } = await apiClient.post('/auth/login', { username, password });
    return data.data.user;
  },

  async register({ username, email, password }) {
    const { data } = await apiClient.post('/auth/register', { username, email, password });
    return data.data.user;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async getMe() {
    const { data } = await apiClient.get('/auth/me');
    return data.data.user;
  },
};

export default authService;
