const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWorkerTasks } = require('../controllers/workerController');

/**
 * @route   GET /api/worker/:workerId/tasks
 * @desc    Get tasks assigned to a worker
 * @access  Private
 * @param   {string} workerId - Worker's ID
 * @query   {string} [status=all] - Filter tasks by status (all, pending, in-progress, completed, etc.)
 */
router.get('/:workerId/tasks', protect, getWorkerTasks);

module.exports = router;
