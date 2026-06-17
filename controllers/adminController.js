// controllers/adminController.js
const { sequelize } = require("../models");
const Mobil             = require("../models/mobil");
const Pengajuan         = require("../models/pengajuan");
const Notifikasi        = require("../models/notifikasi");
const RiwayatPeminjaman = require("../models/riwayat_peminjaman");
const User              = require("../models/users");
const { Op }            = require("sequelize");

// ══════════════════════════════════════════════════════
// TERIMA PENGAJUAN (ADMIN / SECURITY)
// ══════════════════════════════════════════════════════
exports.terimaPengajuan = async (req, res) => {
  try {
    const { id }       = req.params;
    const pengajuan    = await Pengajuan.findByPk(id);
    if (!pengajuan)
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

    const admin          = await User.findByPk(req.user.id);
    const adminName      = admin?.nama || "Admin";
    const adminRoleLabel = req.user.role === "security" ? "Admin Security" : "Admin Internal";

    await pengajuan.update({
      status_pengajuan:  "diterima",
      diproses_oleh:     adminName,
      diproses_oleh_role: adminRoleLabel,
      waktu_diproses:    new Date(),
    });

    await Mobil.update({ status: "terpakai" }, { where: { id: pengajuan.mobil_id } });

    await Notifikasi.create({
      user_id:         pengajuan.user_id,
      pengajuan_id:    pengajuan.id,
      tipe_notifikasi: "status",
      pesan:           `Pengajuan peminjaman Anda DISETUJUI oleh ${adminName} (${adminRoleLabel}).`,
    });

    return res.json({ success: true, message: "Pengajuan berhasil diterima" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════
// TOLAK PENGAJUAN (ADMIN / SECURITY)
// ══════════════════════════════════════════════════════
exports.tolakPengajuan = async (req, res) => {
  try {
    const { id }       = req.params;
    const pengajuan    = await Pengajuan.findByPk(id);
    if (!pengajuan)
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

    const admin          = await User.findByPk(req.user.id);
    const adminName      = admin?.nama || "Admin";
    const adminRoleLabel = req.user.role === "security" ? "Admin Security" : "Admin Internal";

    await pengajuan.update({
      status_pengajuan:  "ditolak",
      diproses_oleh:     adminName,
      diproses_oleh_role: adminRoleLabel,
      waktu_diproses:    new Date(),
    });

    await Notifikasi.create({
      user_id:         pengajuan.user_id,
      pengajuan_id:    pengajuan.id,
      tipe_notifikasi: "status",
      pesan:           `Pengajuan peminjaman Anda DITOLAK oleh ${adminName} (${adminRoleLabel}).`,
    });

    return res.json({ success: true, message: "Pengajuan berhasil ditolak" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════
// KEMBALIKAN MOBIL (ADMIN / SECURITY)
// ══════════════════════════════════════════════════════
exports.kembalikanMobil = async (req, res) => {
  try {
    const { id }    = req.params;
    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan)
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

    await Mobil.update({ status: "tersedia" }, { where: { id: pengajuan.mobil_id } });
    await pengajuan.update({ status_pengajuan: "selesai" });

    await RiwayatPeminjaman.update(
      { status_kembali: "kembali", waktu_kembali: new Date() },
      { where: { pengajuan_id: pengajuan.id } }
    );

    await Notifikasi.create({
      user_id:         pengajuan.user_id,
      pengajuan_id:    pengajuan.id,
      tipe_notifikasi: "status",
      pesan:           `Pengembalian kendaraan Anda telah dikonfirmasi.`,
    });

    return res.json({ success: true, message: "Mobil berhasil dikembalikan" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


exports.getAdminStats = async (req, res) => {
  try {
    const totalMobil       = await Mobil.count();
    const mobilTersedia    = await Mobil.count({ where: { status: "tersedia" } });
    const mobilTerpakai    = await Mobil.count({ where: { status: "terpakai" } });
    const peminjamanAktif  = await Pengajuan.count({ where: { status_pengajuan: "diterima" } });
    const pengajuanMenunggu = await Pengajuan.count({ where: { status_pengajuan: "diajukan" } });
    const totalUser        = await User.count({ where: { role: "user" } });

    const notifBaru = await Notifikasi.count({
      where: {
        waktu_notif: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Peminjaman selesai bulan ini
    const now  = new Date();
    const awal = new Date(now.getFullYear(), now.getMonth(), 1);
    const akhir = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const selesaiBulanIni = await RiwayatPeminjaman.count({
      where: {
        waktu_kembali: { [Op.between]: [awal, akhir] },
        status_kembali: "kembali",
      },
    });

    return res.json({
      success: true,
      message: "Data statistik berhasil diambil",
      data: {
        totalMobil,
        mobilTersedia,
        mobilTerpakai,
        peminjamanAktif,
        pengajuanMenunggu,
        totalUser,
        notifBaru,
        selesaiBulanIni,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Gagal memuat statistik", error: err.message });
  }
};

// ══════════════════════════════════════════════════════
// DATA GRAFIK RIWAYAT
// ══════════════════════════════════════════════════════
exports.getRiwayatGrafik = async (req, res) => {
  try {
    const riwayat = await RiwayatPeminjaman.findAll({
      attributes: ["id", "pengajuan_id", "mobil_id", "waktu_kembali", "status_kembali"],
      order: [["waktu_kembali", "ASC"]],
      limit: 500,
    });
    return res.json({ success: true, message: "Data grafik berhasil diambil", data: riwayat });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════
// GET LOKASI MOBIL (GPS)
// ══════════════════════════════════════════════════════
exports.getLokasiMobil = async (req, res) => {
  try {
    const sql = `
      SELECT m.id, m.plat_nomor, m.tipe_mobil, m.status,
             latest.latitude, latest.longitude, latest.waktu
      FROM mobil m
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, waktu
        FROM gps_data g
        WHERE g.mobil_id = m.id
        ORDER BY waktu DESC LIMIT 1
      ) latest ON true
      ORDER BY m.id;
    `;
    const lokasi = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
    return res.json({ success: true, data: lokasi });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};