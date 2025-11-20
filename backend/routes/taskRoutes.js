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
const auth = require('../middleware/authMiddleware');

// Public/Protected routes
router.get('/dashboard-stats', auth(['admin', 'supervisor']), getDashboardStats);

// CRUD routes
router.route('/')
  .get(auth(['admin', 'supervisor']), getTasks)
  .post(auth(['admin', 'supervisor']), createTask);

// Excel upload route (keeping existing functionality)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post("/upload-excel", auth(["admin"]), upload.single("file"), uploadExcel);

// Today's tasks routes (must come before /:id route)
router.get('/today', auth(['admin']), getTodayTasks);
router.get('/supervisor-today', auth(['supervisor']), getSupervisorTodayTasks);
router.put('/update-today', auth(['admin']), updateTodayTasks);

// Generic ID-based routes (must come after specific routes)
router.route('/:id')
  .get(auth(['admin', 'supervisor']), getTaskById)
  .put(auth(['admin', 'supervisor']), updateTask)
  .delete(auth(['admin']), deleteTask);

module.exports = router;
