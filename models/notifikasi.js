//models/notifikasi.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notifikasi = sequelize.define('Notifikasi', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },

  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },

  pengajuan_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },

  tipe_notifikasi: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },

  pesan: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },

  waktu_notif: { 
    type: DataTypes.DATE, 
    allowNull: false, 
    defaultValue: DataTypes.NOW 
  },

  is_read: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },

}, {
  tableName: 'notifikasi',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false   
});

module.exports = Notifikasi;
