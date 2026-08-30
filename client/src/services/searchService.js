import apiClient from './apiClient.js';

const searchService = {
  async search(params = {}) {
    const { data } = await apiClient.get('/search', { params });
    return data.data;
  },
};

export default searchService;
