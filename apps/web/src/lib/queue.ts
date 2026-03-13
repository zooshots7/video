import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Reuse a single Redis connection across the app
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
});

// The queue where we drop render jobs
export const renderQueue = new Queue('video-render-queue', {
    connection: redisConnection as any,
});
