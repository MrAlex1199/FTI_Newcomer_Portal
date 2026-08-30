import apiClient from './apiClient.js';

const departmentService = {
  async list() {
    const { data } = await apiClient.get('/departments');
    return data.data;
  },
};

export default departmentService;
