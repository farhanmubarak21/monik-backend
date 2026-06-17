// models/pengajuan.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pengajuan = sequelize.define(
  "Pengajuan",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mobil_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    alasan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    waktu_pengajuan: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    
    status_pengajuan: {
      type: DataTypes.STRING(20),
      defaultValue: "diajukan",
    },

    // Kolom baru dari ALTER TABLE
    catatan_admin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diproses_oleh: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    diproses_oleh_role: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    waktu_diproses: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dikembalikan_oleh: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dikembalikan_oleh_role: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    catatan_pengembalian_admin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    waktu_dikembalikan: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "pengajuan",
    timestamps: false,
  }
);

module.exports = Pengajuan;