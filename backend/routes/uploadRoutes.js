const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// File upload route
router.post('/', protect, uploadFile);

module.exports = router;
