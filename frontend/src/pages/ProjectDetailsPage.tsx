import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Project, Build } from '../types';
import { BuildStatusBadge } from '../components/BuildStatusBadge';
import { useSocket } from '../context/SocketContext';
import { FolderGit2, Play, GitBranch, ArrowLeft, Terminal, AlertTriangle } from 'lucide-react';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const { lastBuildEvent } = useSocket();

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    if (lastBuildEvent && project && lastBuildEvent.build.projectId === project.id) {
      fetchProjectDetails();
    }
  }, [lastBuildEvent]);

  const handleSimulateBuild = async (status: 'SUCCESS' | 'FAILED') => {
    if (!id) return;
    try {
      setTriggering(true);
      await api.post('/dev/build-events', {
        projectId: id,
        status,
        errorType: status === 'FAILED' ? 'env_missing' : undefined,
        branch: 'main',
      });
    } catch (err) {
      console.error('Failed to trigger simulated build:', err);
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-[#8b949e]">
        Loading project metrics...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-sans">
        <AlertTriangle className="w-8 h-8 text-[#f85149] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#f0f6fc]">{error || 'Project not found'}</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-1 text-xs text-[#58a6ff]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Navigation */}
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#c9d1d9] font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard / Projects
        </Link>
      </div>

      {/* Project Header */}
      <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#3fb950]" />
            <h1 className="text-xl font-bold text-[#f0f6fc] font-mono">{project.name}</h1>
          </div>
          <p className="text-xs text-[#8b949e] font-mono mt-1">{project.repositoryUrl}</p>
        </div>

        {/* Trigger Simulated Builds */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulateBuild('SUCCESS')}
            disabled={triggering}
            className="px-3 py-1.5 rounded bg-[#162e1e] hover:bg-[#2ea043]/30 text-[#3fb950] border border-[#2ea043]/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" /> Trigger Success Build
          </button>

          <button
            onClick={() => handleSimulateBuild('FAILED')}
            disabled={triggering}
            className="px-3 py-1.5 rounded bg-[#341a1d] hover:bg-[#f85149]/30 text-[#f85149] border border-[#f85149]/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" /> Trigger Failed Build
          </button>
        </div>
      </div>

      {/* Build History Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#3fb950]" /> Build Execution History ({project.builds?.length || 0})
        </h2>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#1f242c] text-[#8b949e]">
                <th className="p-3">STATUS</th>
                <th className="p-3">COMMIT</th>
                <th className="p-3">BRANCH</th>
                <th className="p-3">DURATION</th>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3 text-right">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
              {!project.builds || project.builds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8b949e]">
                    No builds executed yet for this project.
                  </td>
                </tr>
              ) : (
                project.builds.map((build) => (
                  <tr key={build.id} className="hover:bg-[#1c2128]">
                    <td className="p-3">
                      <BuildStatusBadge status={build.status} size="sm" />
                    </td>
                    <td className="p-3 text-[#58a6ff]">{build.commitHash.slice(0, 7)}</td>
                    <td className="p-3 text-[#8b949e] flex items-center gap-1">
                      <GitBranch className="w-3 h-3" /> {build.branch}
                    </td>
                    <td className="p-3 text-[#8b949e]">{build.duration ? `${build.duration}s` : '--'}</td>
                    <td className="p-3 text-[#8b949e]">{new Date(build.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/builds/${build.id}`}
                        className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] text-[11px]"
                      >
                        Logs & Diagnostics
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
