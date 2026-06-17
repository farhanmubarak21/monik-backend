// models/index.js
const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Import semua model
const User                = require('./users');
const Mobil               = require('./mobil');
const Pengajuan           = require('./pengajuan');
const Notifikasi          = require('./notifikasi');
const GPSData             = require('./gps_data');
const ZonaGPS             = require('./zona_gps');
const RiwayatPeminjaman   = require('./riwayat_peminjaman');
const LaporanPengembalian = require('./laporan_pengembalian'); 

// ── Relasi User - Pengajuan ──────────────────────────────
User.hasMany(Pengajuan, { foreignKey: 'user_id' });
Pengajuan.belongsTo(User, { foreignKey: 'user_id' });

// ── Relasi Mobil - Pengajuan ─────────────────────────────
Mobil.hasMany(Pengajuan, { foreignKey: 'mobil_id' });
Pengajuan.belongsTo(Mobil, { foreignKey: 'mobil_id' });

// ── Relasi Notifikasi - Pengajuan ────────────────────────
Notifikasi.belongsTo(Pengajuan, { foreignKey: 'pengajuan_id' });
Pengajuan.hasMany(Notifikasi, { foreignKey: 'pengajuan_id' });

// ── Relasi Mobil - GPSData ───────────────────────────────
Mobil.hasMany(GPSData, { foreignKey: 'mobil_id' });
GPSData.belongsTo(Mobil, { foreignKey: 'mobil_id' });

// ── Relasi User - Notifikasi ─────────────────────────────
User.hasMany(Notifikasi, { foreignKey: 'user_id' });
Notifikasi.belongsTo(User, { foreignKey: 'user_id' });

// ── Relasi Pengajuan - RiwayatPeminjaman ─────────────────
Pengajuan.hasOne(RiwayatPeminjaman, { foreignKey: 'pengajuan_id' });
RiwayatPeminjaman.belongsTo(Pengajuan, { foreignKey: 'pengajuan_id' });

// ── Relasi Mobil - RiwayatPeminjaman ────────────────────
Mobil.hasMany(RiwayatPeminjaman, { foreignKey: 'mobil_id' });
RiwayatPeminjaman.belongsTo(Mobil, { foreignKey: 'mobil_id' });

// ── Relasi LaporanPengembalian ───────────────────────────
Pengajuan.hasOne(LaporanPengembalian, { foreignKey: 'pengajuan_id' });
LaporanPengembalian.belongsTo(Pengajuan, { foreignKey: 'pengajuan_id' });


User.hasMany(LaporanPengembalian, { foreignKey: 'user_id' });
LaporanPengembalian.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Mobil,
  Pengajuan,
  Notifikasi,
  GPSData,
  ZonaGPS,
  RiwayatPeminjaman,
  LaporanPengembalian, 
};
