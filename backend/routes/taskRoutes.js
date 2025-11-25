const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
  uploadExcel,
  getTodayTasks,
  getSupervisorTodayTasks,
  updateTodayTasks
} = require('../controllers/taskController');
const { protect, admin, supervisor, adminOrSupervisor } = require('../middleware/authMiddleware');

// Public/Protected routes
router.get('/dashboard-stats', protect, adminOrSupervisor, getDashboardStats);

// CRUD routes
router.route('/')
  .get(protect, adminOrSupervisor, getTasks)
  .post(protect, adminOrSupervisor, createTask);

// Excel upload route (keeping existing functionality)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post("/upload-excel", protect, admin, upload.single("file"), uploadExcel);

// Today's tasks routes (must come before /:id route)
router.get('/today', protect, admin, getTodayTasks);
router.get('/supervisor-today', protect, supervisor, getSupervisorTodayTasks);
router.put('/update-today', protect, admin, updateTodayTasks);

// Generic ID-based routes (must come after specific routes)
router.route('/:id')
  .get(protect, adminOrSupervisor, getTaskById)
  .put(protect, adminOrSupervisor, updateTask)
  .delete(protect, admin, deleteTask);

module.exports = router;
