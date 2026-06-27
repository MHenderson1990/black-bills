const mongoose = require('mongoose');

const debtTransactionSchema = new mongoose.Schema({
  debt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debt',
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  madeBy: {
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

module.exports = mongoose.model('DebtTransaction', debtTransactionSchema);