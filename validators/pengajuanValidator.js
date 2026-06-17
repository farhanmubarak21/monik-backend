//pengajuanValidator.js
const { body } = require("express-validator");

exports.pengajuanValidator = [
  body("mobil_id")
    .notEmpty()
    .withMessage("Mobil wajib dipilih")
    .isInt()
    .withMessage("Mobil ID harus angka"),

  body("alasan")
    .notEmpty()
    .withMessage("Keperluan wajib diisi")
    .isLength({ min: 3 })
    .withMessage("Keperluan minimal 3 karakter"),
];
