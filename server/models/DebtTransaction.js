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

  category: {
    type: String,
    default: 'Misc.'
  },

  madeByBoth: {
    type: Boolean,
    default: false
  },
  
  paid: {
    type: Boolean,
    default: false
  },

});

module.exports = mongoose.model('DebtTransaction', debtTransactionSchema);