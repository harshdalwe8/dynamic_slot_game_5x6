import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma, { connectDatabase } from './config/db';
import authRoutes from './routes/authRoutes';
import slotRoutes from './routes/slotRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import { getMetrics } from './utils/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(globalLimiter); // Rate limiting

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', getMetrics);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', slotRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Room-based updates for authenticated users
  socket.on('join', (userId: string) => {
    socket.join(`user_${userId}`);
  });
});

// Export io for use in other modules
export { io };

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

startServer();