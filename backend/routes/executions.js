const express = require('express');
const router = express.Router();
const { Execution, TaskExecution } = require('../models/Execution');
const Flow = require('../models/Flow');
const { Op } = require('sequelize');

// Get all executions
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    const executions = await Execution.findAll({
      order: [['startedAt', 'DESC']],
      limit,
      include: [{
        model: TaskExecution,
        as: 'tasks'
      }]
    });
    
    res.json(executions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get executions for a specific flow
router.get('/flow/:flowId', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    const executions = await Execution.findAll({
      where: { flowId: req.params.flowId },
      order: [['startedAt', 'DESC']],
      limit,
      include: [{
        model: TaskExecution,
        as: 'tasks'
      }]
    });
    
    res.json(executions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single execution
router.get('/:id', getExecution, (req, res) => {
  res.json(res.execution);
});

// Middleware to get execution by ID
async function getExecution(req, res, next) {
  try {
    const execution = await Execution.findByPk(req.params.id, {
      include: [{
        model: TaskExecution,
        as: 'tasks'
      }]
    });
    
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }
    
    res.execution = execution;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = router;