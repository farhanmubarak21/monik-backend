//mobilValidator.js
const { body } = require("express-validator");

exports.mobilValidator = [
  body("tipe_mobil")
    .notEmpty()
    .withMessage("Tipe mobil wajib diisi"),

  body("plat_nomor")
    .notEmpty()
    .withMessage("Plat nomor wajib diisi"),

  body("status")
    .optional()
    .isIn(["tersedia", "terpakai"])
    .withMessage("Status harus tersedia atau terpakai"),

  body("gps_device_id")
    .optional()
    .isString()
    .withMessage("ID GPS harus string"),
];