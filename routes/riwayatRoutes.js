// routes/riwayatRoutes.js
const express = require('express');
const router  = express.Router();
const {
  createRiwayat,
  getAllRiwayat,
  exportExcel,      
  updateRiwayat,
  deleteRiwayat,
  getRiwayatById,
} = require('../controllers/riwayatController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// ── ADMIN ──────────────────────────────────────────────
router.post('/',     authMiddleware, roleMiddleware(['admin']), createRiwayat);
router.get('/',      authMiddleware, roleMiddleware(['admin']), getAllRiwayat);


router.get('/export', authMiddleware, roleMiddleware(['admin']), exportExcel);

router.get('/:id',   authMiddleware, roleMiddleware(['admin']), getRiwayatById);
router.put('/:id',   authMiddleware, roleMiddleware(['admin']), updateRiwayat);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteRiwayat);

module.exports = router;
