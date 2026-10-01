import apiClient from './apiClient.js';

const vaultService = {
  async getStatus() {
    const { data } = await apiClient.get('/vault/status');
    return data.data;
  },

  async setupPin(payload) {
    const { data } = await apiClient.post('/vault/setup-pin', payload);
    return data.data;
  },

  async verifyPin(pin) {
    const { data } = await apiClient.post('/vault/verify-pin', { pin });
    return data.data;
  },

  async changePin(payload) {
    const { data } = await apiClient.post('/vault/change-pin', payload);
    return data;
  },

  async getItems(params = {}, pin = '') {
    const headers = {};
    if (pin) headers['x-vault-pin'] = pin;
    const { data } = await apiClient.get('/vault/items', { params, headers });
    return data.data || [];
  },

  async createItem(payload, pin = '') {
    const headers = {};
    if (pin) headers['x-vault-pin'] = pin;
    const { data } = await apiClient.post('/vault/items', payload, { headers });
    return data.data;
  },

  async updateItem(id, payload, pin = '') {
    const headers = {};
    if (pin) headers['x-vault-pin'] = pin;
    const { data } = await apiClient.put(`/vault/items/${id}`, payload, { headers });
    return data.data;
  },

  async deleteItem(id) {
    const { data } = await apiClient.delete(`/vault/items/${id}`);
    return data;
  },

  async toggleFavorite(id) {
    const { data } = await apiClient.patch(`/vault/items/${id}/favorite`);
    return data.data;
  },
};

export default vaultService;
