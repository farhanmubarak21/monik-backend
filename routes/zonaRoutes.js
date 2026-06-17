//zonaRoutes.js
const express = require('express');
const router = express.Router();
const { createZona, getAllZona, deleteZona } = require('../controllers/zonaController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// ADMIN kelola zona
router.post('/', authMiddleware, roleMiddleware(['admin']), createZona);
router.get('/', authMiddleware, roleMiddleware(['admin']), getAllZona);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteZona);

module.exports = router;
