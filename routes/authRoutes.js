// routes/authRoutes.js

const express = require('express');
const { signup, signin, verifyEmail, setupAccount, validateUser, signout} = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes


const router = express.Router();

// Route for user signup
router.post('/signup', signup);

// Route for email verification
// router.get('/verify-email/:token', verifyEmail);

// Route for user signin
router.post('/signin', signin);

// Route for user validation
router.post('/validate-user', authMiddleware, validateUser);

// Protected route for account setup (requires authentication)
router.post('/setup', authMiddleware, setupAccount);

// Route for user signin
router.post('/signout', signout);

module.exports = router;
