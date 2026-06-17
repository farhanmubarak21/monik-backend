// routes/mobilRoutes
const express = require('express');
const router = express.Router();
const {
  getMonitoringMobil,
  createMobil,
  getAllMobil,
  getMobilById,
  updateMobil,
  deleteMobil
} = require('../controllers/mobilController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { mobilValidator } = require('../validators/mobilValidator');
const validate = require('../middleware/validate');

// ADMIN monitoring mobil 
router.get(
  '/monitoring',
  authMiddleware,
  roleMiddleware(['admin']),
  getMonitoringMobil
);

// SEMUA ROLE: lihat list mobil
router.get('/', authMiddleware, getAllMobil);

// SEMUA ROLE: lihat detail mobil
router.get('/:id', authMiddleware, getMobilById);

// ADMIN tambah mobil
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  mobilValidator,
  validate,
  createMobil
);

// ADMIN update mobil
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  mobilValidator,
  validate,
  updateMobil
);

// ADMIN hapus mobil
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  deleteMobil
);

module.exports = router;
