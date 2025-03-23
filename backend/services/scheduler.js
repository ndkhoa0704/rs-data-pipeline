const cron = require('node-cron');
const { Op } = require('sequelize');
const Flow = require('../models/Flow');
const { executeFlow } = require('./executor');

// Check for flows to execute every minute
const SCHEDULER_INTERVAL = '* * * * *';

// Start the scheduler
function startScheduler() {
  console.log('Starting flow scheduler...');
  
  // Schedule the job to run at the specified interval
  cron.schedule(SCHEDULER_INTERVAL, async () => {
    try {
      await checkScheduledFlows();
    } catch (err) {
      console.error('Error in scheduler:', err);
    }
  });
}

// Check for flows that need to be executed
async function checkScheduledFlows() {
  const now = new Date();
  
  try {
    // Find flows that are scheduled to run now or in the past
    const flows = await Flow.findAll({
      where: {
        schedule: { [Op.ne]: null },
        nextRun: { [Op.lte]: now }
      }
    });
    
    console.log(`Found ${flows.length} flows to execute`);
    
    // Execute each flow
    for (const flow of flows) {
      try {
        // Execute the flow
        await executeFlow(flow);
        
        // Update the next run time
        flow.calculateNextRun();
        await flow.save();
      } catch (err) {
        console.error(`Error executing flow ${flow.name}:`, err);
      }
    }
  } catch (err) {
    console.error('Error checking scheduled flows:', err);
  }
}

module.exports = {
  startScheduler
};