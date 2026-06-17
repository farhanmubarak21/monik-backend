// controllers/mobilController.js
const { Mobil, Pengajuan, User } = require("../models");
const { success, error } = require("../utils/response");
const logger = require("../utils/logger");

exports.createMobil = async (req, res) => {
  try {
    const { plat_nomor, tipe_mobil, gps_device_id } = req.body;
    const existing = await Mobil.findOne({ where: { plat_nomor } });
    if (existing) return error(res, "Plat nomor sudah terdaftar", null, 400);
    const mobil = await Mobil.create({ plat_nomor, tipe_mobil, status: "tersedia", gps_device_id });
    logger.info(`🚗 Mobil baru: ${tipe_mobil} (${plat_nomor})`);
    return success(res, "Mobil berhasil ditambahkan", mobil, 201);
  } catch (err) {
    return error(res, "Gagal menambah mobil", err.message, 500);
  }
};

exports.getAllMobil = async (req, res) => {
  try {
    const mobil = await Mobil.findAll();
    return success(res, "List mobil", mobil);
  } catch (err) {
    return error(res, "Gagal mengambil data", err.message, 500);
  }
};

exports.getMobilById = async (req, res) => {
  try {
    const mobil = await Mobil.findByPk(req.params.id);
    if (!mobil) return error(res, "Mobil tidak ditemukan", null, 404);
    return success(res, "Detail mobil", mobil);
  } catch (err) {
    return error(res, "Gagal mengambil data", err.message, 500);
  }
};

exports.updateMobil = async (req, res) => {
  try {
    const mobil = await Mobil.findByPk(req.params.id);
    if (!mobil) return error(res, "Mobil tidak ditemukan", null, 404);
    await mobil.update(req.body);
    return success(res, "Mobil berhasil diperbarui", mobil);
  } catch (err) {
    return error(res, "Gagal memperbarui mobil", err.message, 500);
  }
};

exports.deleteMobil = async (req, res) => {
  try {
    const mobil = await Mobil.findByPk(req.params.id);
    if (!mobil) return error(res, "Mobil tidak ditemukan", null, 404);
    await mobil.destroy();
    return success(res, "Mobil berhasil dihapus");
  } catch (err) {
    return error(res, "Gagal hapus mobil", err.message, 500);
  }
};

// ✅ REVISI: tambah bidang user di monitoring
exports.getMonitoringMobil = async (req, res) => {
  try {
    const mobil = await Mobil.findAll({
      include: [
        {
          model: Pengajuan,
          where: { status_pengajuan: "diterima" },
          required: false,
          include: [
            {
              model: User,
              // ✅ Tambah bidang
              attributes: ["nama", "bidang"],
            },
          ],
          order: [["waktu_pengajuan", "DESC"]],
        },
      ],
      order: [["tipe_mobil", "ASC"]],
    });

    const data = mobil.map((m) => {
      let nama_user   = null;
      let bidang_user = null;
      let waktu_pinjam = null;

      if (m.Pengajuans && m.Pengajuans.length > 0) {
        const p = m.Pengajuans[0];
        nama_user    = p?.User?.nama   || null;
        bidang_user  = p?.User?.bidang || null;
        waktu_pinjam = p?.waktu_pengajuan || null;
      }

      return {
        id:            m.id,
        plat_nomor:    m.plat_nomor,
        tipe_mobil:    m.tipe_mobil,
        gps_device_id: m.gps_device_id,
        status:        m.status,
        nama_user,
        bidang_user,   
        waktu_pinjam,
      };
    });

    return success(res, "Monitoring mobil", data);
  } catch (err) {
    return error(res, "Gagal monitoring mobil", err.message, 500);
  }
};