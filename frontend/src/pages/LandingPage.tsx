import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Terminal, Zap, Shield, Cpu, ArrowRight, CheckCircle2, GitBranch, Server } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#238636] selection:text-white">
      {/* Hero Header */}
      <section className="relative pt-20 pb-16 border-b border-[#30363d]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[#161b22] text-[#3fb950] border border-[#2ea043]/30 mb-6">
            <Activity className="w-3.5 h-3.5" />
            <span>Developer Tool & Real-Time CI Monitor</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-[#f0f6fc] tracking-tight max-w-3xl mx-auto leading-tight">
            Understand failed builds <span className="text-[#3fb950]">faster</span>.
          </h1>

          <p className="mt-6 text-lg text-[#8b949e] max-w-2xl mx-auto font-sans leading-relaxed">
            Stop manually digging through thousands of lines of raw CI terminal logs. DevPulse receives build events, streams real-time status updates via WebSockets, and delivers structured AI failure diagnostics with root cause analysis and suggested fixes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-sm transition-colors border border-[#2ea043]/50 flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] font-semibold text-sm transition-colors border border-[#30363d] flex items-center justify-center gap-2"
            >
              View Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Terminal Preview */}
      <section className="py-12 bg-[#090d13] border-b border-[#30363d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1f242c] border-b border-[#30363d] text-xs font-mono">
              <div className="flex items-center gap-2 text-[#8b949e]">
                <Terminal className="w-4 h-4 text-[#f85149]" />
                <span className="text-[#f0f6fc] font-semibold">production-api • Build #128 FAILED</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#341a1d] text-[#f85149] border border-[#f85149]/30">
                FAILED
              </span>
            </div>

            <div className="p-4 font-mono text-xs text-[#c9d1d9] space-y-1 bg-[#090d13]">
              <div className="text-[#8b949e]">[12:41:02] Checking out commit 8f42a1c on branch main</div>
              <div className="text-[#8b949e]">[12:41:04] Installing dependencies...</div>
              <div className="text-[#8b949e]">[12:41:18] Running test suite...</div>
              <div className="text-[#f85149] font-semibold bg-[#f85149]/10 p-1 rounded">
                [12:41:23] Error: Environment variable DATABASE_URL is not defined!
              </div>
              <div className="text-[#8b949e]">[12:41:23] Process exited with error code 1. Build failed.</div>
            </div>

            {/* AI Diagnosis Snippet */}
            <div className="p-4 bg-[#162118] border-t border-[#2ea043]/30">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-[#3fb950] font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> AI Build Analysis Result
                </span>
                <span className="text-[#8b949e]">Confidence: <strong className="text-[#3fb950]">High</strong></span>
              </div>
              <p className="text-xs text-[#c9d1d9] font-mono">
                <strong className="text-[#f0f6fc]">Probable Cause:</strong> Missing environment variable <code className="text-[#3fb950] bg-[#0d1117] px-1 py-0.5 rounded">DATABASE_URL</code> in CI environment configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[#f0f6fc] text-center mb-12 font-mono">
          ENGINEERING ARCHITECTURE
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-[#161b22] border border-[#30363d]">
            <div className="w-10 h-10 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#3fb950] mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#f0f6fc] mb-2">Real-Time WebSockets</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Build status events are published to Redis Pub/Sub and broadcasted to connected dashboards via Socket.IO without requiring page refreshes.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[#161b22] border border-[#30363d]">
            <div className="w-10 h-10 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff] mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#f0f6fc] mb-2">FastAPI Log Diagnostics</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Python agent inspects terminal stack traces, missing environment variables, syntax errors, and test assertions to generate structured diagnostic reports.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[#161b22] border border-[#30363d]">
            <div className="w-10 h-10 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#d29922] mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#f0f6fc] mb-2">Clean Relational Model</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              PostgreSQL schema using Prisma ORM managing Users, Projects, Builds, and AI Diagnostic Analyses cleanly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#30363d] text-center text-xs text-[#8b949e] font-mono">
        DevPulse — Built for Interview Demonstration & Real-Time CI Observability
      </footer>
    </div>
  );
};
