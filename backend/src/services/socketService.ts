import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
  socketConnections,
  socketConnectionsTotal,
  socketDisconnectionsTotal,
  socketAuthFailures,
  socketEventsEmitted,
  socketEventDuration,
} from '../utils/metrics';

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

/**
 * Socket.IO event handlers and authentication
 */
export class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO middleware for authentication
   */
  private setupMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        socketAuthFailures.inc();
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(
          token.replace('Bearer ', ''),
          process.env.JWT_SECRET || 'your-secret-key'
        ) as SocketUser;

        socket.user = decoded;
        next();
      } catch (error) {
        socketAuthFailures.inc();
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Client connected: ${socket.id} (User: ${socket.user?.email})`);

      // Track connection metrics
      socketConnectionsTotal.inc();
      socketConnections.inc();

      // Automatically join user's personal room
      if (socket.user) {
        socket.join(`user_${socket.user.id}`);
        console.log(`User ${socket.user.email} joined room: user_${socket.user.id}`);
      }

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id} (User: ${socket.user?.email})`);
        
        // Track disconnection metrics
        socketDisconnectionsTotal.inc();
        socketConnections.dec();
      });

      // Handle manual room join (for additional rooms)
      socket.on('join_room', (roomName: string) => {
        socket.join(roomName);
        console.log(`User ${socket.user?.email} joined room: ${roomName}`);
        socket.emit('room_joined', { room: roomName });
      });

      // Handle leave room
      socket.on('leave_room', (roomName: string) => {
        socket.leave(roomName);
        console.log(`User ${socket.user?.email} left room: ${roomName}`);
        socket.emit('room_left', { room: roomName });
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  /**
   * Emit balance update to a specific user
   */
  emitBalanceUpdate(userId: string, balance: number, transaction?: any) {
    const timer = socketEventDuration.startTimer({ event_type: 'balance_update' });
    
    this.io.to(`user_${userId}`).emit('balance_update', {
      balance,
      transaction,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'balance_update' });
    timer();
  }

  /**
   * Emit spin result to a specific user
   */
  emitSpinResult(userId: string, spinResult: any) {
    const timer = socketEventDuration.startTimer({ event_type: 'spin_result' });
    
    this.io.to(`user_${userId}`).emit('spin_result', {
      ...spinResult,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'spin_result' });
    timer();
  }

  /**
   * Emit achievement unlocked notification
   */
  emitAchievementUnlocked(userId: string, achievement: any) {
    const timer = socketEventDuration.startTimer({ event_type: 'achievement_unlocked' });
    
    this.io.to(`user_${userId}`).emit('achievement_unlocked', {
      achievement,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'achievement_unlocked' });
    timer();
  }

  /**
   * Emit leaderboard update to all connected clients
   */
  emitLeaderboardUpdate(leaderboardType: string, period: string) {
    const timer = socketEventDuration.startTimer({ event_type: 'leaderboard_update' });
    
    this.io.emit('leaderboard_update', {
      type: leaderboardType,
      period,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'leaderboard_update' });
    timer();
  }

  /**
   * Emit theme update notification to all clients
   */
  emitThemeUpdate(themeId: string, action: string) {
    const timer = socketEventDuration.startTimer({ event_type: 'theme_update' });
    
    this.io.emit('theme_update', {
      themeId,
      action,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'theme_update' });
    timer();
  }

  /**
   * Emit admin notification to admin users
   */
  emitAdminNotification(message: string, level: 'info' | 'warning' | 'error') {
    const timer = socketEventDuration.startTimer({ event_type: 'admin_notification' });
    
    this.io.emit('admin_notification', {
      message,
      level,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'admin_notification' });
    timer();
  }

  /**
   * Emit jackpot won notification to all users
   */
  emitJackpotWon(userId: string, amount: number, themeName: string) {
    const timer = socketEventDuration.startTimer({ event_type: 'jackpot_won' });
    
    this.io.emit('jackpot_won', {
      userId,
      amount,
      themeName,
      timestamp: Date.now(),
    });
    
    socketEventsEmitted.inc({ event_type: 'jackpot_won' });
    timer();
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Get user connection status
   */
  isUserConnected(userId: string): boolean {
    const room = this.io.sockets.adapter.rooms.get(`user_${userId}`);
    return room ? room.size > 0 : false;
  }
}

export default SocketService;
