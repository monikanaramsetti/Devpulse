import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BuildUpdatedPayload } from '../types';

export type SocketStatus = 'connected' | 'disconnected' | 'reconnecting';

interface SocketContextType {
  socket: Socket | null;
  status: SocketStatus;
  lastBuildEvent: BuildUpdatedPayload | null;
  notifications: Array<{ id: string; message: string; type: 'success' | 'failed' | 'running'; timestamp: string }>;
  clearNotification: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [lastBuildEvent, setLastBuildEvent] = useState<BuildUpdatedPayload | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'failed' | 'running'; timestamp: string }>>([]);

  useEffect(() => {
    // Connect to backend Socket.IO server
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket.IO connected:', socketInstance.id);
      setStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setStatus('disconnected');
    });

    socketInstance.io.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    socketInstance.io.on('reconnect', () => {
      setStatus('connected');
    });

    socketInstance.on('build:updated', (payload: BuildUpdatedPayload) => {
      console.log('⚡ Socket event received build:updated:', payload);
      setLastBuildEvent(payload);

      // Trigger professional toast notification
      const build = payload.build;
      const notifId = Math.random().toString(36).substring(2, 9);
      const notifType = build.status === 'SUCCESS' ? 'success' : build.status === 'FAILED' ? 'failed' : 'running';
      const projectName = build.projectName || 'Build';

      setNotifications((prev) => [
        {
          id: notifId,
          message: `${projectName} • Build #${build.buildId.slice(0, 7)} transition to ${build.status}`,
          type: notifType,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4), // Keep max 5 notifications
      ]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        status,
        lastBuildEvent,
        notifications,
        clearNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
