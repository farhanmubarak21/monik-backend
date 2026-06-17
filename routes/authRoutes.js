// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { login, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');

// LOGIN user/admin/security
router.post('/login', loginValidator, validate, login);

// 🔒 GET CURRENT USER pakai token
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;