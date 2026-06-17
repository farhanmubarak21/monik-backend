// controllers/laporanController.js
const { LaporanPengembalian, Pengajuan, Mobil, User, Notifikasi } = require("../models");
const { success, error } = require("../utils/response");
const logger = require("../utils/logger");

exports.createLaporan = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { angka_km, kondisi } = req.body;

    const pengajuan = await Pengajuan.findOne({
      where: { user_id, status_pengajuan: "diterima" },
      include: [{ model: Mobil, attributes: ["plat_nomor", "tipe_mobil"] }],
    });
    if (!pengajuan) return error(res, "Tidak ada peminjaman aktif", null, 404);

    if (!req.files?.foto_km?.[0]) return error(res, "Foto speedometer wajib diunggah", null, 400);
    if (!req.files?.foto_bbm?.[0]) return error(res, "Foto indikator BBM wajib diunggah", null, 400);
    if (!angka_km || isNaN(angka_km)) return error(res, "Angka kilometer wajib diisi", null, 400);

    const sudahAda = await LaporanPengembalian.findOne({ where: { pengajuan_id: pengajuan.id } });
    if (sudahAda) return error(res, "Laporan untuk peminjaman ini sudah pernah dikirim", null, 400);

    const laporan = await LaporanPengembalian.create({
      pengajuan_id:      pengajuan.id,
      user_id,
      foto_km:           req.files.foto_km[0].filename,
      foto_bbm:          req.files.foto_bbm[0].filename,
      angka_km:          parseInt(angka_km),
      kondisi:           kondisi || "-",
      nota_bbm:          req.files?.nota_bbm?.[0]?.filename || null,
      status_verifikasi: "menunggu",
      waktu_laporan:     new Date(),
    });

    const userObj    = await User.findByPk(user_id);
    const adminUtama = await User.findOne({ where: { role: "admin" }, order: [["id", "ASC"]] });

    if (adminUtama) {
      const notif = await Notifikasi.create({
        user_id:         adminUtama.id,
        pengajuan_id:    pengajuan.id,
        tipe_notifikasi: "pengembalian",
        // ✅ sertakan bidang
        pesan: `Laporan pengembalian dari ${userObj?.nama || "user"}${userObj?.bidang ? ` (${userObj.bidang})` : ""}\nKendaraan: ${pengajuan.Mobil?.plat_nomor}\nAngka KM: ${parseInt(angka_km).toLocaleString("id-ID")} km`,
        waktu_notif: new Date(),
      });
      const io = req.app.get("io");
      if (io) io.to("admin_room").emit("notifikasi_baru", notif);
    }

    return success(res, "Laporan pengembalian berhasil dikirim", laporan, 201);
  } catch (err) {
    logger.error(`❌ Gagal buat laporan: ${err.message}`);
    return error(res, "Gagal mengirim laporan", err.message, 500);
  }
};

exports.getAllLaporan = async (req, res) => {
  try {
    const { literal } = require("sequelize");
    const data = await LaporanPengembalian.findAll({
      include: [
        {
          model: Pengajuan,
          attributes: ["alasan"],
          include: [{ model: Mobil, attributes: ["plat_nomor", "tipe_mobil"] }],
        },
        // ✅ Sertakan bidang
        { model: User, attributes: ["nama", "bidang"] },
      ],
      order: [
        [literal(`CASE
          WHEN status_verifikasi = 'menunggu'     THEN 0
          WHEN status_verifikasi = 'bermasalah'   THEN 1
          WHEN status_verifikasi = 'diverifikasi' THEN 2
          ELSE 3
        END`), "ASC"],
        ["waktu_laporan", "DESC"],
      ],
    });
    return success(res, "Data laporan berhasil diambil", data);
  } catch (err) {
    return error(res, "Gagal mengambil laporan", err.message, 500);
  }
};

exports.getLaporanById = async (req, res) => {
  try {
    const laporan = await LaporanPengembalian.findByPk(req.params.id, {
      include: [
        {
          model: Pengajuan,
          attributes: ["alasan"],
          include: [{ model: Mobil, attributes: ["plat_nomor", "tipe_mobil"] }],
        },
        { model: User, attributes: ["nama", "bidang"] },
      ],
    });
    if (!laporan) return error(res, "Laporan tidak ditemukan", null, 404);
    return success(res, "Detail laporan", laporan);
  } catch (err) {
    return error(res, "Gagal mengambil laporan", err.message, 500);
  }
};

exports.getMyLaporan = async (req, res) => {
  try {
    const data = await LaporanPengembalian.findAll({
      where: { user_id: req.user.id },
      order: [["waktu_laporan", "DESC"]],
    });
    return success(res, "Laporan milik user", data);
  } catch (err) {
    return error(res, "Gagal ambil laporan", err.message, 500);
  }
};

exports.verifikasiLaporan = async (req, res) => {
  try {
    const laporan = await LaporanPengembalian.findByPk(req.params.id);
    if (!laporan) return error(res, "Laporan tidak ditemukan", null, 404);

    const { status_verifikasi, catatan_admin } = req.body;
    if (!["diverifikasi", "bermasalah"].includes(status_verifikasi)) {
      return error(res, "Status tidak valid", null, 400);
    }

    await laporan.update({ status_verifikasi, catatan_admin: catatan_admin || null });

    const notif = await Notifikasi.create({
      user_id:         laporan.user_id,
      pengajuan_id:    laporan.pengajuan_id,
      tipe_notifikasi: "pengembalian",
      pesan: status_verifikasi === "diverifikasi"
        ? `Laporan pengembalian kendaraan Anda telah DIVERIFIKASI.${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`
        : `Laporan pengembalian Anda ditandai BERMASALAH.${catatan_admin ? `\nCatatan: ${catatan_admin}` : ""}`,
      waktu_notif: new Date(),
    });

    const io = req.app.get("io");
    if (io) io.to(`user_${laporan.user_id}`).emit("notifikasi_baru", notif);

    return success(res, "Laporan berhasil diverifikasi");
  } catch (err) {
    return error(res, "Gagal verifikasi", err.message, 500);
  }
};