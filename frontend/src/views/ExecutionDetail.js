import api from '../api.js';

export default {
  props: ['id'],
  
  template: `
    <div>
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <div v-else-if="!execution" class="alert alert-danger">
        Execution not found or has been deleted.
      </div>
      
      <div v-else>
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>Execution Details</h1>
          <router-link :to="'/flows/' + execution.flowId" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Back to Flow
          </router-link>
        </div>
        
        <div class="card mb-4">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">{{ execution.flowName }}</h5>
              <span class="badge status-badge" :class="'status-' + execution.status">{{ execution.status }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <th style="width: 30%">Started</th>
                      <td>{{ formatDate(execution.startedAt) }}</td>
                    </tr>
                    <tr>
                      <th>Completed</th>
                      <td>{{ formatDate(execution.completedAt) }}</td>
                    </tr>
                    <tr>
                      <th>Duration</th>
                      <td>{{ calculateDuration(execution) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="col-md-6" v-if="execution.errorMessage">
                <div class="alert alert-danger">
                  <h6 class="alert-heading">Error</h6>
                  <pre class="mb-0">{{ execution.errorMessage }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mb-4" v-if="execution.tasks && execution.tasks.length > 0">
          <div class="card-header">
            <h5 class="mb-0">Tasks</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in execution.tasks" :key="task.taskId">
                  <td>
                    <div>{{ task.name }}</div>
                    <small class="text-muted">{{ task.taskId }}</small>
                  </td>
                  <td>
                    <span class="badge status-badge" :class="'status-' + task.status">{{ task.status }}</span>
                  </td>
                  <td>{{ formatDate(task.startedAt) }}</td>
                  <td>{{ formatDate(task.completedAt) }}</td>
                  <td>{{ calculateTaskDuration(task) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card" v-if="execution.output">
          <div class="card-header">
            <h5 class="mb-0">Output</h5>
          </div>
          <div class="card-body">
            <pre class="mb-0" style="max-height: 400px; overflow-y: auto;">{{ execution.output }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      loading: true,
      execution: null
    };
  },
  
  methods: {
    async fetchExecution() {
      this.loading = true;
      try {
        this.execution = await api.getExecution(this.id);
      } catch (error) {
        console.error('Error fetching execution:', error);
        this.execution = null;
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    
    calculateDuration(execution) {
      if (!execution.startedAt) return 'N/A';
      
      const start = new Date(execution.startedAt);
      const end = execution.completedAt ? new Date(execution.completedAt) : new Date();
      
      return this.formatDuration(end - start);
    },
    
    calculateTaskDuration(task) {
      if (!task.startedAt) return 'N/A';
      
      const start = new Date(task.startedAt);
      const end = task.completedAt ? new Date(task.completedAt) : new Date();
      
      return this.formatDuration(end - start);
    },
    
    formatDuration(durationMs) {
      const seconds = Math.floor(durationMs / 1000);
      
      if (seconds < 60) {
        return `${seconds}s`;
      } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
      }
    }
  },
  
  mounted() {
    this.fetchExecution();
    
    // Refresh data every 10 seconds if execution is running
    this.refreshInterval = setInterval(() => {
      if (this.execution && this.execution.status === 'RUNNING') {
        this.fetchExecution();
      }
    }, 10000);
  },
  
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  }
};