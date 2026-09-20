import apiClient from './apiClient.js';

const maintenanceService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get('/maintenance-tickets', { params });
    return data.data || [];
  },

  async create(payload) {
    const { data } = await apiClient.post('/maintenance-tickets', payload);
    return data;
  },

  async updateStatus(id, payload) {
    const { data } = await apiClient.put(`/maintenance-tickets/${id}/status`, payload);
    return data;
  },

  async getKpiSummary(params = {}) {
    const { data } = await apiClient.get('/maintenance-tickets/kpi-summary', { params });
    return data.data || {};
  },

  async deleteTicket(id) {
    const { data } = await apiClient.delete(`/maintenance-tickets/${id}`);
    return data;
  },
};

export default maintenanceService;
