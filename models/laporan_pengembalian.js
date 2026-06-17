// models/laporan_pengembalian.js
// ✅ FIX: Ganti DataTypes.ENUM → DataTypes.STRING

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LaporanPengembalian = sequelize.define('LaporanPengembalian', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  pengajuan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  foto_km: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  foto_bbm: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  angka_km: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  kondisi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  nota_bbm: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  waktu_laporan: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  // ✅ FIX: STRING bukan ENUM
  status_verifikasi: {
    type: DataTypes.STRING(20),
    defaultValue: 'menunggu',
  },

  catatan_admin: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'laporan_pengembalian',
  timestamps: false,
});

module.exports = LaporanPengembalian;