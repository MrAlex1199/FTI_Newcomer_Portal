import apiClient from './apiClient.js';

const toFormData = (payload, file) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (file) formData.append('groupPhoto', file);
  return formData;
};

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const batchService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/intern-batches', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async get(id) {
    const { data } = await apiClient.get(`/intern-batches/${id}`);
    return data.data.batch;
  },
  async create(payload, file, onUploadProgress) {
    const body = file ? toFormData(payload, file) : payload;
    const { data } = await apiClient.post('/intern-batches', body, file ? { onUploadProgress } : undefined);
    return data.data.batch;
  },
  async update(id, payload, file, onUploadProgress) {
    const body = file ? toFormData(payload, file) : payload;
    const { data } = await apiClient.patch(`/intern-batches/${id}`, body, file ? { onUploadProgress } : undefined);
    return data.data.batch;
  },
  async remove(id) {
    await apiClient.delete(`/intern-batches/${id}`);
  },
};

export default batchService;
