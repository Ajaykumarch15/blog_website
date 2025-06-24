const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
PostSchema.index({ author: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ title: 'text', content: 'text' });

// Update timestamp on save
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Cascade delete comments when post is deleted
PostSchema.pre('remove', async function(next) {
  await this.model('Comment').deleteMany({ post: this._id });
  next();
});

module.exports = mongoose.model('Post', PostSchema);