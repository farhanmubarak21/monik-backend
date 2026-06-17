// server.js
const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const logger     = require('./utils/logger');
const { sequelize } = require('./models');
const http       = require("http");

// Import routes
const userRoutes       = require('./routes/userRoutes');
const mobilRoutes      = require('./routes/mobilRoutes');
const pengajuanRoutes  = require('./routes/pengajuanRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');
const riwayatRoutes    = require('./routes/riwayatRoutes');
const gpsRoutes        = require('./routes/gpsRoutes');
const zonaRoutes       = require('./routes/zonaRoutes');
const authRoutes       = require('./routes/authRoutes');
const adminRoutes      = require("./routes/adminRoutes");
const laporanRoutes    = require('./routes/laporanRoutes');

const swaggerUi       = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

dotenv.config();
const app    = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set("io", io);

// ── Socket.IO ───────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_room", ({ userId, role }) => {
    // Semua user join room pribadi
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room: user_${userId}`);

    // Admin internal dan security join admin_room
    if (role === "admin" || role === "security") {
      socket.join("admin_room");
      console.log(`Socket ${socket.id} joined admin_room (role: ${role})`);
    }
  });

  socket.on("updateLocation", (data) => {
    io.to("admin_room").emit("locationUpdated", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ── Middleware ──────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, 
  message: { success: false, message: "Terlalu banyak request, coba lagi nanti." }
});
app.use(limiter);

// Serve folder uploads (foto pengembalian)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Routes ──────────────────────────────────────
app.use('/api/users',       userRoutes);
app.use('/api/mobil',       mobilRoutes);
app.use('/api/pengajuan',   pengajuanRoutes);
app.use('/api/notifikasi',  notifikasiRoutes);
app.use('/api/riwayat',     riwayatRoutes);
app.use('/api/gps',         gpsRoutes);
app.use('/api/zona',        zonaRoutes);
app.use('/api/auth',        authRoutes);
app.use("/api/admin",       adminRoutes);
app.use('/api/laporan',     laporanRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: '🚀 API Monitoring Mobil PLN UP3 Pekanbaru berjalan!' });
});

app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ── Database ─────────────────────────────────────
sequelize.authenticate()
  .then(() => console.log('✅ Koneksi ke PostgreSQL berhasil!'))
  .catch(err => console.error('❌ Database error:', err.message));


sequelize.sync({ alter: false })
  .then(() => console.log('📦 Model berhasil disinkronkan dengan database'))
  .catch(err => console.error('⚠️ Sync error:', err.message));

// ── Start ────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log("🔌 Socket.IO aktif dengan sistem room per user");
});