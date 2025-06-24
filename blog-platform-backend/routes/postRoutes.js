const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get('/', postController.getAllPosts);

// @route   GET api/posts/:id
// @desc    Get single post
// @access  Public
router.get('/:id', postController.getPostById);

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', [
  authMiddleware,
  check('title', 'Title is required').not().isEmpty(),
  check('title', 'Title must be between 5 and 100 characters').isLength({ min: 5, max: 100 }),
  check('content', 'Content is required').not().isEmpty(),
  check('content', 'Content must be at least 10 characters').isLength({ min: 10 })
], postController.createPost);

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', [
  authMiddleware,
  check('title', 'Title is required').not().isEmpty(),
  check('title', 'Title must be between 5 and 100 characters').isLength({ min: 5, max: 100 }),
  check('content', 'Content is required').not().isEmpty(),
  check('content', 'Content must be at least 10 characters').isLength({ min: 10 })
], postController.updatePost);

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;