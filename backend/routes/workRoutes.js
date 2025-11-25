const express = require('express');
const router = express.Router();
const { 
  submitWork, 
  getAllReports 
} = require('../controllers/workController');

const { protect, supervisor, adminOrSupervisor } = require('../middleware/authMiddleware');
const { getReportsByTask } = require('../controllers/workController');

// Admin/Supervisor: get work reports for a task
router.get('/task/:taskId', protect, adminOrSupervisor, getReportsByTask);

// Supervisor submits work for workers
router.post('/submit', protect, supervisor, submitWork);

// Admin + Supervisor view all reports
router.get('/all-reports', protect, adminOrSupervisor, getAllReports);

module.exports = router;
