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

const knowledgeService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/knowledge', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async categories() {
    const { data } = await apiClient.get('/knowledge/categories');
    return data.data;
  },
  async quickLinks(params = {}) {
    const { data } = await apiClient.get('/knowledge/it-help/quick-links', { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async get(id) {
    const { data } = await apiClient.get(`/knowledge/${id}`);
    return data.data.article;
  },
  async vote(id, vote) {
    const { data } = await apiClient.post(`/knowledge/${id}/helpfulness`, { vote });
    return data.data;
  },
  async create(arg1) {
    let payload = arg1;
    let file;
    let onUploadProgress;
    if (arg1 && typeof arg1 === 'object' && ('payload' in arg1 || 'file' in arg1)) {
      payload = arg1.payload;
      file = arg1.file;
      onUploadProgress = arg1.onUploadProgress;
    }
    const { body, config } = bodyAndConfig(payload, file, onUploadProgress);
    const { data } = await apiClient.post('/knowledge', body, config);
    return data.data.article;
  },
  async update(arg1, arg2) {
    let id;
    let payload;
    let file;
    let onUploadProgress;
    if (arg1 && typeof arg1 === 'object' && 'id' in arg1) {
      id = arg1.id;
      payload = arg1.payload;
      file = arg1.file;
      onUploadProgress = arg1.onUploadProgress;
    } else {
      id = arg1;
      payload = arg2;
    }
    const { body, config } = bodyAndConfig(payload, file, onUploadProgress);
    const { data } = await apiClient.patch(`/knowledge/${id}`, body, config);
    return data.data.article;
  },
  async remove(id) {
    await apiClient.delete(`/knowledge/${id}`);
  },

  // Article images (Infographics / Diagrams)
  async addImage(articleId, file, caption = '') {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    const { data } = await apiClient.post(`/knowledge/${articleId}/images`, formData);
    return data.data;
  },
  async removeImage(articleId, imageId) {
    const { data } = await apiClient.delete(`/knowledge/${articleId}/images/${imageId}`);
    return data.data;
  },
  async reorderImages(articleId, imageIds) {
    const { data } = await apiClient.patch(`/knowledge/${articleId}/images/reorder`, { imageIds });
    return data.data;
  },

  // Comments (Q&A)
  async listComments(articleId, params = {}) {
    const { data } = await apiClient.get(`/knowledge/${articleId}/comments`, { params: cleanParams(params) });
    return { data: data.data, pagination: data.pagination };
  },
  async createComment(articleId, body) {
    const { data } = await apiClient.post(`/knowledge/${articleId}/comments`, { body });
    return data.data.comment;
  },
  async deleteComment(articleId, commentId) {
    await apiClient.delete(`/knowledge/${articleId}/comments/${commentId}`);
  },
};

export default knowledgeService;

