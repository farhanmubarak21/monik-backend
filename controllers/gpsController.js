//gpsController.js
const { GPSData, ZonaGPS, Notifikasi, User, Mobil } = require('../models');
const haversineDistance = require('../utils/geo');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

exports.createGPSData = async (req, res) => {
  try {
    const { mobil_id, latitude, longitude } = req.body;

    const gps = await GPSData.create({
      mobil_id,
      latitude,
      longitude
    });

    const mobil = await Mobil.findByPk(mobil_id);

    
    const io = req.app.get("io");

    if (io) {
      io.emit("locationUpdated", {
        id: mobil_id,
        plat_nomor: mobil.plat_nomor,
        tipe_mobil: mobil.tipe_mobil,
        status: mobil.status,
        latitude: Number(latitude),
        longitude: Number(longitude),
        waktu: gps.waktu
      });
    }

    return success(res, "GPS Data berhasil disimpan", gps, 201);

  } catch (err) {
    return error(res, "Gagal simpan GPS Data", err.message, 500);
  }
};


exports.getGPSData = async (req, res) => {
  try {
    const data = await GPSData.findAll({
      include: [{
        model: Mobil,
        attributes: ["plat_nomor", "tipe_mobil", "status"]
      }],
      order: [["waktu", "DESC"]],
      limit: 100
    });

    return success(res, "Data GPS berhasil diambil", data);
  } catch (err) {
    logger.error(`❌ Gagal ambil GPS Data: ${err.message}`);
    return error(res, "Gagal ambil GPS Data", err.message, 500);
  }
};
