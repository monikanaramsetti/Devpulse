import React from 'react';
import { Analysis } from '../types';
import { Cpu, AlertCircle, FileCode, CheckSquare, Info, ShieldAlert } from 'lucide-react';

interface Props {
  analysis: Analysis;
}

export const AIAnalysisCard: React.FC<Props> = ({ analysis }) => {
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-[#162e1e] text-[#3fb950] border-[#2ea043]/30';
      case 'medium':
        return 'bg-[#2a2415] text-[#d29922] border-[#d29922]/30';
      default:
        return 'bg-[#21262d] text-[#8b949e] border-[#30363d]';
    }
  };

  return (
    <div className="w-full rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden shadow-lg font-sans">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#1f242c] border-b border-[#30363d]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#21262d] text-[#2ea043] border border-[#30363d]">
            <Cpu className="w-4 h-4 text-[#3fb950]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f0f6fc] tracking-tight">AI BUILD DIAGNOSTIC REPORT</h3>
            <p className="text-xs text-[#8b949e]">Automated log analysis and probable root cause detection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">Confidence:</span>
          <span className={`px-2.5 py-0.5 text-xs font-mono font-medium rounded border ${getConfidenceBadge(analysis.confidence)}`}>
            {analysis.confidence}
          </span>
        </div>
      </div>

      {/* Diagnostic Content */}
      <div className="p-5 space-y-5">
        {/* Section 1: Probable Root Cause */}
        <div className="p-4 rounded-md border border-[#f85149]/30 bg-[#251517]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#f85149] uppercase tracking-wider mb-1.5">
            <AlertCircle className="w-4 h-4" />
            Probable Root Cause
          </div>
          <p className="text-sm font-medium text-[#f0f6fc] font-mono leading-relaxed">
            {analysis.rootCause}
          </p>
        </div>

        {/* Section 2: Affected Area */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            <FileCode className="w-4 h-4 text-[#58a6ff]" />
            Affected Area / Module
          </div>
          <div className="p-3 rounded border border-[#30363d] bg-[#0d1117] font-mono text-xs text-[#58a6ff]">
            {analysis.affectedArea}
          </div>
        </div>

        {/* Section 3: Detailed Technical Explanation */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            <Info className="w-4 h-4 text-[#d29922]" />
            Technical Explanation
          </div>
          <p className="text-sm text-[#c9d1d9] leading-relaxed bg-[#0d1117]/50 p-3.5 rounded border border-[#30363d]">
            {analysis.explanation}
          </p>
        </div>

        {/* Section 4: Suggested Fix */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            <CheckSquare className="w-4 h-4 text-[#3fb950]" />
            Suggested Fix
          </div>
          <div className="p-3.5 rounded border border-[#2ea043]/30 bg-[#0f1f14] text-xs font-mono text-[#3fb950] leading-relaxed whitespace-pre-wrap">
            {analysis.suggestedFix}
          </div>
        </div>

        {/* Section 5: Diagnostic Limitations */}
        <div className="flex items-start gap-2 pt-2 border-t border-[#30363d] text-xs text-[#8b949e]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#8b949e] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#c9d1d9]">Limitations:</strong> {analysis.limitations}
          </span>
        </div>
      </div>
    </div>
  );
};
