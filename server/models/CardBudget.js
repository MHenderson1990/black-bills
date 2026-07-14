const mongoose = require('mongoose');

const cardBudgetSchema = new mongoose.Schema({
  householdId: {
    type: String,
    required: true
  },
  debt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debt',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('CardBudget', cardBudgetSchema);