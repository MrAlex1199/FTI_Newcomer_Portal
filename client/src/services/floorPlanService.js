import apiClient from './apiClient.js';

const floorPlanService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get('/floor-plans', { params });
    return {
      floorPlans: data.data.floorPlans || [],
      facilities: data.data.facilities || [],
      totalCampusAreaRai: data.data.totalCampusAreaRai || 20,
    };
  },

  async getById(id) {
    const { data } = await apiClient.get(`/floor-plans/${id}`);
    return data.data.floorPlan;
  },

  async searchCampusAssets(q = '') {
    const { data } = await apiClient.get('/floor-plans/assets/search', {
      params: { q },
    });
    return data.data.assets || [];
  },

  async duplicateLayout(id, sourcePlanId) {
    const { data } = await apiClient.post(`/floor-plans/${id}/duplicate-layout`, {
      sourcePlanId,
    });
    return data.data.floorPlan;
  },

  async create(payload) {
    const { data } = await apiClient.post('/floor-plans', payload);
    return data.data.floorPlan;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/floor-plans/${id}`, payload);
    return data.data.floorPlan;
  },

  async delete(id) {
    const { data } = await apiClient.delete(`/floor-plans/${id}`);
    return data;
  },

  async uploadBackgroundImage(id, file) {
    const formData = new FormData();
    formData.append('backgroundImage', file);
    const { data } = await apiClient.post(`/floor-plans/${id}/background-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },
};

export default floorPlanService;
