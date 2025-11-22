const express = require('express');
const router = express.Router();
const { 
  submitWork, 
  getMyReports, 
  getAllReports 
} = require('../controllers/workController');
const { protect, admin, supervisor, adminOrSupervisor } = require('../middleware/authMiddleware');

// Worker routes - using adminOrSupervisor as a temporary measure
router.post('/submit', protect, adminOrSupervisor, submitWork);
router.get('/my-reports', protect, adminOrSupervisor, getMyReports);

// Admin/Supervisor routes
router.get('/all-reports', protect, adminOrSupervisor, getAllReports);

module.exports = router;