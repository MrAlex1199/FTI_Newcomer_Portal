import apiClient from './apiClient.js';

const unwrap = (request) => request.then((response) => response.data);

const adminUserService = {
  list: (params = {}) => unwrap(apiClient.get('/admin/users', { params })),
  create: (payload) => unwrap(apiClient.post('/admin/users', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/admin/users/${id}`, payload)),
  resetPassword: ({ id, password }) => unwrap(apiClient.post(`/admin/users/${id}/reset-password`, password ? { password } : {})),
  bulkDeactivate: (userIds) => unwrap(apiClient.post('/admin/users/bulk/deactivate', { userIds })),
};

export default adminUserService;
