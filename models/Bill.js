const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    householdId: {
    type: String,
    required: true
  },
  
    name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
   
  },
  category: {
    type: String,
    default: 'Misc.'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  paid: {
    type: Boolean,
    default: false
  },

});

module.exports = mongoose.model('Bill', billSchema);