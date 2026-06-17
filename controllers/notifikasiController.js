// controllers/notifikasiController.js
const { Notifikasi, User, Pengajuan, Mobil } = require('../models');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

// ==========================
// CREATE Notifikasi
// ==========================
exports.createNotifikasi = async (req, res) => {
  try {
    const { user_id, tipe_notifikasi, pesan, pengajuan_id } = req.body;
    const notif = await Notifikasi.create({
      user_id, tipe_notifikasi, pesan, pengajuan_id
    });
    logger.info(`🔔 Notifikasi dibuat untuk user ${user_id}`);
    return success(res, "Notifikasi berhasil dibuat", notif, 201);
  } catch (err) {
    logger.error(`❌ Gagal buat notifikasi: ${err.message}`);
    return error(res, "Gagal membuat notifikasi", err.message, 500);
  }
};

// ==========================
// USER - GET notifikasi miliknya
// ==========================
exports.getMyNotifikasi = async (req, res) => {
  try {
    const notif = await Notifikasi.findAll({
      where: { user_id: req.user.id },
      order: [['waktu_notif', 'DESC']]
    });
    return success(res, 'Notifikasi Anda berhasil diambil', notif);
  } catch (err) {
    logger.error(`❌ Gagal ambil notifikasi user: ${err.message}`);
    return error(res, 'Gagal mengambil notifikasi', err.message, 500);
  }
};

// ==========================
// USER - Tandai notifikasi dibaca
// ==========================
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notifikasi.findByPk(req.params.id);
    if (!notif) return error(res, "Notifikasi tidak ditemukan", null, 404);
    if (notif.user_id !== req.user.id) return error(res, "Akses ditolak", null, 403);
    await notif.update({ is_read: true });
    return success(res, "Notifikasi ditandai terbaca", notif);
  } catch (err) {
    return error(res, "Gagal menandai notifikasi", err.message, 500);
  }
};

// ==========================
// ADMIN - Mark All Read
// ==========================
exports.markAllAdminRead = async (req, res) => {
  try {
    await Notifikasi.update(
      { is_read: true },
      { where: { tipe_notifikasi: "pengajuan", is_read: false } }
    );
    return success(res, "Semua notifikasi admin ditandai terbaca");
  } catch (err) {
    return error(res, "Gagal mark all read", err.message, 500);
  }
};

// ==========================
// USER - Mark All Read
// ==========================
exports.markAllUserRead = async (req, res) => {
  try {
    await Notifikasi.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    return success(res, "Semua notifikasi dibaca");
  } catch (err) {
    return error(res, "Gagal mark all read", err.message, 500);
  }
};

// ==========================
// ADMIN - GET semua notifikasi
// ==========================
exports.getAllNotifikasi = async (req, res) => {
  try {
    const notif = await Notifikasi.findAll({
      include: [{ model: User, attributes: ['id', 'nama', 'email'] }],
      order: [['waktu_notif', 'DESC']]
    });
    return success(res, 'Semua notifikasi berhasil diambil', notif);
  } catch (err) {
    return error(res, 'Gagal mengambil semua notifikasi', err.message, 500);
  }
};

// ==========================
// ADMIN - Hapus notifikasi
// ==========================
exports.deleteNotifikasi = async (req, res) => {
  try {
    const notif = await Notifikasi.findByPk(req.params.id);
    if (!notif) return error(res, 'Notifikasi tidak ditemukan', null, 404);
    await notif.destroy();
    return success(res, 'Notifikasi dihapus', null);
  } catch (err) {
    return error(res, 'Gagal menghapus notifikasi', err.message, 500);
  }
};

// ==========================
// ADMIN - Jumlah Notif Belum Dibaca
// ==========================
exports.getAdminUnreadCount = async (req, res) => {
  try {
    const count = await Notifikasi.count({
      where: { tipe_notifikasi: "pengajuan", is_read: false }
    });
    return success(res, "Unread admin notification count", { count });
  } catch (err) {
    return error(res, "Gagal mengambil jumlah notif", err.message, 500);
  }
};

// ==========================
// USER - Jumlah Notif Belum Dibaca
// ==========================
exports.getUserUnreadCount = async (req, res) => {
  try {
    const count = await Notifikasi.count({
      where: { user_id: req.user.id, is_read: false }
    });
    return success(res, "Unread user notification count", { count });
  } catch (err) {
    return error(res, "Gagal mengambil jumlah notifikasi", err.message, 500);
  }
};

// ==========================
// ADMIN - Proses pengajuan dari notif
// ==========================
exports.prosesPengajuanDariNotif = async (req, res) => {
  try {
    const { status, catatan_admin } = req.body;

    if (!["diterima", "ditolak"].includes(status)) {
      return error(res, "Status tidak valid", null, 400);
    }

    const notif = await Notifikasi.findByPk(req.params.id);
    if (!notif || notif.tipe_notifikasi !== "pengajuan") {
      return error(res, "Notifikasi pengajuan tidak ditemukan", null, 404);
    }

    const pengajuan = await Pengajuan.findByPk(notif.pengajuan_id);
    if (!pengajuan) {
      return error(res, "Data pengajuan tidak ditemukan", null, 404);
    }

    const admin = await User.findByPk(req.user.id);
    const adminName = admin?.nama || "Admin";
    const adminRoleLabel = req.user.role === "security" ? "Admin Security" : "Admin Internal";

    await pengajuan.update({
      status_pengajuan: status,
      catatan_admin: catatan_admin || null,
      diproses_oleh: adminName,
      diproses_oleh_role: adminRoleLabel,
      waktu_diproses: new Date(),
    });

    // Tandai notif admin sebagai terbaca
    await notif.update({ is_read: true });

    // Update status mobil jika diterima
    if (status === "diterima") {
      const mobil = await Mobil.findByPk(pengajuan.mobil_id);
      if (!mobil) return error(res, "Mobil tidak ditemukan", null, 404);
      await mobil.update({ status: "terpakai" });
    }

    // 🔔 Buat notifikasi untuk user yang mengajukan
    const notifUser = await Notifikasi.create({
      user_id: pengajuan.user_id,
      tipe_notifikasi: "status",
      pesan: status === "diterima"
        ? `Pengajuan peminjaman mobil Anda DISETUJUI oleh ${adminName} (${adminRoleLabel})${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`
        : `Pengajuan peminjaman mobil Anda DITOLAK oleh ${adminName} (${adminRoleLabel})${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`,
      pengajuan_id: pengajuan.id
    });


    const io = req.app.get("io");
    if (io) {
      io.to(`user_${pengajuan.user_id}`).emit("notifikasi_baru", notifUser);
    }

    return success(res, `Pengajuan berhasil ${status}`, {
      pengajuan_id: pengajuan.id
    });

  } catch (err) {
    logger.error("❌ ERROR PROSES PENGAJUAN:", err);
    return error(res, "Gagal memproses pengajuan", err.message, 500);
  }
};
