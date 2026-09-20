import knowledgeService from './knowledgeService.js';

const knowledgeTopicService = {
  getAll: (params) => knowledgeService.listTopics(params),
  create: (payload) => knowledgeService.createTopic(payload),
  update: (id, payload) => knowledgeService.updateTopic(id, payload),
  remove: (id) => knowledgeService.removeTopic(id),
};

export default knowledgeTopicService;
