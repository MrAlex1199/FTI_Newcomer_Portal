import apiClient from './apiClient.js';

const facilityService = {
  async getAll() {
    const { data } = await apiClient.get('/facilities');
    return data.data.facilities || [];
  },

  async create(payload) {
    const { data } = await apiClient.post('/facilities', payload);
    return data.data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/facilities/${id}`, payload);
    return data.data.facility;
  },

  async delete(id) {
    const { data } = await apiClient.delete(`/facilities/${id}`);
    return data;
  },

  async addFloor(id, payload = {}) {
    const { data } = await apiClient.post(`/facilities/${id}/floors`, payload);
    return data.data;
  },

  async deleteFloor(id, floorNumber) {
    const { data } = await apiClient.delete(`/facilities/${id}/floors/${floorNumber}`);
    return data.data;
  },
};

export default facilityService;
