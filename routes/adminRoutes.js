// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

router.patch("/pengajuan/:id/terima", adminController.terimaPengajuan);
router.patch("/pengajuan/:id/tolak", adminController.tolakPengajuan);
router.patch("/pengajuan/:id/kembalikan", adminController.kembalikanMobil);
router.get("/stats", adminController.getAdminStats);
router.get("/riwayat-grafik", adminController.getRiwayatGrafik);
router.get("/lokasi-mobil", adminController.getLokasiMobil);




module.exports = router;
