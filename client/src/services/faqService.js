import apiClient from './apiClient.js';

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const faqService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/faq', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async categories() {
    const { data } = await apiClient.get('/faq/categories');
    return data.data.categories;
  },
  async get(id) {
    const { data } = await apiClient.get(`/faq/${id}`);
    return data.data.faq;
  },
  async create(payload) {
    const { data } = await apiClient.post('/faq', payload);
    return data.data.faq;
  },
  async update(id, payload) {
    const { data } = await apiClient.patch(`/faq/${id}`, payload);
    return data.data.faq;
  },
  async remove(id) {
    await apiClient.delete(`/faq/${id}`);
  },
  async reorder(category, items) {
    const { data } = await apiClient.patch('/faq/reorder', { category, items });
    return data.data.faqs;
  },
};

export default faqService;
