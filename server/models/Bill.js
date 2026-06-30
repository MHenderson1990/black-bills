const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    householdId: {
    type: String,
    required: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

  paymentMethod: {
  type: {
    type: String
  },
  accountName: {
    type: String
  },
  last4: {
    type: String
  }
}
});

module.exports = mongoose.model('Bill', billSchema);