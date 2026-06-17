// controllers/userController.js
const { User } = require('../models');
const bcrypt   = require('bcryptjs');
const { success, error } = require('../utils/response');
const logger   = require('../utils/logger');

// ── GET semua user ────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "nama", "username", "email", "role", "bidang"],
      order: [
        [require('sequelize').literal(`CASE
          WHEN role = 'admin'    THEN 0
          WHEN role = 'security' THEN 1
          WHEN role = 'user'     THEN 2
          ELSE 3
        END`), 'ASC'],
        ['nama', 'ASC'],
      ],
    });
    logger.info(`👥 Ambil semua user (${users.length} data)`);
    return success(res, "Data user berhasil diambil", users);
  } catch (err) {
    logger.error(`❌ Gagal ambil user: ${err.message}`);
    return error(res, "Gagal mengambil user", err.message, 500);
  }
};

// ── GET user by ID ────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "nama", "username", "email", "role", "bidang"],
    });
    if (!user) return error(res, "User tidak ditemukan", null, 404);
    return success(res, "Detail user", user);
  } catch (err) {
    return error(res, "Gagal mengambil user", err.message, 500);
  }
};

// ── DELETE user ───────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, "User tidak ditemukan", null, 404);
    if (user.role === 'admin') {
      return error(res, "Akun admin internal tidak bisa dihapus melalui sistem", null, 403);
    }
    await user.destroy();
    logger.info(`🗑️ User ID ${req.params.id} (${user.email}) dihapus`);
    return success(res, "User berhasil dihapus");
  } catch (err) {
    return error(res, "Gagal hapus user", err.message, 500);
  }
};

exports.createUserByAdmin = async (req, res) => {
  try {
    const { nama, username, email, password, role, bidang } = req.body;

    // Validasi field wajib
    if (!nama || !username || !email || !password || !role) {
      return error(res, "Nama, username, ID Pegawai, password, dan role wajib diisi", null, 400);
    }

    // Hanya boleh membuat role user atau security lewat endpoint ini
    if (!["user", "security"].includes(role)) {
      return error(res, "Role harus 'user' atau 'security'", null, 400);
    }

    // Validasi format ID Pegawai (tanpa @, huruf/angka/titik/underscore/strip)
    if (!/^[a-zA-Z0-9._-]+$/.test(email)) {
      return error(res, "Format ID Pegawai tidak valid (hanya huruf, angka, titik, underscore, strip)", null, 400);
    }

    // User wajib isi bidang, security tidak perlu
    if (role === "user" && !bidang) {
      return error(res, "Bidang / Divisi wajib diisi untuk akun User", null, 400);
    }

    // Validasi password kuat
    if (password.length < 8) return error(res, "Password minimal 8 karakter", null, 400);
    if (!/[A-Z]/.test(password)) return error(res, "Password harus mengandung huruf kapital", null, 400);
    if (!/[0-9]/.test(password)) return error(res, "Password harus mengandung angka", null, 400);

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return error(res, "ID Pegawai sudah terdaftar", null, 400);

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return error(res, "Username sudah digunakan", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      nama,
      username,
      email,
      password: hashedPassword,
      role,
      bidang: role === "user" ? bidang : null,
    });

    logger.info(`👤 Akun ${role} baru dibuat oleh admin: ${email}`);
    return success(res, `Akun ${role === "user" ? "User" : "Admin Security"} berhasil dibuat`, {
      id: user.id,
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
      bidang: user.bidang,
    }, 201);
  } catch (err) {
    logger.error(`❌ Gagal buat akun: ${err.message}`);
    return error(res, "Gagal membuat akun", err.message, 500);
  }
};