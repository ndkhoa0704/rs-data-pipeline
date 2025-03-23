import api from '../api.js';

export default {
  template: `
    <div>
      <h1 class="mb-4">Execution History</h1>
      
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <div v-else-if="executions.length === 0" class="alert alert-info">
        No execution history available yet. Execute a flow to see results here.
      </div>
      
      <div v-else>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Flow</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Duration</th>
                <th>Tasks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="execution in executions" :key="execution._id">
                <td>
                  <router-link :to="'/flows/' + execution.flowId">{{ execution.flowName }}</router-link>
                </td>
                <td>
                  <span class="badge status-badge" :class="'status-' + execution.status">{{ execution.status }}</span>
                </td>
                <td>{{ formatDate(execution.startedAt) }}</td>
                <td>{{ formatDate(execution.completedAt) }}</td>
                <td>{{ calculateDuration(execution) }}</td>
                <td>
                  <div v-if="execution.tasks && execution.tasks.length > 0">
                    <div class="progress" style="height: 10px;">
                      <div 
                        v-for="(status, index) in getTaskStatusCounts(execution)" 
                        :key="index"
                        class="progress-bar" 
                        :class="getProgressBarClass(status.status)"
                        :style="{ width: (status.count / execution.tasks.length * 100) + '%' }"
                        :title="status.count + ' ' + status.status.toLowerCase() + ' tasks'"
                      ></div>
                    </div>
                    <div class="small text-muted mt-1">
                      {{ execution.tasks.length }} task{{ execution.tasks.length !== 1 ? 's' : '' }}
                    </div>
                  </div>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="text-end">
                  <router-link :to="'/executions/' + execution._id" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-eye"></i> Details
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div>
            <span class="text-muted">Showing {{ executions.length }} executions</span>
          </div>
          <button class="btn btn-outline-primary" @click="loadMore" :disabled="loadingMore">
            <span v-if="loadingMore" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Load More
          </button>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      loading: true,
      loadingMore: false,
      executions: [],
      limit: 20,
      hasMore: true
    };
  },
  
  methods: {
    async fetchExecutions() {
      this.loading = true;
      try {
        this.executions = await api.getExecutions(this.limit);
      } catch (error) {
        console.error('Error fetching executions:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadMore() {
      if (this.loadingMore) return;
      
      this.loadingMore = true;
      this.limit += 20;
      
      try {
        const moreExecutions = await api.getExecutions(this.limit);
        this.executions = moreExecutions;
        this.hasMore = moreExecutions.length >= this.limit;
      } catch (error) {
        console.error('Error loading more executions:', error);
      } finally {
        this.loadingMore = false;
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
      
      const durationMs = end - start;
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
    },
    
    getTaskStatusCounts(execution) {
      if (!execution.tasks || execution.tasks.length === 0) {
        return [];
      }
      
      const counts = {};
      execution.tasks.forEach(task => {
        counts[task.status] = (counts[task.status] || 0) + 1;
      });
      
      return Object.keys(counts).map(status => ({
        status,
        count: counts[status]
      }));
    },
    
    getProgressBarClass(status) {
      switch (status) {
        case 'COMPLETED':
          return 'bg-success';
        case 'RUNNING':
          return 'bg-primary';
        case 'FAILED':
          return 'bg-danger';
        default:
          return 'bg-secondary';
      }
    }
  },
  
  mounted() {
    this.fetchExecutions();
    
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchExecutions();
    }, 30000);
  },
  
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  }
};