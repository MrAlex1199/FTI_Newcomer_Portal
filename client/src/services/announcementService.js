import apiClient from './apiClient.js';

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const toFormData = (payload, file) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((item) => formData.append(`${key}[]`, item));
    else formData.append(key, value);
  });
  if (file) formData.append('coverImage', file);
  return formData;
};

const bodyAndConfig = (payload, file, onUploadProgress) => ({
  body: file ? toFormData(payload, file) : payload,
  config: file ? { onUploadProgress } : undefined,
});

const announcementService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/announcements', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async categories() {
    const { data } = await apiClient.get('/announcements/categories');
    return data.data;
  },
  async get(id) {
    const { data } = await apiClient.get(`/announcements/${id}`);
    return data.data.announcement;
  },
  async create({ payload, file, onUploadProgress }) {
    const { body, config } = bodyAndConfig(payload, file, onUploadProgress);
    const { data } = await apiClient.post('/announcements', body, config);
    return data.data.announcement;
  },
  async update({ id, payload, file, onUploadProgress }) {
    const { body, config } = bodyAndConfig(payload, file, onUploadProgress);
    const { data } = await apiClient.patch(`/announcements/${id}`, body, config);
    return data.data.announcement;
  },
  async remove(id) {
    await apiClient.delete(`/announcements/${id}`);
  },
};

export default announcementService;
