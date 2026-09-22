import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { config } from '../config';

const localBus = new EventEmitter();
localBus.setMaxListeners(20);

let publisher: Redis | null = null;
let subscriber: Redis | null = null;
let redisConnected = false;
let fallbackWarningShown = false;

function useFallbackBus() {
  if (!fallbackWarningShown) {
    console.warn('Redis unavailable. Using the internal event bus. Start Redis to enable cross-process events.');
    fallbackWarningShown = true;
  }
}

// Skip Redis entirely during tests to prevent open handle warnings
if (process.env.NODE_ENV !== 'test') {
  try {
    publisher = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) {
          useFallbackBus();
          return null;
        }
        return 1000;
      },
    });

    subscriber = publisher.duplicate();

    publisher.on('connect', () => {
      redisConnected = true;
      console.log('✅ Redis Publisher connected.');
    });

    subscriber.on('connect', () => {
      console.log('✅ Redis Subscriber connected.');
    });

    publisher.on('error', (err) => {
      if (redisConnected) {
        console.error('Redis Publisher error:', err.message);
      }
    });

    subscriber.on('error', (err) => {
      if (redisConnected) {
        console.error('Redis Subscriber error:', err.message);
      }
    });
  } catch (error) {
    useFallbackBus();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (publisher) {
    publisher.disconnect();
    publisher = null;
  }
  if (subscriber) {
    subscriber.disconnect();
    subscriber = null;
  }
  redisConnected = false;
}

export const CHANNELS = {
  BUILD_UPDATED: 'build.updated',
  BUILD_CREATED: 'build.created',
};

export interface BuildEventPayload {
  buildId: string;
  projectId: string;
  projectName?: string;
  status: string;
  commitHash: string;
  branch: string;
  duration?: number;
  createdAt?: string;
}

export async function publishBuildEvent(channel: string, payload: BuildEventPayload) {
  const message = JSON.stringify(payload);
  console.log(`[Redis Pub/Sub] Publishing to '${channel}':`, payload.buildId, payload.status);

  if (redisConnected && publisher) {
    try {
      await publisher.publish(channel, message);
    } catch (err: any) {
      console.warn('Redis publish failed, using fallback local bus:', err.message);
      localBus.emit(channel, message);
    }
  } else {
    localBus.emit(channel, message);
  }
}

export function subscribeToBuildEvents(onMessage: (channel: string, payload: BuildEventPayload) => void) {
  if (redisConnected && subscriber) {
    subscriber.subscribe(CHANNELS.BUILD_UPDATED, CHANNELS.BUILD_CREATED, (err, count) => {
      if (err) {
        console.error('Failed to subscribe to Redis channels:', err);
      } else {
        console.log(`Subscribed to ${count} Redis Pub/Sub channels.`);
      }
    });

    subscriber.on('message', (channel, message) => {
      try {
        const payload: BuildEventPayload = JSON.parse(message);
        onMessage(channel, payload);
      } catch (err) {
        console.error('Error parsing Redis message:', err);
      }
    });
  }

  // Always bind localBus listener as well for fallback execution
  localBus.on(CHANNELS.BUILD_UPDATED, (message: string) => {
    try {
      onMessage(CHANNELS.BUILD_UPDATED, JSON.parse(message));
    } catch (err) {}
  });

  localBus.on(CHANNELS.BUILD_CREATED, (message: string) => {
    try {
      onMessage(CHANNELS.BUILD_CREATED, JSON.parse(message));
    } catch (err) {}
  });
}

export function isRedisConnected(): boolean {
  return redisConnected;
}
