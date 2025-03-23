import api from '../api.js';

export default {
  template: `
    <div>
      <h1 class="mb-4">Dashboard</h1>
      
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0">Flows Overview</h5>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else>
                <div class="row text-center">
                  <div class="col-6 col-md-3 mb-3">
                    <div class="card bg-light">
                      <div class="card-body py-2">
                        <h3 class="mb-0">{{ flowStats.total }}</h3>
                        <div class="text-muted small">Total</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-md-3 mb-3">
                    <div class="card bg-light">
                      <div class="card-body py-2">
                        <h3 class="mb-0">{{ flowStats.running }}</h3>
                        <div class="text-muted small">Running</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-md-3 mb-3">
                    <div class="card bg-light">
                      <div class="card-body py-2">
                        <h3 class="mb-0">{{ flowStats.completed }}</h3>
                        <div class="text-muted small">Completed</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-md-3 mb-3">
                    <div class="card bg-light">
                      <div class="card-body py-2">
                        <h3 class="mb-0">{{ flowStats.failed }}</h3>
                        <div class="text-muted small">Failed</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6 class="mt-3">Recent Flows</h6>
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Last Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="flow in recentFlows" :key="flow._id">
                      <td>
                        <router-link :to="'/flows/' + flow._id">{{ flow.name }}</router-link>
                      </td>
                      <td>
                        <span class="badge status-badge" :class="'status-' + flow.status">{{ flow.status }}</span>
                      </td>
                      <td>{{ formatDate(flow.lastRun) }}</td>
                    </tr>
                    <tr v-if="recentFlows.length === 0">
                      <td colspan="3" class="text-center">No flows available</td>
                    </tr>
                  </tbody>
                </table>
                
                <div class="text-end">
                  <router-link to="/flows" class="btn btn-sm btn-outline-primary">View All Flows</router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-header bg-success text-white">
              <h5 class="card-title mb-0">Recent Executions</h5>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center">
                <div class="spinner-border text-success" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else>
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Flow</th>
                      <th>Status</th>
                      <th>Started</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="execution in recentExecutions" :key="execution._id">
                      <td>
                        <router-link :to="'/executions/' + execution._id">{{ execution.flowName }}</router-link>
                      </td>
                      <td>
                        <span class="badge status-badge" :class="'status-' + execution.status">{{ execution.status }}</span>
                      </td>
                      <td>{{ formatDate(execution.startedAt) }}</td>
                      <td>{{ calculateDuration(execution) }}</td>
                    </tr>
                    <tr v-if="recentExecutions.length === 0">
                      <td colspan="4" class="text-center">No executions available</td>
                    </tr>
                  </tbody>
                </table>
                
                <div class="text-end">
                  <router-link to="/executions" class="btn btn-sm btn-outline-success">View All Executions</router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      loading: true,
      flows: [],
      executions: [],
      flowStats: {
        total: 0,
        running: 0,
        completed: 0,
        failed: 0
      }
    };
  },
  
  computed: {
    recentFlows() {
      return this.flows.slice(0, 5);
    },
    
    recentExecutions() {
      return this.executions.slice(0, 10);
    }
  },
  
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        // Fetch flows and executions in parallel
        const [flows, executions] = await Promise.all([
          api.getFlows(),
          api.getExecutions(10)
        ]);
        
        this.flows = flows;
        this.executions = executions;
        
        // Calculate flow statistics
        this.flowStats = {
          total: flows.length,
          running: flows.filter(f => f.status === 'RUNNING').length,
          completed: flows.filter(f => f.status === 'COMPLETED').length,
          failed: flows.filter(f => f.status === 'FAILED').length
        };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Never';
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
    }
  },
  
  mounted() {
    this.fetchData();
    
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchData();
    }, 30000);
  },
  
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  }
};