// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Cek apakah request ada token
exports.authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ada' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // payload: { id, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid' });
  }
};

// Cek role user
exports.roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    next();
  };
};
