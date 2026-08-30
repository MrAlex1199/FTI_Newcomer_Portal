import apiClient from './apiClient.js';

const toFormData = (payload, file) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) value.forEach((item) => formData.append(`${key}[]`, item));
      else formData.append(key, value);
    }
  });
  if (file) formData.append('profileImage', file);
  return formData;
};

const bodyAndConfig = (payload, file, onUploadProgress) => ({
  body: file ? toFormData(payload, file) : payload,
  config: file ? { onUploadProgress } : undefined,
});

const employeeService = {
  async list(params = {}) {
    const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));
    const { data } = await apiClient.get('/employees', { params: clean });
    return { data: data.data, pagination: data.pagination };
  },
  async get(id) {
    const { data } = await apiClient.get(`/employees/${id}`);
    return data.data.employee;
  },
  async create(payload, file, onUploadProgress) {
    const { body, config } = bodyAndConfig(payload, file, onUploadProgress);
    const { data } = await apiClient.post('/employees', body, config);
    return data.data.employee;
  },
  async update(id, payload, file, onUploadProgress) {
    const { body, config } = bodyAndConfig(payload, file, onUploadProgress);
    const { data } = await apiClient.patch(`/employees/${id}`, body, config);
    return data.data.employee;
  },
  async remove(id) {
    await apiClient.delete(`/employees/${id}`);
  },
};

export default employeeService;
