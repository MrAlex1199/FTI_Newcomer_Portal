import apiClient from './apiClient.js';

const companyService = {
  async get() {
    const { data } = await apiClient.get('/company');
    return data.data.company;
  },
  async update(payload) {
    const { data } = await apiClient.patch('/company', payload);
    return data.data.company;
  },
};

export default companyService;
