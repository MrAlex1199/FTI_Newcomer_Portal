import apiClient from './apiClient.js';

const adminDashboardService = {
  async statistics(params = {}) {
    const { data } = await apiClient.get('/admin/dashboard/statistics', { params });
    return data.data;
  },
};

export default adminDashboardService;
