import apiClient from './apiClient.js';

const bookingService = {
  async getResources(params = {}) {
    const { data } = await apiClient.get('/bookings/resources', { params });
    return data.data || [];
  },

  async createResource(payload) {
    const { data } = await apiClient.post('/bookings/resources', payload);
    return data.data;
  },

  async updateResource(id, payload) {
    const { data } = await apiClient.patch(`/bookings/resources/${id}`, payload);
    return data.data;
  },

  async deleteResource(id) {
    const { data } = await apiClient.delete(`/bookings/resources/${id}`);
    return data;
  },

  async getBookings(params = {}) {
    const { data } = await apiClient.get('/bookings', { params });
    return data.data || [];
  },

  async checkAvailability(params = {}) {
    const { data } = await apiClient.get('/bookings/check-availability', { params });
    return data.data;
  },

  async createBooking(payload) {
    const { data } = await apiClient.post('/bookings', payload);
    return data.data;
  },

  async cancelBooking(id, payload = {}) {
    const { data } = await apiClient.patch(`/bookings/${id}/cancel`, payload);
    return data.data;
  },

  async getStats() {
    const { data } = await apiClient.get('/bookings/stats');
    return data.data || {};
  },
};

export default bookingService;
