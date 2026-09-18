import React from 'react';
import { useSocket } from '../context/SocketContext';

export const LiveIndicator: React.FC = () => {
  const { status } = useSocket();

  if (status === 'connected') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#162e1e] text-[#3fb950] border border-[#2ea043]/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3fb950]"></span>
        </span>
        ● LIVE
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#2a2415] text-[#d29922] border border-[#d29922]/30">
        <span className="animate-spin">↻</span> RECONNECTING
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
      <span>○</span> DISCONNECTED
    </div>
  );
};
