import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { subscribeToBuildEvents, BuildEventPayload } from '../redis/pubsub';

let io: SocketIOServer | null = null;

export function initWebSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    socket.emit('connection_status', { connected: true, socketId: socket.id });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected (${socket.id}): ${reason}`);
    });
  });

  // Subscribe to Redis Pub/Sub events and forward them via Socket.IO
  subscribeToBuildEvents((channel: string, payload: BuildEventPayload) => {
    if (io) {
      console.log(`[Socket.IO Broadcast] Emitting 'build:updated' for build ${payload.buildId}`);
      io.emit('build:updated', {
        event: channel,
        build: payload,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
}
