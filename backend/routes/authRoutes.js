const router = require("express").Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");

// Admin creates users
router.post("/register", protect, admin, registerUser);

// Public login
router.post("/login", loginUser);

// Get current user (protected route)
router.get("/me", protect, getMe);

module.exports = router;
