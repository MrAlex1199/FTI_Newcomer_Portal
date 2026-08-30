import apiClient from './apiClient.js';

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const policyService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/policies', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async categories() {
    const { data } = await apiClient.get('/policies/categories');
    return data.data.categories;
  },
  async get(id) {
    const { data } = await apiClient.get(`/policies/${id}`);
    return data.data.policy;
  },
  async create(payload) {
    const { data } = await apiClient.post('/policies', payload);
    return data.data.policy;
  },
  async update(id, payload) {
    const { data } = await apiClient.patch(`/policies/${id}`, payload);
    return data.data.policy;
  },
  async remove(id) {
    await apiClient.delete(`/policies/${id}`);
  },
};

export default policyService;
