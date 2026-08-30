import apiClient from './apiClient.js';

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const organizationService = {
  async getTree(params = {}) {
    const { data } = await apiClient.get('/organization/tree', { params: cleanParams(params) });
    return data.data;
  },

  async updateReporting(employeeId, managerId) {
    const { data } = await apiClient.patch(`/organization/reporting/${employeeId}`, { managerId });
    return data.data.employee;
  },
};

export default organizationService;
