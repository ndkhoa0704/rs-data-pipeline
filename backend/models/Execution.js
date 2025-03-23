const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const Flow = require('./Flow');

class TaskExecution extends Model {}

TaskExecution.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  executionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'executions',
      key: 'id'
    }
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'task_execution',
  timestamps: false
});

class Execution extends Model {}

Execution.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  flowId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'flows',
      key: 'id'
    }
  },
  flowName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  output: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'execution',
  timestamps: true
});

// Define associations
Execution.belongsTo(Flow, { foreignKey: 'flowId' });
Flow.hasMany(Execution, { foreignKey: 'flowId' });

Execution.hasMany(TaskExecution, {
  foreignKey: 'executionId',
  as: 'tasks',
  onDelete: 'CASCADE'
});
TaskExecution.belongsTo(Execution, { foreignKey: 'executionId' });

module.exports = {
  Execution,
  TaskExecution
};