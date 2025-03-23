// API service for communicating with the backend

const API_URL = '/api';

export default {
  // Flow API methods
  async getFlows() {
    const response = await fetch(`${API_URL}/flows`);
    return response.json();
  },

  async getFlow(id) {
    const response = await fetch(`${API_URL}/flows/${id}`);
    return response.json();
  },

  async createFlow(flow) {
    const response = await fetch(`${API_URL}/flows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flow)
    });
    return response.json();
  },

  async updateFlow(id, flow) {
    const response = await fetch(`${API_URL}/flows/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flow)
    });
    return response.json();
  },

  async deleteFlow(id) {
    const response = await fetch(`${API_URL}/flows/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async executeFlow(id) {
    const response = await fetch(`${API_URL}/flows/${id}/execute`, {
      method: 'POST'
    });
    return response.json();
  },

  // Execution API methods
  async getExecutions(limit = 100) {
    const response = await fetch(`${API_URL}/executions?limit=${limit}`);
    return response.json();
  },

  async getFlowExecutions(flowId, limit = 100) {
    const response = await fetch(`${API_URL}/executions/flow/${flowId}?limit=${limit}`);
    return response.json();
  },

  async getExecution(id) {
    const response = await fetch(`${API_URL}/executions/${id}`);
    return response.json();
  }
};