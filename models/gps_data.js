// models/gps_data.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GPSData = sequelize.define('GPSData', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  mobil_id: { type: DataTypes.INTEGER, allowNull: false },
  latitude: { type: DataTypes.DECIMAL(9,6), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(9,6), allowNull: false },
  waktu: { 
    type: DataTypes.DATE, 
    allowNull: false,
    defaultValue: DataTypes.NOW  
  }
}, {
  tableName: 'gps_data',
  timestamps: false,
});

module.exports = GPSData;
