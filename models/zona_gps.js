// models/zona_gps.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ZonaGPS = sequelize.define('ZonaGPS', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nama_zona: { type: DataTypes.STRING, allowNull: false },
  deskripsi: { type: DataTypes.TEXT, allowNull: true },
  latitude: { type: DataTypes.DECIMAL(9,6), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(9,6), allowNull: false },
  radius_m: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1000 }
}, {
  tableName: 'zona_gps',
  timestamps: false,
});

module.exports = ZonaGPS;
