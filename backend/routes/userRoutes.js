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

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;