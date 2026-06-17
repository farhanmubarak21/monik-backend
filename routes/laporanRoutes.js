// routes/laporanRoutes.js
const express = require('express');
const router  = express.Router();
const {
  createLaporan,
  getAllLaporan,
  getLaporanById,
  verifikasiLaporan,
  getMyLaporan,
} = require('../controllers/laporanController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ── USER ─────────────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['user']),
  upload.fields([
    { name: 'foto_km',  maxCount: 1 },
    { name: 'foto_bbm', maxCount: 1 },
    { name: 'nota_bbm', maxCount: 1 }, 
  ]),
  createLaporan
);


router.get(
  '/my',
  authMiddleware,
  roleMiddleware(['user']),
  getMyLaporan
);

// ── ADMIN ─────────────────────────────────────────────────

// Lihat semua laporan
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'security']),
  getAllLaporan
);

// Lihat detail laporan by id
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'security']),
  getLaporanById
);

// Verifikasi laporan (diverifikasi / bermasalah)
router.patch(
  '/:id/verifikasi',
  authMiddleware,
  roleMiddleware(['admin', 'security']),
  verifikasiLaporan
);

module.exports = router;
