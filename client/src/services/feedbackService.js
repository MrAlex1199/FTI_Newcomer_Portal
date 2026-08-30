import apiClient from './apiClient.js';

const feedbackService = {
  submit: (payload) => apiClient.post('/feedback', payload).then((response) => response.data),
  list: (params = {}) => apiClient.get('/feedback', { params }).then((response) => response.data),
  updateStatus: ({ id, status, adminNote }) => apiClient.patch(`/feedback/${id}/status`, { status, adminNote }).then((response) => response.data),
};

export default feedbackService;
