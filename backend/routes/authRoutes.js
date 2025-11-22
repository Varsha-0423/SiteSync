const router = require("express").Router();
const { registerUser, loginUser, getMe, verifyToken } = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");

// Admin creates users
router.post("/register", protect, admin, registerUser);

// Public login
router.post("/login", loginUser);

// Get current user (protected route)
router.get("/me", protect, getMe);

// Verify token
router.get("/verify-token", protect, verifyToken);

module.exports = router;
