//models/mobil.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Mobil = sequelize.define('Mobil', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  plat_nomor: { type: DataTypes.STRING, allowNull: false },
  tipe_mobil: { type: DataTypes.STRING, allowNull: false },
  status: { 
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: "tersedia"
},
  gps_device_id: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'mobil',
  timestamps: false,
});

module.exports = Mobil;
