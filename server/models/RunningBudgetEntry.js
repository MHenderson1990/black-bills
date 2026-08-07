const mongoose = require('mongoose');

const runningBudgetEntrySchema = new mongoose.Schema({
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RunningBudget',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['add', 'subtract'],
    required: true
  },
  note: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('RunningBudgetEntry', runningBudgetEntrySchema);