const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  householdId: {
    type: String,
    required: true
  },
  
  name: {
    type: String,
    required: true
  },

  isShared: {
    type: Boolean,
    default: false,
  },

  targetAmount: {
    type: Number,
   required: true,
  },

  targetDate: {
    type: Date,
  },

  startingBalance: {
    type: Number,
    default: 0
  },
  
 owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
 }
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);