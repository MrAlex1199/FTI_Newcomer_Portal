import apiClient from './apiClient.js';

const auditLogService = {
  list: (params = {}) => apiClient.get('/admin/audit-logs', { params }).then((response) => response.data),
};

export default auditLogService;
