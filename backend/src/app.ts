import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma, { connectDatabase } from './config/db';
import authRoutes from './routes/authRoutes';
import slotRoutes from './routes/slotRoutes';
import adminRoutes from './routes/adminRoutes';
import reportRoutes from './routes/reportRoutes';
import exportRoutes from './routes/exportRoutes';
import gamificationRoutes from './routes/gamificationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import demoRoutes from './routes/demoRoutes';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import { getMetrics } from './utils/metrics';
import SocketService from './services/socketService';
import { setSocketService } from './services/socketServiceInstance';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(morgan('dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(globalLimiter); // Rate limiting
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', getMetrics);

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/theme', express.static(path.join(process.cwd(), 'public', 'theme')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', slotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/export', exportRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/gamification', gamificationRoutes);
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/demo', demoRoutes);
}

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO service
const socketService = new SocketService(io);
setSocketService(socketService);

// Export io and socketService for use in other modules
export { io, socketService };

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;