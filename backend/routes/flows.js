const express = require('express');
const router = express.Router();
const Flow = require('../models/Flow');
const { executeFlow } = require('../services/executor');

// Get all flows
router.get('/', async (req, res) => {
  try {
    const flows = await Flow.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(flows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single flow
router.get('/:id', getFlow, (req, res) => {
  res.json(res.flow);
});

// Create a new flow
router.post('/', async (req, res) => {
  try {
    const flow = await Flow.create({
      name: req.body.name,
      description: req.body.description,
      binaryPath: req.body.binaryPath,
      schedule: req.body.schedule
    });
    
    // The calculateNextRun will be called automatically by the beforeSave hook
    
    res.status(201).json(flow);
  } catch (err) {
    res.status(400).json({
      message: err.message,
      errors: err.errors?.map(e => ({ field: e.path, message: e.message }))
    });
  }
});

// Update a flow
router.patch('/:id', getFlow, async (req, res) => {
  try {
    const updates = {};
    
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }
    if (req.body.binaryPath !== undefined) {
      updates.binaryPath = req.body.binaryPath;
    }
    if (req.body.schedule !== undefined) {
      updates.schedule = req.body.schedule;
      // The calculateNextRun will be called automatically by the beforeSave hook
    }
    
    await res.flow.update(updates);
    
    // Get the updated flow
    const updatedFlow = await Flow.findByPk(req.params.id);
    res.json(updatedFlow);
  } catch (err) {
    res.status(400).json({
      message: err.message,
      errors: err.errors?.map(e => ({ field: e.path, message: e.message }))
    });
  }
});

// Delete a flow
router.delete('/:id', getFlow, async (req, res) => {
  try {
    await res.flow.destroy();
    res.json({ message: 'Flow deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Execute a flow manually
router.post('/:id/execute', getFlow, async (req, res) => {
  try {
    const execution = await executeFlow(res.flow);
    res.json({ message: 'Flow execution started', executionId: execution.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get flow by ID
async function getFlow(req, res, next) {
  try {
    const flow = await Flow.findByPk(req.params.id);
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' });
    }
    res.flow = flow;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = router;