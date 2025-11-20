const express = require('express');
const router = express.Router();
const { 
  submitWork, 
  getMyReports, 
  getAllReports 
} = require('../controllers/workController');
const auth = require('../middleware/authMiddleware');

// Worker routes
router.post('/submit', auth(['worker']), submitWork);
router.get('/my-reports', auth(['worker']), getMyReports);

// Admin/Supervisor routes
router.get('/all-reports', auth(['admin', 'supervisor']), getAllReports);

module.exports = router;