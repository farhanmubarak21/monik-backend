// routes/userRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  createUserByAdmin,
} = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// ADMIN kelola user
router.get('/',    authMiddleware, roleMiddleware(['admin']), getAllUsers);
router.get('/:id', authMiddleware, roleMiddleware(['admin']), getUserById);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteUser);
router.post('/', authMiddleware, roleMiddleware(['admin']), createUserByAdmin);

module.exports = router;