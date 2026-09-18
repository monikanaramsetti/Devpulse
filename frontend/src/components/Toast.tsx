import React from 'react';
import { useSocket } from '../context/SocketContext';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, clearNotification } = useSocket();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-md shadow-lg border text-sm font-sans backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
            n.type === 'failed'
              ? 'bg-[#1c1213]/95 border-[#f85149]/40 text-[#f85149]'
              : n.type === 'success'
              ? 'bg-[#0f1f14]/95 border-[#2ea043]/40 text-[#3fb950]'
              : 'bg-[#181611]/95 border-[#d29922]/40 text-[#d29922]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {n.type === 'failed' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#f85149]" />
            ) : n.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-[#3fb950]" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-[#d29922]" />
            )}
            <span className="font-mono text-xs text-[#c9d1d9]">{n.message}</span>
          </div>
          <button
            onClick={() => clearNotification(n.id)}
            className="text-[#8b949e] hover:text-[#c9d1d9] p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
