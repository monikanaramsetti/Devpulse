import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Build, Analysis } from '../types';
import { BuildStatusBadge } from '../components/BuildStatusBadge';
import { TerminalLogs } from '../components/TerminalLogs';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Cpu, GitBranch, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export const BuildDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [build, setBuild] = useState<Build | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveDuration, setLiveDuration] = useState(0);

  const { lastBuildEvent } = useSocket();

  const fetchBuildDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/builds/${id}`);
      setBuild(res.data);
      if (res.data.analysis) {
        setAnalysis(res.data.analysis);
      }
      setLiveDuration(res.data.duration || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load build details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBuildDetails();
  }, [id]);

  // Real-time duration ticker if build is RUNNING
  useEffect(() => {
    let interval: any = null;
    if (build?.status === 'RUNNING') {
      interval = setInterval(() => {
        setLiveDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [build?.status]);

  // Listen to Socket.IO events for live status changes
  useEffect(() => {
    if (lastBuildEvent && build && lastBuildEvent.build.buildId === build.id) {
      setBuild((prev) => prev ? { ...prev, status: lastBuildEvent.build.status, duration: lastBuildEvent.build.duration || prev.duration } : null);
    }
  }, [lastBuildEvent]);

  const handleAnalyzeWithAI = async () => {
    if (!id) return;
    try {
      setAnalyzing(true);
      const res = await api.post(`/builds/${id}/analyze`);
      setAnalysis(res.data);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      alert(err.response?.data?.error || 'AI Analysis call failed. Ensure AI service is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-[#8b949e]">
        Loading terminal logs & execution payload...
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-sans">
        <AlertTriangle className="w-8 h-8 text-[#f85149] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#f0f6fc]">{error || 'Build record not found'}</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-1 text-xs text-[#58a6ff]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to={`/projects/${build.projectId}`}
          className="inline-flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#c9d1d9] font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Project: {build.project?.name || 'Project'} / Build #{build.id.slice(0, 7)}
        </Link>
      </div>

      {/* Build Info Header Card */}
      <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#f0f6fc] font-mono">
              Build #{build.id.slice(0, 7)}
            </h1>
            <BuildStatusBadge status={build.status} size="md" />
          </div>

          {/* Prominent "Analyze with AI" Button for Failed Builds */}
          {build.status === 'FAILED' && !analysis && (
            <button
              onClick={handleAnalyzeWithAI}
              disabled={analyzing}
              className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold flex items-center gap-2 border border-[#2ea043]/60 shadow-md transition-all animate-pulse"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Analyzing Terminal Logs...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 text-white" />
                  Analyze with AI
                </>
              )}
            </button>
          )}
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[#8b949e] block mb-0.5">REPOSITORY</span>
            <span className="text-[#c9d1d9] font-semibold">{build.project?.name}</span>
          </div>

          <div>
            <span className="text-[#8b949e] block mb-0.5">COMMIT & BRANCH</span>
            <span className="text-[#58a6ff] flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-[#8b949e]" /> {build.branch} ({build.commitHash.slice(0, 7)})
            </span>
          </div>

          <div>
            <span className="text-[#8b949e] block mb-0.5">DURATION</span>
            <span className="text-[#c9d1d9] flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5 text-[#d29922]" />
              {build.status === 'RUNNING' ? formatDuration(liveDuration) : `${build.duration}s`}
            </span>
          </div>

          <div>
            <span className="text-[#8b949e] block mb-0.5">TIMESTAMP</span>
            <span className="text-[#c9d1d9]">{new Date(build.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Report Section (if analysis available) */}
      {analysis && (
        <div className="space-y-4">
          <AIAnalysisCard analysis={analysis} />
        </div>
      )}

      {/* Terminal Log Viewer Container */}
      <div className="space-y-4">
        <TerminalLogs logs={build.logs} title={`BUILD #${build.id.slice(0, 7)} OUTPUT STREAM`} />
      </div>
    </div>
  );
};
