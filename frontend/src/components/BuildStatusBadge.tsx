import React from 'react';
import { BuildStatus } from '../types';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface Props {
  status: BuildStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const BuildStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (status) {
    case 'SUCCESS':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border bg-[#162e1e] text-[#3fb950] border-[#2ea043]/30 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
          PASSED
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border bg-[#341a1d] text-[#f85149] border-[#f85149]/30 ${sizeClasses[size]}`}>
          <XCircle className="w-3.5 h-3.5 text-[#f85149]" />
          FAILED
        </span>
      );
    case 'RUNNING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border bg-[#2a2415] text-[#d29922] border-[#d29922]/30 ${sizeClasses[size]}`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d29922]" />
          RUNNING
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border bg-[#21262d] text-[#8b949e] border-[#30363d] ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
          QUEUED
        </span>
      );
  }
};
