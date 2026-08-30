import apiClient from './apiClient.js';

const cleanParams = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const knowledgeService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/knowledge', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async categories() {
    const { data } = await apiClient.get('/knowledge/categories');
    return data.data;
  },
  async quickLinks(params = {}) {
    const { data } = await apiClient.get('/knowledge/it-help/quick-links', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async get(id) {
    const { data } = await apiClient.get(`/knowledge/${id}`);
    return data.data.article;
  },
  async vote(id, vote) {
    const { data } = await apiClient.post(`/knowledge/${id}/helpfulness`, { vote });
    return data.data;
  },
  async create(payload) {
    const { data } = await apiClient.post('/knowledge', payload);
    return data.data.article;
  },
  async update(id, payload) {
    const { data } = await apiClient.patch(`/knowledge/${id}`, payload);
    return data.data.article;
  },
  async remove(id) {
    await apiClient.delete(`/knowledge/${id}`);
  },
};

export default knowledgeService;
