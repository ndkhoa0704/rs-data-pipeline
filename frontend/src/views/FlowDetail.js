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
      
      <div v-else-if="!flow" class="alert alert-danger">
        Flow not found or has been deleted.
      </div>
      
      <div v-else>
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>{{ flow.name }}</h1>
          <div class="btn-group">
            <button class="btn btn-primary" @click="executeFlow" :disabled="flow.status === 'RUNNING'">
              <i class="bi bi-play-fill"></i> Execute
            </button>
            <button class="btn btn-secondary" @click="editFlow" data-bs-toggle="modal" data-bs-target="#flowModal">
              <i class="bi bi-pencil"></i> Edit
            </button>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header">Flow Details</div>
              <div class="card-body">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <th style="width: 30%">Status</th>
                      <td>
                        <span class="badge status-badge" :class="'status-' + flow.status">{{ flow.status }}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>Description</th>
                      <td>{{ flow.description || '-' }}</td>
                    </tr>
                    <tr>
                      <th>Binary Path</th>
                      <td>{{ flow.binaryPath }}</td>
                    </tr>
                    <tr>
                      <th>Schedule</th>
                      <td>{{ flow.schedule || 'Manual execution only' }}</td>
                    </tr>
                    <tr>
                      <th>Last Run</th>
                      <td>{{ formatDate(flow.lastRun) }}</td>
                    </tr>
                    <tr>
                      <th>Next Run</th>
                      <td>{{ formatDate(flow.nextRun) }}</td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>{{ formatDate(flow.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">Execution History</div>
              <div class="card-body">
                <div v-if="loadingExecutions" class="text-center">
                  <div class="spinner-border spinner-border-sm text-secondary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                <div v-else-if="executions.length === 0" class="text-center text-muted">
                  No execution history available
                </div>
                <div v-else>
                  <table class="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Duration</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="execution in executions" :key="execution._id">
                        <td>
                          <span class="badge status-badge" :class="'status-' + execution.status">{{ execution.status }}</span>
                        </td>
                        <td>{{ formatDate(execution.startedAt) }}</td>
                        <td>{{ calculateDuration(execution) }}</td>
                        <td class="text-end">
                          <router-link :to="'/executions/' + execution._id" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-eye"></i>
                          </router-link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Flow Edit Modal -->
      <div class="modal fade" id="flowModal" tabindex="-1" aria-labelledby="flowModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="flowModalLabel">Edit Flow</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveFlow">
                <div class="mb-3">
                  <label for="flowName" class="form-label">Name</label>
                  <input type="text" class="form-control" id="flowName" v-model="form.name" required>
                </div>
                <div class="mb-3">
                  <label for="flowDescription" class="form-label">Description</label>
                  <textarea class="form-control" id="flowDescription" v-model="form.description" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label for="flowBinaryPath" class="form-label">Binary Path</label>
                  <input type="text" class="form-control" id="flowBinaryPath" v-model="form.binaryPath" required>
                  <div class="form-text">Path to the compiled Rust binary file</div>
                </div>
                <div class="mb-3">
                  <label for="flowSchedule" class="form-label">Schedule (Cron Expression)</label>
                  <input type="text" class="form-control" id="flowSchedule" v-model="form.schedule" placeholder="* * * * *">
                  <div class="form-text">Leave empty for manual execution only</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="saveFlow">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      loading: true,
      loadingExecutions: true,
      flow: null,
      executions: [],
      form: {
        name: '',
        description: '',
        binaryPath: '',
        schedule: ''
      },
      flowModal: null
    };
  },
  
  methods: {
    async fetchFlow() {
      this.loading = true;
      try {
        this.flow = await api.getFlow(this.id);
      } catch (error) {
        console.error('Error fetching flow:', error);
        this.flow = null;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchExecutions() {
      this.loadingExecutions = true;
      try {
        this.executions = await api.getFlowExecutions(this.id, 10);
      } catch (error) {
        console.error('Error fetching executions:', error);
        this.executions = [];
      } finally {
        this.loadingExecutions = false;
      }
    },
    
    editFlow() {
      this.form = {
        name: this.flow.name,
        description: this.flow.description || '',
        binaryPath: this.flow.binaryPath,
        schedule: this.flow.schedule || ''
      };
    },
    
    async saveFlow() {
      try {
        await api.updateFlow(this.id, this.form);
        this.flowModal.hide();
        this.fetchFlow();
      } catch (error) {
        console.error('Error updating flow:', error);
        alert('Error updating flow: ' + error.message);
      }
    },
    
    async executeFlow() {
      try {
        await api.executeFlow(this.id);
        this.fetchFlow();
        this.fetchExecutions();
      } catch (error) {
        console.error('Error executing flow:', error);
        alert('Error executing flow: ' + error.message);
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
    this.fetchFlow();
    this.fetchExecutions();
    
    // Initialize Bootstrap modal
    this.flowModal = new bootstrap.Modal(document.getElementById('flowModal'));
    
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchFlow();
      this.fetchExecutions();
    }, 30000);
  },
  
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  }
};