const mongoose = require('mongoose');

const paycheckSchema = new mongoose.Schema({
  earnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true
  },
  
  leftoverAmount: {
    type: Number,
  },

});

module.exports = mongoose.model('Paycheck', paycheckSchema);