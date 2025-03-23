const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const cronParser = require('cron-parser');

class Flow extends Model {
  // Calculate next run time based on cron schedule
  calculateNextRun() {
    if (!this.schedule) {
      this.nextRun = null;
      return;
    }
    
    try {
      const interval = cronParser.parseExpression(this.schedule);
      this.nextRun = interval.next().toDate();
    } catch (e) {
      console.error(`Error parsing cron expression for flow ${this.name}: ${e.message}`);
      this.nextRun = null;
    }
  }
}

Flow.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  binaryPath: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  schedule: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isCronExpression(value) {
        if (value === null || value === '') return;
        
        const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
        if (!cronRegex.test(value)) {
          throw new Error('Not a valid cron expression');
        }
      }
    }
  },
  lastRun: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextRun: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING'
  }
}, {
  sequelize,
  modelName: 'flow',
  timestamps: true,
  hooks: {
    beforeSave: (flow) => {
      if (flow.changed('schedule')) {
        flow.calculateNextRun();
      }
    }
  }
});

module.exports = Flow;