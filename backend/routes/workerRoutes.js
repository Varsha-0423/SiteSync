const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getWorkerTasks, 
  updateTaskStatus 
} = require('../controllers/workerController');

/**
 * @route   GET /api/worker/:workerId/tasks
 * @desc    Get tasks assigned to a worker
 * @access  Private
 * @param   {string} workerId - Worker's ID
 * @query   {string} [status=all] - Filter tasks by status (all, pending, on-schedule, behind, ahead, completed)
 */
router.get('/:workerId/tasks', protect, getWorkerTasks);

/**
 * @route   PUT /api/worker/tasks/:taskId/status
 * @desc    Update task status
 * @access  Private
 * @param   {string} taskId - Task's ID
 * @body    {string} status - New status (pending, on-schedule, behind, ahead, completed)
 */
router.put('/tasks/:taskId/status', protect, updateTaskStatus);

module.exports = router;
