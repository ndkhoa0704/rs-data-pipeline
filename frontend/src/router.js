import { createRouter, createWebHistory } from 'vue-router';

// Import views
import Dashboard from './views/Dashboard.js';
import FlowsList from './views/FlowsList.js';
import FlowDetail from './views/FlowDetail.js';
import ExecutionsList from './views/ExecutionsList.js';
import ExecutionDetail from './views/ExecutionDetail.js';

// Define routes
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/flows',
    name: 'Flows',
    component: FlowsList
  },
  {
    path: '/flows/:id',
    name: 'FlowDetail',
    component: FlowDetail,
    props: true
  },
  {
    path: '/executions',
    name: 'Executions',
    component: ExecutionsList
  },
  {
    path: '/executions/:id',
    name: 'ExecutionDetail',
    component: ExecutionDetail,
    props: true
  }
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;