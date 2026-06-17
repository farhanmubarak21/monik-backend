// controllers/pengajuanController.js
// ✅ FIX NOTIF DOUBLE: Simpan 1 notif saja (ke admin utama),
//    broadcast socket ke admin_room — semua admin+security terima real-time
//    tanpa membuat banyak row di tabel notifikasi

const {
  Pengajuan, Mobil, User, Notifikasi, RiwayatPeminjaman,
} = require("../models");
const { success, error } = require("../utils/response");
const logger = require("../utils/logger");
const { Op, literal } = require("sequelize");

/* =========================
   CREATE PENGAJUAN (USER)
========================= */
exports.createPengajuan = async (req, res) => {
  try {
    const { mobil_id, alasan } = req.body;
    const user_id = req.user.id;

    const user  = await User.findByPk(user_id);
    const mobil = await Mobil.findByPk(mobil_id);
    if (!user || !mobil) return error(res, "Data tidak ditemukan", null, 404);

    if (mobil.status !== "tersedia") {
      return error(res, "Kendaraan tidak tersedia untuk dipinjam", null, 400);
    }

    const aktif = await Pengajuan.findOne({
      where: { user_id, status_pengajuan: "diterima" },
    });
    if (aktif) {
      return error(res, "Anda sedang meminjam kendaraan, selesaikan dulu sebelum mengajukan baru", null, 400);
    }

    const pengajuan = await Pengajuan.create({
      user_id, mobil_id, alasan,
      status_pengajuan: "diajukan",
      waktu_pengajuan:  new Date(),
    });

    // ✅ SIMPAN HANYA 1 NOTIF — ke admin utama (id terkecil)
    // Socket broadcast ke admin_room supaya semua admin+security terima real-time
    // tanpa membuat banyak row duplikat di DB
    const adminUtama = await User.findOne({
      where: { role: "admin" },
      order: [["id", "ASC"]],
    });

    let notifBaru = null;

    if (adminUtama) {
      // Cek duplikat (jaga-jaga kalau user klik submit 2x)
      const sudahAda = await Notifikasi.findOne({
        where: {
          pengajuan_id:    pengajuan.id,
          tipe_notifikasi: "pengajuan",
        },
      });

      if (!sudahAda) {
        notifBaru = await Notifikasi.create({
          user_id:         adminUtama.id,
          pengajuan_id:    pengajuan.id,
          tipe_notifikasi: "pengajuan",
          pesan: `Pengajuan baru dari ${user.nama}${user.bidang ? ` (${user.bidang})` : ""}\nKendaraan: ${mobil.plat_nomor} — ${mobil.tipe_mobil}\nKeperluan: ${alasan}`,
          waktu_notif:     new Date(),
        });
      }
    }

    // Emit ke semua yang ada di admin_room (1 kali broadcast)
    const io = req.app.get("io");
    if (notifBaru && io) {
      io.to("admin_room").emit("notifikasi_baru", notifBaru);
    }

    logger.info(`📋 Pengajuan baru: ${user.nama} → ${mobil.plat_nomor}`);
    return success(res, "Pengajuan berhasil dikirim", pengajuan, 201);

  } catch (err) {
    logger.error(err.message);
    return error(res, "Gagal membuat pengajuan", err.message, 500);
  }
};

/* =========================
   GET ALL PENGAJUAN (ADMIN + SECURITY)
========================= */
exports.getAllPengajuan = async (req, res) => {
  try {
    const data = await Pengajuan.findAll({
      include: [
        { model: User,  attributes: ["id", "nama", "email", "bidang"] },
        { model: Mobil, attributes: ["id", "plat_nomor", "tipe_mobil"] },
      ],
      order: [
        [literal(`CASE
          WHEN status_pengajuan = 'diterima' THEN 0
          WHEN status_pengajuan = 'diajukan' THEN 1
          WHEN status_pengajuan = 'ditolak'  THEN 2
          WHEN status_pengajuan = 'selesai'  THEN 3
          ELSE 4
        END`), "ASC"],
        ["waktu_pengajuan", "DESC"],
      ],
    });
    return success(res, "Data pengajuan berhasil diambil", data);
  } catch (err) {
    logger.error(err.message);
    return error(res, "Gagal mengambil pengajuan", err.message, 500);
  }
};

/* =========================
   GET DETAIL PENGAJUAN
========================= */
exports.getPengajuanById = async (req, res) => {
  try {
    const data = await Pengajuan.findByPk(req.params.id, {
      include: [
        { model: User,  attributes: ["id", "nama", "email", "bidang"] },
        { model: Mobil, attributes: ["id", "plat_nomor", "tipe_mobil"] },
      ],
    });
    if (!data) return error(res, "Pengajuan tidak ditemukan", null, 404);
    return success(res, "Detail pengajuan", data);
  } catch (err) {
    return error(res, "Gagal mengambil pengajuan", err.message, 500);
  }
};

/* =========================
   DELETE PENGAJUAN
========================= */
exports.deletePengajuan = async (req, res) => {
  try {
    const pengajuan = await Pengajuan.findByPk(req.params.id);
    if (!pengajuan) return error(res, "Pengajuan tidak ditemukan", null, 404);
    await pengajuan.destroy();
    return success(res, "Pengajuan berhasil dihapus");
  } catch (err) {
    return error(res, "Gagal menghapus pengajuan", err.message, 500);
  }
};

/* =========================
   UPDATE PENGAJUAN (TERIMA/TOLAK)
========================= */
exports.updatePengajuan = async (req, res) => {
  try {
    const { status_pengajuan, catatan_admin } = req.body;
    if (!["diterima", "ditolak"].includes(status_pengajuan)) {
      return error(res, "Status tidak valid", null, 400);
    }

    const pengajuan = await Pengajuan.findByPk(req.params.id);
    if (!pengajuan) return error(res, "Pengajuan tidak ditemukan", null, 404);

    const mobil = await Mobil.findByPk(pengajuan.mobil_id);
    if (!mobil)  return error(res, "Kendaraan tidak ditemukan", null, 404);

    const admin          = await User.findByPk(req.user.id);
    const adminName      = admin?.nama || "Admin";
    const adminRoleLabel = req.user.role === "security" ? "Admin Security" : "Admin Internal";

    await pengajuan.update({
      status_pengajuan,
      catatan_admin:      catatan_admin || null,
      diproses_oleh:      adminName,
      diproses_oleh_role: adminRoleLabel,
      waktu_diproses:     new Date(),
    });

    if (status_pengajuan === "diterima") {
      await mobil.update({ status: "terpakai" });
    }

    const notifUser = await Notifikasi.create({
      user_id:         pengajuan.user_id,
      pengajuan_id:    pengajuan.id,
      tipe_notifikasi: "status",
      pesan: status_pengajuan === "diterima"
        ? `Pengajuan kendaraan ${mobil.plat_nomor} Anda DISETUJUI oleh ${adminName} (${adminRoleLabel})${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`
        : `Pengajuan kendaraan ${mobil.plat_nomor} Anda DITOLAK oleh ${adminName} (${adminRoleLabel})${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`,
      waktu_notif: new Date(),
    });

    // Tandai notif pengajuan ini sudah dibaca
    await Notifikasi.update(
      { is_read: true },
      { where: { pengajuan_id: pengajuan.id, tipe_notifikasi: "pengajuan" } }
    );

    const io = req.app.get("io");
    if (io) io.to(`user_${pengajuan.user_id}`).emit("notifikasi_baru", notifUser);

    return success(res, "Pengajuan berhasil diproses");
  } catch (err) {
    logger.error(err.message);
    return error(res, "Gagal memproses pengajuan", err.message, 500);
  }
};

/* =========================
   GET PENGAJUAN USER LOGIN
========================= */
exports.getPengajuanUser = async (req, res) => {
  try {
    const data = await Pengajuan.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Mobil, attributes: ["plat_nomor", "tipe_mobil"] },
        { model: RiwayatPeminjaman, attributes: ["waktu_kembali", "status_kembali"], required: false },
      ],
      order: [["waktu_pengajuan", "DESC"]],
    });
    return success(res, "Pengajuan user", data);
  } catch (err) {
    return error(res, "Gagal ambil pengajuan user", err.message, 500);
  }
};

/* =========================
   KONFIRMASI PENGEMBALIAN
========================= */
exports.konfirmasiPengembalian = async (req, res) => {
  try {
    const { catatan_admin } = req.body;
    const pengajuan = await Pengajuan.findByPk(req.params.id);
    if (!pengajuan) return error(res, "Pengajuan tidak ditemukan", null, 404);
    if (pengajuan.status_pengajuan !== "diterima") {
      return error(res, "Pengajuan belum aktif", null, 400);
    }

    const mobil          = await Mobil.findByPk(pengajuan.mobil_id);
    const admin          = await User.findByPk(req.user.id);
    const adminName      = admin?.nama || "Admin";
    const adminRoleLabel = req.user.role === "security" ? "Admin Security" : "Admin Internal";

    await pengajuan.update({
      status_pengajuan:           "selesai",
      dikembalikan_oleh:          adminName,
      dikembalikan_oleh_role:     adminRoleLabel,
      catatan_pengembalian_admin: catatan_admin || null,
      waktu_dikembalikan:         new Date(),
    });

    await mobil.update({ status: "tersedia" });

    await RiwayatPeminjaman.create({
      pengajuan_id:   pengajuan.id,
      mobil_id:       mobil.id,
      status_kembali: "kembali",
      waktu_kembali:  new Date(),
    });

    const notif = await Notifikasi.create({
      user_id:         pengajuan.user_id,
      pengajuan_id:    pengajuan.id,
      tipe_notifikasi: "status",
      pesan: `Pengembalian kendaraan ${mobil.plat_nomor} dikonfirmasi oleh ${adminName} (${adminRoleLabel})${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`,
      waktu_notif: new Date(),
    });

    const io = req.app.get("io");
    if (io) io.to(`user_${pengajuan.user_id}`).emit("notifikasi_baru", notif);

    return success(res, "Pengajuan selesai & riwayat tersimpan");
  } catch (err) {
    return error(res, "Gagal konfirmasi pengembalian", err.message, 500);
  }
};