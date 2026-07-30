const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadFile, uploadImage, fileUploadMiddleware, imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

// Demo/test endpoints for the shared upload utility.
// Future features (course images, blog images, certificates, etc.) should
// call uploadFile / uploadImage directly from their own controllers instead
// of hitting these routes.

router.post('/file', protect, fileUploadMiddleware.single('file'), async (req, res) => {
  try {
    const result = await uploadFile(req.file, 'files');
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/image', protect, imageUploadMiddleware.single('image'), async (req, res) => {
  try {
    const result = await uploadImage(req.file, 'images');
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
