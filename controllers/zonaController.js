//zonaController.js
const { ZonaGPS } = require('../models');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

// CREATE zona
exports.createZona = async (req, res) => {
  try {
    const { nama_zona, deskripsi, latitude, longitude, radius_m } = req.body;
    const zona = await ZonaGPS.create({ nama_zona, deskripsi, latitude, longitude, radius_m });

    logger.info(`📍 Zona baru ditambahkan: ${nama_zona}`);
    return success(res, "Zona berhasil dibuat", zona, 201);
  } catch (err) {
    logger.error(`❌ Gagal buat zona: ${err.message}`);
    return error(res, "Gagal membuat zona", err.message, 500);
  }
};

// GET semua zona
exports.getAllZona = async (req, res) => {
  try {
    const zona = await ZonaGPS.findAll();
    logger.info(`📍 Ambil semua zona (${zona.length} data)`);
    return success(res, "Data zona berhasil diambil", zona);
  } catch (err) {
    logger.error(`❌ Gagal ambil zona: ${err.message}`);
    return error(res, "Gagal mengambil zona", err.message, 500);
  }
};

// DELETE zona
exports.deleteZona = async (req, res) => {
  try {
    const zona = await ZonaGPS.findByPk(req.params.id);
    if (!zona) {
      logger.warn(`⚠️ Delete gagal: zona ID ${req.params.id} tidak ditemukan`);
      return error(res, "Zona tidak ditemukan", null, 404);
    }
    await zona.destroy();
    logger.info(`🗑️ Zona ID ${req.params.id} dihapus`);
    return success(res, "Zona dihapus");
  } catch (err) {
    logger.error(`❌ Gagal hapus zona: ${err.message}`);
    return error(res, "Gagal hapus zona", err.message, 500);
  }
};
