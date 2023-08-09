const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: Boolean,
  email: String,
});

module.exports = mongoose.model('User', userSchema);
