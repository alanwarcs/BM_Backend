// routes/authRoutes.js

const express = require('express');
const { signup, signin, verifyEmail } = require('../controllers/AuthController');

const router = express.Router();

// Route for user signup
router.post('/signup', signup);

// Route for email verification
// router.get('/verify-email/:token', verifyEmail);

// Route for user signin
router.post('/signin', signin);

module.exports = router;
