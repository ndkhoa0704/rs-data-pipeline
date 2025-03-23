# Data Pipeline System

A comprehensive data pipeline system built with Rust, Node.js, Express.js, and Vue.js with Bootstrap.

## Overview

This system allows you to create, manage, and execute data processing flows. Each flow is implemented as a Rust binary that performs a series of data tasks. The system provides:

- Backend server for managing flows and their execution
- Frontend UI for visualizing flow information and status
- CI/CD pipeline for compiling and deploying Rust flows
- Comprehensive .gitignore for both Node.js and Rust development

## Project Structure

- `rust-flows/`: Rust implementation of data flows
- `backend/`: Node.js backend server with Express.js and PostgreSQL
- `frontend/`: Vue.js frontend application with Bootstrap
- `.github/workflows/`: GitHub Actions CI/CD configuration

## Getting Started

### Prerequisites

- Node.js (v14+)
- Rust (latest stable)
- PostgreSQL

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/data-pipeline.git
   cd data-pipeline
   ```

2. Set up PostgreSQL database:
   ```
   createdb data_pipeline
   ```

3. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

4. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

5. Build Rust flows:
   ```
   cd rust-flows
   cargo build --release
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend server:
   ```
   cd frontend
   npm start
   ```

3. Access the application at http://localhost:8080

## Creating Data Flows

Data flows are implemented as Rust binaries. Each flow consists of a series of tasks that are executed in sequence.

1. Create a new Rust file in the `rust-flows/src/bin/` directory
2. Implement the flow using the provided library
3. Build the flow using `cargo build --release`
4. Register the flow in the application by providing the path to the compiled binary

Example flow implementation:

```rust
use anyhow::Result;
use rust_flows::{Flow, Task};

fn main() -> Result<()> {
    // Create a flow
    let mut flow = Flow::new("flow1", "Data Processing Flow", "Process customer data");
    
    // Add tasks
    let mut extract_task = Task::new("extract", "Extract Data", "Extract data from source");
    let mut transform_task = Task::new("transform", "Transform Data", "Transform data");
    let mut load_task = Task::new("load", "Load Data", "Load data to destination");
    
    // Execute tasks
    flow.start();
    
    extract_task.start();
    // Implement extraction logic here
    extract_task.complete();
    
    transform_task.start();
    // Implement transformation logic here
    transform_task.complete();
    
    load_task.start();
    // Implement loading logic here
    load_task.complete();
    
    // Add tasks to flow
    flow.add_task(extract_task);
    flow.add_task(transform_task);
    flow.add_task(load_task);
    
    flow.complete();
    
    Ok(())
}
```

## Database Configuration

The application uses PostgreSQL for data storage. You can configure the database connection in `backend/config/database.js`. The default configuration is:

```javascript
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'data_pipeline'
});
```

You can override these settings using environment variables.

## CI/CD Pipeline

The CI/CD pipeline is configured using GitHub Actions. It:

1. Builds the Rust flows
2. Deploys the compiled binaries to the server
3. Deploys the backend and frontend applications

To configure the CI/CD pipeline, you need to set the following GitHub secrets:

- `SERVER_HOST`: The hostname or IP address of your server
- `SERVER_USERNAME`: The username to use for SSH access
- `SERVER_SSH_KEY`: The SSH private key for authentication
- `DB_PASSWORD`: The PostgreSQL database password

## License

This project is licensed under the MIT License - see the LICENSE file for details.