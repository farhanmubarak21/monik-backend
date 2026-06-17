// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { User } = require("../models");
const logger = require("../utils/logger");

/* ══════════════════════════════════════
   REGISTER
══════════════════════════════════════ */
exports.register = async (req, res) => {
  try {
    const { nama, username, email, password, bidang } = req.body;

    if (!nama || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, username, ID Pegawai, dan password wajib diisi",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password minimal 8 karakter" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password harus mengandung huruf kapital" });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password harus mengandung angka" });
    }

    const existingEmail    = await User.findOne({ where: { email } });
    const existingUsername = await User.findOne({ where: { username } });

    if (existingEmail)    return res.status(400).json({ success: false, message: "ID Pegawai sudah terdaftar" });
    if (existingUsername) return res.status(400).json({ success: false, message: "Username sudah digunakan" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nama,
      username,
      email,
      password: hashedPassword,
      role:     "user",
      bidang:   bidang || null,
    });

    logger.info(`✅ User baru: ${email} (${bidang || "bidang tidak diisi"})`);

    return res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat",
      data: {
        id:       user.id,
        nama:     user.nama,
        username: user.username,
        email:    user.email,
        bidang:   user.bidang,
        role:     user.role,
      },
    });
  } catch (err) {
    logger.error(`❌ Register error: ${err.message}`);
    return res.status(500).json({ success: false, message: "Gagal membuat akun", error: err.message });
  }
};

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "ID Pegawai dan password wajib diisi" });
    }

    // Cocokkan apa adanya (case-sensitive sesuai data yang disimpan admin)
    const user = await User.findOne({ where: { email: email.trim() } });
    if (!user) {
      return res.status(401).json({ success: false, message: "ID Pegawai atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "ID Pegawai atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret_monik_pln",
      { expiresIn: "7d" }
    );

    logger.info(`🔐 Login: ${email} (${user.role})`);

    return res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        id:     user.id,
        nama:   user.nama,
        email:  user.email,
        role:   user.role,
        bidang: user.bidang || null,
      },
    });
  } catch (err) {
    logger.error(`❌ Login error: ${err.message}`);
    return res.status(500).json({ success: false, message: "Gagal login", error: err.message });
  }
};

/* ══════════════════════════════════════
   GET CURRENT USER (dari token)
══════════════════════════════════════ */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "nama", "username", "email", "role", "bidang"],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    logger.error(`❌ getCurrentUser error: ${err.message}`);
    return res.status(500).json({ success: false, message: "Gagal ambil data user" });
  }
};