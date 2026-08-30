import apiClient from './apiClient.js';

const departmentService = {
  async list() {
    const { data } = await apiClient.get('/departments');
    return data.data;
  },

  async get(id) {
    const { data } = await apiClient.get(`/departments/${id}`);
    return data.data.department;
  },

  async create(payload) {
    const { data } = await apiClient.post('/departments', payload);
    return data.data.department;
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/departments/${id}`, payload);
    return data.data.department;
  },

  async remove(id) {
    await apiClient.delete(`/departments/${id}`);
  },
};

export default departmentService;
