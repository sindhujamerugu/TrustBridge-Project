import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import providerRoutes from './routes/provider.routes.js';
import serviceRoutes from './routes/service.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reviewRoutes from './routes/review.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import communityRoutes from './routes/community.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import rewardRoutes from './routes/reward.routes.js';
import adminRoutes from './routes/admin.routes.js';
import contactRoutes from './routes/contact.routes.js';
import fs from "fs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
try { mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

const app = express();
const httpServer = createServer(app);

// ── Safety net: Tesseract worker errors throw via process.nextTick and cannot
//    be caught by try/catch. Log them and keep the server alive.
process.on('uncaughtException', (err) => {
  const msg = err?.message || String(err);
  // Tesseract image-format errors — non-fatal, verification pipeline handles the result
  if (msg.includes('Error attempting to read image') || msg.includes('pixReadStream')) {
    console.error('[Server] Tesseract worker error (non-fatal):', msg);
    return; // keep process alive
  }
  // All other uncaught exceptions are fatal — log and exit
  console.error('[Server] FATAL uncaught exception:', msg, err?.stack);
  process.exit(1);
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Resource-Policy");
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
// Limit JSON body size and urlencoded payload to prevent DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// Serve uploaded files (dev mode — no Cloudinary needed)
console.log("UPLOADS_DIR =", UPLOADS_DIR);
console.log("Serving uploads from:", UPLOADS_DIR);

app.use('/uploads', express.static(UPLOADS_DIR));

app.get("/check-uploads", (req, res) => {
  try {
    const servicesPath = path.join(UPLOADS_DIR, "services");

    const files = fs.readdirSync(servicesPath);

    res.json({
      uploadsDir: UPLOADS_DIR,
      servicesPath,
      totalFiles: files.length,
      files
    });
  } catch (err) {
    res.json({
      error: err.message
    });
  }
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TrustBridge API is running', timestamp: new Date().toISOString() });
});

// ── Public platform statistics (no auth required) ────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalNewcomers,
      verifiedResidents,
      activeServices,
      totalReviews,
    ] = await Promise.all([
      (await import('./models/User.js')).default.countDocuments({ role: 'newcomer', isActive: true }),
      (await import('./models/User.js')).default.countDocuments({ role: 'resident', isActive: true }),
      (await import('./models/Service.js')).default.countDocuments({ isVisible: true, isActive: true }),
      (await import('./models/Review.js')).default.countDocuments({ status: { $in: ['verified', 'published'] } }),
    ]);
    res.json({
      success: true,
      data: { totalNewcomers, verifiedResidents, activeServices, totalReviews },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Stats unavailable' });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TrustBridge Backend API is running"
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
// Tighter rate limit for community write operations (POST/PATCH/DELETE)
const communityWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // only apply to write methods
});
app.use('/api/community', communityWriteLimiter, communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/contact',       contactRoutes);

app.use(notFound);
app.use(errorHandler);

const typingUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('typing', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing', {
      userId: socket.userId,
      conversationId,
    });
  });

  socket.on('stop_typing', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('stop_typing', {
      userId: socket.userId,
      conversationId,
    });
  });

  socket.on('disconnect', () => {
    typingUsers.delete(socket.userId);
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`TrustBridge server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

export default app;
