import apiClient from './apiClient.js';

const toFormData = (payload, file, fieldName) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (file) formData.append(fieldName, file);
  return formData;
};

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const requestBody = (payload, file, fieldName) => file ? toFormData(payload, file, fieldName) : payload;
const requestConfig = (file, onUploadProgress) => file ? { onUploadProgress } : undefined;

const internService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/interns', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async get(id) {
    const { data } = await apiClient.get(`/interns/${id}`);
    return data.data.intern;
  },
  async create(payload, file, onUploadProgress) {
    const { data } = await apiClient.post('/interns', requestBody(payload, file, 'profileImage'), requestConfig(file, onUploadProgress));
    return data.data.intern;
  },
  async update(id, payload, file, onUploadProgress) {
    const { data } = await apiClient.patch(`/interns/${id}`, requestBody(payload, file, 'profileImage'), requestConfig(file, onUploadProgress));
    return data.data.intern;
  },
  async remove(id) {
    await apiClient.delete(`/interns/${id}`);
  },
};

export default internService;
