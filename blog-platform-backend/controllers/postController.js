const Post = require('../models/Post');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper function to handle errors
const handleErrors = (err, res) => {
  console.error(err.message);
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ 
      message: messages.join(', '),
      errors: err.errors 
    });
  }
  
  res.status(500).json({ message: 'Server error' });
};

// Get all posts with pagination
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await Post.countDocuments();
    
    res.json({
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (err) {
    handleErrors(err, res);
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content } = req.body;
    
    // Verify user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newPost = new Post({
      title,
      content,
      author: req.user.id
    });
    
    const post = await newPost.save();
    
    // Populate author info
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username email');
      
    res.status(201).json(populatedPost);
  } catch (err) {
    handleErrors(err, res);
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content } = req.body;
    
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    post.title = title;
    post.content = content;
    
    const updatedPost = await post.save();
    
    // Populate author info
    const populatedPost = await Post.findById(updatedPost._id)
      .populate('author', 'username email');
      
    res.json(populatedPost);
  } catch (err) {
    handleErrors(err, res);
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    await post.remove();
    res.json({ message: 'Post removed successfully' });
  } catch (err) {
    handleErrors(err, res);
  }
};

// Get a single post
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username email');
      
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (err) {
    handleErrors(err, res);
  }
};