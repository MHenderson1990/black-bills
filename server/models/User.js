const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  householdId: {
    type: String,
    required: true
  },

  payAnchorDate: {
    type: Date,
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
this.password = await bcrypt.hash(this.password, 10);

});


module.exports = mongoose.model('User', userSchema);

