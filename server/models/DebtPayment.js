const mongoose = require('mongoose');

const debtPaymentSchema = new mongoose.Schema({
  debt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debt',
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

module.exports = mongoose.model('DebtPayment', debtPaymentSchema);