const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
const { startScheduler } = require('./services/scheduler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synchronized');
    
    // Start the scheduler
    startScheduler();
    
    // API Routes
    app.use('/api/flows', require('./routes/flows'));
    app.use('/api/executions', require('./routes/executions'));
    
    // Serve static files from the frontend build directory in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../frontend/public')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
      });
    }
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        message: 'An error occurred',
        error: process.env.NODE_ENV === 'production' ? {} : err
      });
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();