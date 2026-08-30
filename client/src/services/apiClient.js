import axios from 'axios';

/**
 * Shared axios instance for all API calls.
 *
 * `withCredentials: true` is essential - the access/refresh tokens live in
 * HttpOnly cookies, so the browser must be told to send them cross-origin
 * (Vite dev server on :5173 -> API on :5000).
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Transparent access-token refresh.
 *
 * When any request comes back 401, we attempt a single silent /auth/refresh
 * and replay the original request. This keeps the 15-minute access token
 * invisible to the UI - the user only gets bounced to login when the refresh
 * token itself is gone or revoked.
 *
 * Guards against loops:
 *  - the refresh call itself is excluded (a 401 there is terminal)
 *  - each request is retried at most once (_retry flag)
 *  - concurrent 401s share a single in-flight refresh promise
 */
let refreshPromise = null;

const AUTH_EXEMPT = ['/auth/login', '/auth/refresh', '/auth/register'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || response.status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (config._retry || AUTH_EXEMPT.some((path) => config.url?.includes(path))) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      // Collapse simultaneous 401s into one refresh round-trip.
      if (!refreshPromise) {
        refreshPromise = apiClient.post('/auth/refresh').finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return apiClient(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
