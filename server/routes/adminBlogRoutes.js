const express = require('express');
const { listBlogPosts, getBlogPost, createBlogPost, updateBlogPost } = require('../controllers/adminBlogController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

const blogImage = imageUploadMiddleware.fields([{ name: 'image', maxCount: 1 }]);

router.get('/blog', listBlogPosts);
router.post('/blog', blogImage, createBlogPost);
router.get('/blog/:id', getBlogPost);
router.patch('/blog/:id', blogImage, updateBlogPost);

module.exports = router;
