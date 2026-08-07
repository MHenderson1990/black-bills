const mongoose = require('mongoose');

const runningBudgetSchema = new mongoose.Schema({
  householdId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RunningBudget', runningBudgetSchema);