import apiClient from './apiClient.js';

export const chatService = {
  getConversations: async () => {
    const res = await apiClient.get('/chat/conversations');
    return res.data.data;
  },

  getOrCreateDirectConversation: async (recipientId) => {
    const res = await apiClient.post('/chat/conversations', { recipientId });
    return res.data.data;
  },

  getMessages: async (conversationId, params = {}) => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
      params,
    });
    return res.data.data;
  },

  sendMessage: async (conversationId, content) => {
    const res = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return res.data.data;
  },

  markAsRead: async (conversationId) => {
    const res = await apiClient.patch(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  searchColleagues: async (q = '') => {
    const res = await apiClient.get('/chat/users', { params: { q } });
    return res.data.data;
  },

  getOrCreateSupportConversation: async (department) => {
    const res = await apiClient.post(`/chat/support/${department}`);
    return res.data.data;
  },
};

export default chatService;
