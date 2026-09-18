import http from 'http';
import app from './app';
import { config } from './config';
import { initWebSocketServer } from './websocket/socket';

const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
initWebSocketServer(server);

server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 DevPulse Backend listening on port ${config.port}`);
  console.log(`📡 REST API endpoint: http://localhost:${config.port}/api`);
  console.log(`🔌 WebSocket server active on ws://localhost:${config.port}`);
  console.log(`====================================================`);
});
