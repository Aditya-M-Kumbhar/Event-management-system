/**
 * EventSphere — Server Entry Point
 * Starts HTTP server, connects to MongoDB, initializes Socket.io
 */

require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// ─── Create HTTP Server ───────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io (Live Check-in Updates) ───────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Join organiser to event-specific room for live check-in updates
  socket.on('join:checkin', (eventId) => {
    socket.join(`checkin:${eventId}`);
    logger.info(`Socket ${socket.id} joined checkin room for event: ${eventId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════╗
║        EventSphere API Server Running        ║
║  Port    : ${PORT}                               ║
║  Mode    : ${process.env.NODE_ENV || 'development'}                      ║
║  Docs    : http://localhost:${PORT}/health        ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  server.close(() => process.exit(1));
});

startServer();
