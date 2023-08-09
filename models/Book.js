const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: String,
  author: String,
  publishedYear: Number,
  storyline: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Book', bookSchema);
