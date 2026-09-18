import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Copy, Check, ArrowDown } from 'lucide-react';

interface Props {
  logs: string;
  title?: string;
}

export const TerminalLogs: React.FC<Props> = ({ logs, title = 'BUILD TERMINAL LOGS' }) => {
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logLines = logs ? logs.split('\n') : ['No logs available for this build execution.'];

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  return (
    <div className="w-full rounded-lg border border-[#30363d] bg-[#090d13] overflow-hidden shadow-2xl font-mono">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2 text-[#8b949e]">
          <Terminal className="w-4 h-4 text-[#3fb950]" />
          <span className="font-semibold tracking-wide text-[#c9d1d9]">{title}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
            {logLines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3 h-3" />
            Bottom
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#3fb950]" />
                <span className="text-[#3fb950]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={logContainerRef}
        className="p-4 max-h-[480px] overflow-y-auto text-xs leading-relaxed font-mono select-text space-y-0.5 bg-[#090d13]"
      >
        {logLines.map((line, idx) => {
          const isErrorLine =
            line.includes('Error') ||
            line.includes('FAIL') ||
            line.includes('✗') ||
            line.includes('failed') ||
            line.includes('Exception');

          const isSuccessLine =
            line.includes('✓') ||
            line.includes('PASS') ||
            line.includes('successfully') ||
            line.includes('Exit Code: 0');

          return (
            <div
              key={idx}
              className={`flex items-start font-mono ${
                isErrorLine
                  ? 'bg-[#f85149]/10 text-[#f85149] font-medium px-1 rounded'
                  : isSuccessLine
                  ? 'text-[#3fb950]'
                  : 'text-[#c9d1d9]'
              }`}
            >
              <span className="w-10 shrink-0 text-[#484f58] select-none text-right pr-3 font-mono">
                {idx + 1}
              </span>
              <span className="whitespace-pre-wrap break-all">{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
