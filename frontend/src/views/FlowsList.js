import api from '../api.js';

export default {
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Data Flows</h1>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#flowModal" @click="resetForm">
          <i class="bi bi-plus-circle"></i> New Flow
        </button>
      </div>
      
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <div v-else-if="flows.length === 0" class="alert alert-info">
        No data flows available. Create your first flow using the "New Flow" button.
      </div>
      
      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Last Run</th>
              <th>Next Run</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="flow in flows" :key="flow._id">
              <td>
                <router-link :to="'/flows/' + flow._id">{{ flow.name }}</router-link>
              </td>
              <td>{{ flow.description || '-' }}</td>
              <td>{{ flow.schedule || 'Manual' }}</td>
              <td>
                <span class="badge status-badge" :class="'status-' + flow.status">{{ flow.status }}</span>
              </td>
              <td>{{ formatDate(flow.lastRun) }}</td>
              <td>{{ formatDate(flow.nextRun) }}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" @click="executeFlow(flow)" :disabled="flow.status === 'RUNNING'">
                    <i class="bi bi-play-fill"></i>
                  </button>
                  <button class="btn btn-outline-secondary" @click="editFlow(flow)" data-bs-toggle="modal" data-bs-target="#flowModal">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" @click="confirmDelete(flow)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Flow Modal -->
      <div class="modal fade" id="flowModal" tabindex="-1" aria-labelledby="flowModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="flowModalLabel">{{ isEditing ? 'Edit Flow' : 'New Flow' }}</h5>
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
      
      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              Are you sure you want to delete the flow "{{ selectedFlow?.name }}"?
              This action cannot be undone.
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" @click="deleteFlow">Delete</button>
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
      isEditing: false,
      selectedFlow: null,
      form: {
        name: '',
        description: '',
        binaryPath: '',
        schedule: ''
      },
      deleteModal: null,
      flowModal: null
    };
  },
  
  methods: {
    async fetchFlows() {
      this.loading = true;
      try {
        this.flows = await api.getFlows();
      } catch (error) {
        console.error('Error fetching flows:', error);
      } finally {
        this.loading = false;
      }
    },
    
    resetForm() {
      this.isEditing = false;
      this.form = {
        name: '',
        description: '',
        binaryPath: '',
        schedule: ''
      };
    },
    
    editFlow(flow) {
      this.isEditing = true;
      this.selectedFlow = flow;
      this.form = {
        name: flow.name,
        description: flow.description || '',
        binaryPath: flow.binaryPath,
        schedule: flow.schedule || ''
      };
    },
    
    async saveFlow() {
      try {
        if (this.isEditing) {
          await api.updateFlow(this.selectedFlow._id, this.form);
        } else {
          await api.createFlow(this.form);
        }
        
        // Close modal and refresh flows
        this.flowModal.hide();
        this.fetchFlows();
      } catch (error) {
        console.error('Error saving flow:', error);
        alert('Error saving flow: ' + error.message);
      }
    },
    
    confirmDelete(flow) {
      this.selectedFlow = flow;
      this.deleteModal.show();
    },
    
    async deleteFlow() {
      try {
        await api.deleteFlow(this.selectedFlow._id);
        this.deleteModal.hide();
        this.fetchFlows();
      } catch (error) {
        console.error('Error deleting flow:', error);
        alert('Error deleting flow: ' + error.message);
      }
    },
    
    async executeFlow(flow) {
      try {
        await api.executeFlow(flow._id);
        this.fetchFlows();
      } catch (error) {
        console.error('Error executing flow:', error);
        alert('Error executing flow: ' + error.message);
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Never';
      const date = new Date(dateString);
      return date.toLocaleString();
    }
  },
  
  mounted() {
    this.fetchFlows();
    
    // Initialize Bootstrap modals
    this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    this.flowModal = new bootstrap.Modal(document.getElementById('flowModal'));
    
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchFlows();
    }, 30000);
  },
  
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  }
};