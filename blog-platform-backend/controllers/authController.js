const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Helper function to handle errors
const handleErrors = (err, res) => {
  console.error(err.message);
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      message: `${field} already exists`,
      field 
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ 
      message: messages.join(', '),
      errors: err.errors 
    });
  }
  
  res.status(500).json({ message: 'Server error' });
};

// Register a new user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists', field: 'email' });
    }
    
    user = new User({ username, email, password });
    
    await user.save();
    
    // Create JWT token
    const payload = { 
      user: { 
        id: user.id,
        role: user.role 
      } 
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
          }
        });
      }
    );
  } catch (err) {
    handleErrors(err, res);
  }
};

// Login user
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials', field: 'email' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials', field: 'password' });
    }
    
    const payload = { 
      user: { 
        id: user.id,
        role: user.role 
      } 
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    handleErrors(err, res);
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v')
      .lean();
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    handleErrors(err, res);
  }
};