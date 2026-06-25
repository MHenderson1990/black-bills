const mongoose = require('mongoose');

const billShareSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  paid: {
    type: Boolean,
    default: false
  },
});

module.exports = mongoose.model('BillShare', billShareSchema);