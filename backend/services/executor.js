const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Flow = require('../models/Flow');
const { Execution, TaskExecution } = require('../models/Execution');

// Execute a flow
async function executeFlow(flow) {
  console.log(`Executing flow: ${flow.name}`);
  
  // Update flow status
  await flow.update({
    status: 'RUNNING',
    lastRun: new Date()
  });
  
  // Create a new execution record
  const execution = await Execution.create({
    flowId: flow.id,
    flowName: flow.name,
    status: 'RUNNING',
    startedAt: new Date()
  });
  
  // Create a temporary file to store the execution output
  const outputFile = path.join(os.tmpdir(), `flow_${execution.id}.json`);
  
  // Execute the flow in a separate process
  executeFlowProcess(flow, execution, outputFile);
  
  return execution;
}

// Execute the flow in a separate process
function executeFlowProcess(flow, execution, outputFile) {
  // Check if the binary exists
  if (!fs.existsSync(flow.binaryPath)) {
    handleExecutionError(flow, execution, `Binary file not found: ${flow.binaryPath}`);
    return;
  }
  
  // Spawn the process
  const process = spawn(flow.binaryPath, [
    '--flow-name', flow.name,
    '--description', flow.description || '',
    '--output', outputFile
  ]);
  
  let stdout = '';
  let stderr = '';
  
  // Collect stdout
  process.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  
  // Collect stderr
  process.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  
  // Handle process completion
  process.on('close', async (code) => {
    try {
      if (code === 0) {
        // Process completed successfully
        await handleExecutionSuccess(flow, execution, outputFile, stdout);
      } else {
        // Process failed
        await handleExecutionError(flow, execution, `Process exited with code ${code}: ${stderr}`);
      }
    } catch (err) {
      console.error(`Error handling flow execution completion: ${err.message}`);
    }
  });
  
  // Handle process error
  process.on('error', async (err) => {
    await handleExecutionError(flow, execution, `Failed to start process: ${err.message}`);
  });
}

// Handle successful execution
async function handleExecutionSuccess(flow, execution, outputFile, stdout) {
  try {
    // Read the output file
    let outputData = {};
    if (fs.existsSync(outputFile)) {
      const outputContent = fs.readFileSync(outputFile, 'utf8');
      outputData = JSON.parse(outputContent);
      
      // Clean up the output file
      fs.unlinkSync(outputFile);
    }
    
    // Update the execution record with the output data
    await execution.update({
      status: 'COMPLETED',
      completedAt: new Date(),
      output: stdout
    });
    
    // Add tasks if they exist in the output data
    if (outputData.tasks && Array.isArray(outputData.tasks)) {
      for (const task of outputData.tasks) {
        await TaskExecution.create({
          executionId: execution.id,
          taskId: task.id,
          name: task.name,
          status: task.status,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          errorMessage: task.errorMessage
        });
      }
    }
    
    // Update the flow status
    await flow.update({ status: 'COMPLETED' });
    
    console.log(`Flow execution completed: ${flow.name}`);
  } catch (err) {
    console.error(`Error handling successful execution: ${err.message}`);
    await handleExecutionError(flow, execution, `Error processing execution results: ${err.message}`);
  }
}

// Handle execution error
async function handleExecutionError(flow, execution, errorMessage) {
  console.error(`Flow execution failed: ${flow.name} - ${errorMessage}`);
  
  // Update the execution record
  await execution.update({
    status: 'FAILED',
    completedAt: new Date(),
    errorMessage: errorMessage
  });
  
  // Update the flow status
  await flow.update({ status: 'FAILED' });
}

module.exports = {
  executeFlow
};