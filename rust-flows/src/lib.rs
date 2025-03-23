use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::process::Command;

/// Status of a task or flow
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Status {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED,
}

/// Represents a single task within a data flow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: Status,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

impl Task {
    pub fn new(id: &str, name: &str, description: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            status: Status::PENDING,
            started_at: None,
            completed_at: None,
            error_message: None,
        }
    }

    pub fn start(&mut self) {
        self.status = Status::RUNNING;
        self.started_at = Some(Utc::now());
        log::info!("Task '{}' started", self.name);
    }

    pub fn complete(&mut self) {
        self.status = Status::COMPLETED;
        self.completed_at = Some(Utc::now());
        log::info!("Task '{}' completed", self.name);
    }

    pub fn fail(&mut self, error: &str) {
        self.status = Status::FAILED;
        self.completed_at = Some(Utc::now());
        self.error_message = Some(error.to_string());
        log::error!("Task '{}' failed: {}", self.name, error);
    }
}

/// Represents a data flow containing multiple tasks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Flow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub tasks: Vec<Task>,
    pub status: Status,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl Flow {
    pub fn new(id: &str, name: &str, description: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            tasks: Vec::new(),
            status: Status::PENDING,
            started_at: None,
            completed_at: None,
        }
    }

    pub fn add_task(&mut self, task: Task) {
        self.tasks.push(task);
    }

    pub fn start(&mut self) {
        self.status = Status::RUNNING;
        self.started_at = Some(Utc::now());
        log::info!("Flow '{}' started", self.name);
    }

    pub fn complete(&mut self) {
        self.status = Status::COMPLETED;
        self.completed_at = Some(Utc::now());
        log::info!("Flow '{}' completed", self.name);
    }

    pub fn fail(&mut self) {
        self.status = Status::FAILED;
        self.completed_at = Some(Utc::now());
        log::error!("Flow '{}' failed", self.name);
    }

    pub fn update_status(&mut self) {
        if self.tasks.iter().any(|t| t.status == Status::FAILED) {
            self.status = Status::FAILED;
            self.completed_at = Some(Utc::now());
            return;
        }

        if self.tasks.iter().all(|t| t.status == Status::COMPLETED) {
            self.status = Status::COMPLETED;
            self.completed_at = Some(Utc::now());
            return;
        }

        if self.tasks.iter().any(|t| t.status == Status::RUNNING) {
            self.status = Status::RUNNING;
            return;
        }

        self.status = Status::PENDING;
    }

    pub fn save_status(&self, output_path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        let mut file = File::create(output_path)
            .with_context(|| format!("Failed to create output file: {:?}", output_path))?;
        file.write_all(json.as_bytes())
            .with_context(|| format!("Failed to write to output file: {:?}", output_path))?;
        Ok(())
    }
}

/// Execute a shell command and return the output
pub fn execute_command(command: &str, args: &[&str]) -> Result<String> {
    log::info!("Executing command: {} {:?}", command, args);
    
    let output = Command::new(command)
        .args(args)
        .output()
        .with_context(|| format!("Failed to execute command: {} {:?}", command, args))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!(
            "Command failed with exit code {}: {}",
            output.status,
            stderr
        ));
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(stdout)
}