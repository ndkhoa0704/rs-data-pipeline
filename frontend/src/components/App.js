export default {
  template: `
    <div>
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container">
          <router-link class="navbar-brand" to="/">Data Pipeline System</router-link>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <router-link class="nav-link" to="/">Dashboard</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/flows">Flows</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/executions">Executions</router-link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      
      <div class="container">
        <router-view></router-view>
      </div>
      
      <footer class="mt-5 py-3 bg-light text-center">
        <div class="container">
          <p class="text-muted mb-0">Data Pipeline System &copy; 2025</p>
        </div>
      </footer>
    </div>
  `
};