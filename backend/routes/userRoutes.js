const express = require('express');
const router = express.Router();
const { protect, admin, supervisor } = require('../middleware/authMiddleware');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { upload, processBulkUpload } = require('../controllers/bulkUserController');

// Admin and supervisor routes for getting users
router.route('/')
  .get(protect, (req, res, next) => {
    // Allow both admins and supervisors to get users, but with different filters
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
      return getUsers(req, res, next);
    }
    return res.status(403).json({ message: 'Not authorized' });
  })
  .post(protect, admin, createUser);

// Bulk upload users via Excel
router.post('/bulk-upload', 
  protect, 
  admin, 
  upload.single('file'), 
  processBulkUpload
);

// Single user operations
router.route('/:id')
  .get(protect, (req, res, next) => {
    // Allow admins to view any user, supervisors can only view workers
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
      return getUserById(req, res, next);
    }
    return res.status(403).json({ message: 'Not authorized' });
  })
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;