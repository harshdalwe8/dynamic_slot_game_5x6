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

/**
 * GET /metrics - Prometheus metrics endpoint
 */
export const getMetrics = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
