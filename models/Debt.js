const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  trackTransactions: {
    type: Boolean,
   default: true,
  },
  startingBalance: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
   required: true,
  },
 owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
 }
});

module.exports = mongoose.model('Debt', debtSchema);