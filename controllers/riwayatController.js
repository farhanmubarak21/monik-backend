// controllers/riwayatController.js
const { RiwayatPeminjaman, Pengajuan, Mobil, User } = require("../models");
const { success, error } = require("../utils/response");
const logger = require("../utils/logger");
const ExcelJS = require("exceljs");

exports.createRiwayat = async (req, res) => {
  try {
    const { pengajuan_id, mobil_id, status_kembali } = req.body;
    const riwayat = await RiwayatPeminjaman.create({
      pengajuan_id, mobil_id, status_kembali, waktu_kembali: new Date(),
    });
    if (status_kembali === "kembali") {
      const mobil = await Mobil.findByPk(mobil_id);
      if (mobil) await mobil.update({ status: "tersedia" });
    }
    return success(res, "Riwayat berhasil dibuat", riwayat, 201);
  } catch (err) {
    return error(res, "Gagal membuat riwayat", err.message, 500);
  }
};

exports.getAllRiwayat = async (req, res) => {
  try {
    const data = await RiwayatPeminjaman.findAll({
      include: [
        {
          model: Pengajuan,
          attributes: ["alasan", "waktu_pengajuan", "diproses_oleh", "diproses_oleh_role", "catatan_admin", "catatan_pengembalian_admin"],
          include: [
            // ✅ Sertakan bidang user
            { model: User, attributes: ["nama", "bidang"] },
          ],
        },
        { model: Mobil, attributes: ["plat_nomor", "tipe_mobil"] },
      ],
      order: [["waktu_kembali", "DESC"]],
    });

    const result = data.map((r) => {
      const waktuPakai   = r.Pengajuan?.waktu_pengajuan || null;
      const waktuKembali = r.waktu_kembali              || null;
      let durasi = null;
      if (waktuPakai && waktuKembali) {
        const diff = new Date(waktuKembali) - new Date(waktuPakai);
        durasi = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        id:             r.id,
        nama_user:      r.Pengajuan?.User?.nama    || "-",
        bidang_user:    r.Pengajuan?.User?.bidang  || "-",  // ✅ BARU
        plat_nomor:     r.Mobil?.plat_nomor        || "-",
        tipe_mobil:     r.Mobil?.tipe_mobil        || "-",
        keperluan:      r.Pengajuan?.alasan        || "-",
        alasan:         r.Pengajuan?.alasan        || "-",
        status_kembali: r.status_kembali,
        waktu_pakai:    waktuPakai,
        waktu_kembali:  waktuKembali,
        durasi_hari:    durasi,
        diproses_oleh:      r.Pengajuan?.diproses_oleh      || null,
        diproses_oleh_role: r.Pengajuan?.diproses_oleh_role || null,
        catatan_admin:      r.Pengajuan?.catatan_admin      || null,
        catatan_pengembalian: r.Pengajuan?.catatan_pengembalian_admin || null,
      };
    });

    return res.json({ success: true, message: "Riwayat lengkap", data: result });
  } catch (err) {
    console.error("ERROR RIWAYAT:", err);
    return res.status(500).json({ success: false, message: "Gagal ambil riwayat" });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const data = await RiwayatPeminjaman.findAll({
      include: [
        {
          model: Pengajuan,
          attributes: ["alasan", "waktu_pengajuan", "diproses_oleh", "diproses_oleh_role", "catatan_admin"],
          // ✅ Sertakan bidang
          include: [{ model: User, attributes: ["nama", "bidang"] }],
        },
        { model: Mobil, attributes: ["plat_nomor", "tipe_mobil"] },
      ],
      order: [["waktu_kembali", "DESC"]],
    });

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Riwayat Peminjaman");

    worksheet.mergeCells("A1:K1");
    worksheet.getCell("A1").value     = "PT PLN (Persero) UP3 Pekanbaru";
    worksheet.getCell("A1").font      = { bold: true, size: 13, color: { argb: "FF0F766E" } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:K2");
    worksheet.getCell("A2").value     = "Laporan Riwayat Peminjaman Kendaraan (MONIK)";
    worksheet.getCell("A2").font      = { bold: true, size: 11 };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    worksheet.mergeCells("A3:K3");
    worksheet.getCell("A3").value = `Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    })} WIB`;
    worksheet.getCell("A3").font      = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    worksheet.getCell("A3").alignment = { horizontal: "center" };
    worksheet.addRow([]);

    // ✅ Header kolom — tambah kolom Bidang
    const headerRow = worksheet.addRow([
      "No", "Nama User", "Bidang", "Plat Nomor", "Tipe Mobil",
      "Keperluan", "Waktu Pinjam (WIB)", "Waktu Kembali (WIB)",
      "Durasi", "Status", "Diproses Oleh", "Catatan Admin",
    ]);

    headerRow.eachCell((cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border    = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
    headerRow.height = 22;

    const fmt = (iso) => {
      if (!iso) return "-";
      return new Date(iso).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    };
    const durasi = (mulai, kembali) => {
      if (!mulai || !kembali) return "-";
      const diff = new Date(kembali) - new Date(mulai);
      if (diff <= 0) return "-";
      const jam  = Math.floor(diff / (1000 * 60 * 60));
      const hari = Math.floor(jam / 24);
      const sisa = jam % 24;
      const menit = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hari > 0) return sisa > 0 ? `${hari} hari ${sisa} jam` : `${hari} hari`;
      return sisa > 0 ? `${sisa} jam ${menit} menit` : `${menit} menit`;
    };

    data.forEach((r, i) => {
      const waktuPakai   = r.Pengajuan?.waktu_pengajuan || null;
      const waktuKembali = r.waktu_kembali              || null;
      const isEven       = i % 2 === 1;

      const row = worksheet.addRow([
        i + 1,
        r.Pengajuan?.User?.nama   || "-",
        r.Pengajuan?.User?.bidang || "-",  // ✅ BARU
        r.Mobil?.plat_nomor       || "-",
        r.Mobil?.tipe_mobil       || "-",
        r.Pengajuan?.alasan       || "-",
        fmt(waktuPakai),
        fmt(waktuKembali),
        durasi(waktuPakai, waktuKembali),
        r.status_kembali === "kembali" ? "Sudah Kembali" : r.status_kembali || "-",
        r.Pengajuan?.diproses_oleh
          ? `${r.Pengajuan.diproses_oleh} (${r.Pengajuan.diproses_oleh_role || "-"})`
          : "-",
        r.Pengajuan?.catatan_admin || "-",
      ]);

      if (isEven) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDFC" } };
        });
      }
      row.eachCell((cell) => {
        cell.border    = { bottom: { style: "hair" }, right: { style: "hair" } };
        cell.font      = { size: 10 };
        cell.alignment = { vertical: "middle" };
      });
      const statusCell = row.getCell(10);
      if (r.status_kembali === "kembali") {
        statusCell.font = { bold: true, color: { argb: "FF059669" }, size: 10 };
      }
    });

    // ✅ Lebar kolom (12 kolom)
    worksheet.columns = [
      { width: 5  }, { width: 22 }, { width: 20 }, { width: 14 }, { width: 18 },
      { width: 30 }, { width: 22 }, { width: 22 }, { width: 16 }, { width: 16 },
      { width: 28 }, { width: 30 },
    ];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 4) row.height = 18;
    });

    const filename = `riwayat-peminjaman-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const buffer   = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
    logger.info(`📥 Export Excel: ${data.length} baris`);
  } catch (err) {
    logger.error(`❌ Gagal export: ${err.message}`);
    return error(res, "Gagal mengekspor data", err.message, 500);
  }
};

exports.getRiwayatById = async (req, res) => {
  try {
    const data = await RiwayatPeminjaman.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Riwayat tidak ditemukan" });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRiwayat = async (req, res) => {
  try {
    const riwayat = await RiwayatPeminjaman.findByPk(req.params.id);
    if (!riwayat) return res.status(404).json({ success: false, message: "Riwayat tidak ditemukan" });
    await riwayat.update(req.body);
    return res.json({ success: true, message: "Riwayat berhasil diupdate", data: riwayat });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRiwayat = async (req, res) => {
  try {
    const riwayat = await RiwayatPeminjaman.findByPk(req.params.id);
    if (!riwayat) return res.status(404).json({ success: false, message: "Riwayat tidak ditemukan" });
    await riwayat.destroy();
    return res.json({ success: true, message: "Riwayat berhasil dihapus" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};