import { Request, Response } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Metrics
export const spinCounter = new Counter({
  name: 'slot_spins_total',
  help: 'Total number of spins',
  labelNames: ['theme_id', 'result'],
});

export const spinLatency = new Histogram({
  name: 'slot_spin_duration_seconds',
  help: 'Spin request duration in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const walletBalance = new Gauge({
  name: 'slot_wallet_balance_coins',
  help: 'Current wallet balance in coins',
  labelNames: ['user_id'],
});

export const activeUsers = new Gauge({
  name: 'slot_active_users',
  help: 'Number of currently active users',
});

export const errorCounter = new Counter({
  name: 'slot_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint'],
});

// Socket.IO Metrics
export const socketConnections = new Gauge({
  name: 'socket_connections_current',
  help: 'Current number of active WebSocket connections',
});

export const socketConnectionsTotal = new Counter({
  name: 'socket_connections_total',
  help: 'Total number of WebSocket connections established',
});

export const socketDisconnectionsTotal = new Counter({
  name: 'socket_disconnections_total',
  help: 'Total number of WebSocket disconnections',
});

export const socketAuthFailures = new Counter({
  name: 'socket_auth_failures_total',
  help: 'Total number of WebSocket authentication failures',
});

export const socketEventsEmitted = new Counter({
  name: 'socket_events_emitted_total',
  help: 'Total number of events emitted to clients',
  labelNames: ['event_type'],
});

export const socketEventDuration = new Histogram({
  name: 'socket_event_duration_seconds',
  help: 'Duration of socket event processing in seconds',
  labelNames: ['event_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

/**
 * GET /metrics - Prometheus metrics endpoint
 */
export const getMetrics = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
