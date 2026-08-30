import apiClient from './apiClient.js';

/**
 * Employee API wrapper. List returns the full envelope ({ data, pagination })
 * because callers need the pagination block; single-record calls return just
 * the employee.
 */
const employeeService = {
  async list(params = {}) {
    // Drop empty params so we don't send ?search=&department= noise.
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const { data } = await apiClient.get('/employees', { params: clean });
    return { data: data.data, pagination: data.pagination };
  },

  async get(id) {
    const { data } = await apiClient.get(`/employees/${id}`);
    return data.data.employee;
  },

  async create(payload) {
    const { data } = await apiClient.post('/employees', payload);
    return data.data.employee;
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/employees/${id}`, payload);
    return data.data.employee;
  },

  async remove(id) {
    await apiClient.delete(`/employees/${id}`);
  },
};

export default employeeService;
