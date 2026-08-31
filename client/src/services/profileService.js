import apiClient from './apiClient.js';

const profileService = {
  async get() {
    const { data } = await apiClient.get('/auth/profile');
    return data.data;
  },

  async update({ payload, file, onUploadProgress }) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    if (file) formData.append('profileImage', file);
    const { data } = await apiClient.patch('/auth/profile', formData, { onUploadProgress });
    return data.data;
  },
};

export default profileService;
