import winston from 'winston';
import LokiTransport from 'winston-loki';

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'slot-game-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add Loki transport if configured
if (process.env.LOKI_URL) {
  logger.add(
    new LokiTransport({
      host: process.env.LOKI_URL,
      labels: {
        app: 'slot-game-backend',
        environment: process.env.NODE_ENV || 'development',
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
    })
  );
  console.log('Loki logging transport added:', process.env.LOKI_URL);
}

// Log uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
);

// Helper functions for structured logging
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: any, meta?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Specific log functions for different operations
export const logSpin = (userId: string, themeId: string, betAmount: number, winAmount: number) => {
  logger.info('Spin executed', {
    userId,
    themeId,
    betAmount,
    winAmount,
    rtp: winAmount / betAmount,
    category: 'spin',
  });
};

export const logTransaction = (
  userId: string,
  type: string,
  amount: number,
  balanceAfter: number
) => {
  logger.info('Transaction executed', {
    userId,
    type,
    amount,
    balanceAfter,
    category: 'transaction',
  });
};

export const logAuthentication = (userId: string, email: string, action: string) => {
  logger.info('Authentication event', {
    userId,
    email,
    action,
    category: 'auth',
  });
};

export const logAdminAction = (
  adminId: string,
  action: string,
  objectType: string,
  objectId: string
) => {
  logger.info('Admin action', {
    adminId,
    action,
    objectType,
    objectId,
    category: 'admin',
  });
};

export const logThemeUpdate = (themeId: string, action: string, adminId: string) => {
  logger.info('Theme update', {
    themeId,
    action,
    adminId,
    category: 'theme',
  });
};

export const logAchievement = (userId: string, achievementId: string, achievementName: string) => {
  logger.info('Achievement unlocked', {
    userId,
    achievementId,
    achievementName,
    category: 'achievement',
  });
};

export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  userId?: string
) => {
  logger.info('API request', {
    method,
    url,
    statusCode,
    responseTime,
    userId,
    category: 'api',
  });
};

export const logSystemMetric = (metricName: string, value: number, unit?: string) => {
  logger.info('System metric', {
    metricName,
    value,
    unit,
    category: 'metric',
  });
};

export default logger;
