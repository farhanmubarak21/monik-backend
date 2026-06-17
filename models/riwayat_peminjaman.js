// models/riwayat_peminjaman.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RiwayatPeminjaman = sequelize.define(
  "RiwayatPeminjaman",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pengajuan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mobil_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status_kembali: {
      type: DataTypes.STRING(20),
      defaultValue: "kembali",
    },

    waktu_kembali: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "riwayat_peminjaman",
    timestamps: false,
  }
);

module.exports = RiwayatPeminjaman;