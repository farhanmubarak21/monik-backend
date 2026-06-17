//notifikasiRoutes.js
const express = require('express');
const router = express.Router();

const {
  createNotifikasi,
  getMyNotifikasi,
  getAllNotifikasi,
  deleteNotifikasi,
  markAsRead,
  prosesPengajuanDariNotif,
  markAllAdminRead,
  markAllUserRead,
  getAdminUnreadCount,
  getUserUnreadCount
} = require('../controllers/notifikasiController');

const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// ==========================
// USER
// ==========================
router.get('/', authMiddleware, getMyNotifikasi);
router.get('/unread-count', authMiddleware, getUserUnreadCount);
router.patch('/:id/read', authMiddleware, markAsRead);
router.patch('/mark-all-user', authMiddleware, markAllUserRead);

// ==========================
// ADMIN
// ==========================
router.get('/all', authMiddleware, roleMiddleware(['admin', 'security']), getAllNotifikasi);
router.get('/admin/unread-count', authMiddleware, roleMiddleware(['admin', 'security']), getAdminUnreadCount);
router.patch('/mark-all', authMiddleware, roleMiddleware(['admin', 'security']), markAllAdminRead);
router.post('/', authMiddleware, roleMiddleware(['admin']), createNotifikasi);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteNotifikasi);
router.patch('/:id/proses', authMiddleware, roleMiddleware(['admin', 'security']), prosesPengajuanDariNotif);

module.exports = router;
