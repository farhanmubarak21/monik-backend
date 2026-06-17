// validators/authValidator.js
const { body } = require('express-validator');

exports.registerValidator = [
  body('nama')
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),

  body('username')
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3 }).withMessage('Username minimal 3 karakter')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, dan underscore'),

  body('email')
    .trim()
    .notEmpty().withMessage('ID Pegawai (email) wajib diisi')
    .isLength({ min: 3 }).withMessage('ID Pegawai minimal 3 karakter')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('ID Pegawai hanya boleh huruf, angka, titik (.), underscore (_), dan strip (-)'),

  body('password')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf kapital')
    .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password harus mengandung minimal 1 karakter khusus (!@#$%^&*)'),

  body('role')
    .optional()
    .isIn(['admin', 'security', 'user']).withMessage('Role tidak valid'),
];

exports.loginValidator = [
 
  body('email')
    .trim()
    .notEmpty().withMessage('ID Pegawai (email) wajib diisi'),

  body('password')
    .notEmpty().withMessage('Password wajib diisi'),
];