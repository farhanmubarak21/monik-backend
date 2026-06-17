// routes/pengajuanRoutes
const express = require('express');
const router = express.Router();
const { createPengajuan, getAllPengajuan, getPengajuanById, updatePengajuan, deletePengajuan,  konfirmasiPengembalian, getPengajuanUser  } = require('../controllers/pengajuanController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { pengajuanValidator } = require('../validators/pengajuanValidator');
const validate = require('../middleware/validate');

// USER bikin pengajuan
router.post('/', authMiddleware, roleMiddleware(['user']), pengajuanValidator, validate, createPengajuan);

// ADMIN lihat semua pengajuan
router.get('/', authMiddleware, roleMiddleware(['admin', 'security']), getAllPengajuan);

// ADMIN lihat detail pengajuan
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'security']), getPengajuanById);

// ADMIN update (terima/tolak)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'security']), updatePengajuan);

// ADMIN hapus pengajuan
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deletePengajuan);

// ADMIN konfirmasi pengembalian
router.patch(
  "/kembali/:id",
  authMiddleware,
  roleMiddleware(["admin", "security"]),
  konfirmasiPengembalian
);

// pengajuanRoutes.js
router.get(
  "/user/me",
  authMiddleware,
  roleMiddleware(["user"]),
  getPengajuanUser
);


module.exports = router;
