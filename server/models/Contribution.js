const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  savingsGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsGoal',
    required: true,
  },
  
  contributedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
   required: true,
  },

});

module.exports = mongoose.model('Contribution', contributionSchema);