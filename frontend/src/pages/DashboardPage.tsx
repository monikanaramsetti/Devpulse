import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Project, Build } from '../types';
import { useSocket } from '../context/SocketContext';
import { BuildStatusBadge } from '../components/BuildStatusBadge';
import {
  FolderGit2,
  Plus,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  Play,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  projectName: string;
  buildId: string;
  status: string;
  commitHash: string;
  branch: string;
  timestamp: string;
}

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentBuilds, setRecentBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const { lastBuildEvent } = useSocket();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projRes, buildRes] = await Promise.all([
        api.get('/projects'),
        api.get('/builds/recent?limit=10'),
      ]);
      setProjects(projRes.data);
      setRecentBuilds(buildRes.data);

      // Populate initial activity feed
      const initActivities: ActivityItem[] = buildRes.data.slice(0, 6).map((b: Build) => ({
        id: b.id,
        projectName: b.project?.name || 'Project',
        buildId: b.id.slice(0, 7),
        status: b.status,
        commitHash: b.commitHash,
        branch: b.branch,
        timestamp: new Date(b.createdAt).toLocaleTimeString(),
      }));
      setActivities(initActivities);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update real-time build events when received over Socket.IO
  useEffect(() => {
    if (lastBuildEvent) {
      const b = lastBuildEvent.build;
      setRecentBuilds((prev) => {
        const index = prev.findIndex((item) => item.id === b.buildId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: b.status,
            duration: b.duration || updated[index].duration,
          };
          return updated;
        } else {
          // Add new build to top of recent builds
          return [
            {
              id: b.buildId,
              projectId: b.projectId,
              commitHash: b.commitHash,
              branch: b.branch,
              status: b.status,
              logs: '',
              duration: b.duration || 0,
              createdAt: b.createdAt || new Date().toISOString(),
              project: projects.find((p) => p.id === b.projectId) || { id: b.projectId, name: b.projectName || 'Project', repositoryUrl: '', userId: '', createdAt: '' },
            },
            ...prev.slice(0, 9),
          ];
        }
      });

      // Append to live activity feed
      const newActivity: ActivityItem = {
        id: Math.random().toString(),
        projectName: b.projectName || 'Project',
        buildId: b.buildId.slice(0, 7),
        status: b.status,
        commitHash: b.commitHash,
        branch: b.branch,
        timestamp: new Date().toLocaleTimeString(),
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 7)]);
    }
  }, [lastBuildEvent]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newRepoUrl) return;

    try {
      setCreating(true);
      await api.post('/projects', {
        name: newProjectName,
        repositoryUrl: newRepoUrl,
      });
      setNewProjectName('');
      setNewRepoUrl('');
      setShowCreateModal(false);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSimulateBuild = async (projectId: string) => {
    try {
      await api.post('/dev/build-events', {
        projectId,
        status: 'FAILED',
        errorType: 'env_missing',
      });
    } catch (err) {
      console.error('Failed to simulate build:', err);
    }
  };

  const totalBuilds = recentBuilds.length;
  const passedBuilds = recentBuilds.filter((b) => b.status === 'SUCCESS').length;
  const failedBuilds = recentBuilds.filter((b) => b.status === 'FAILED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Engineering Dashboard</h1>
          <p className="text-xs text-[#8b949e] mt-1 font-mono">
            CI/CD Monitoring • Real-Time Socket Stream • Build Failure Analyzer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#2ea043]/50"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="text-xs font-mono text-[#8b949e] uppercase tracking-wider mb-1">Total Projects</div>
          <div className="text-2xl font-bold text-[#f0f6fc] font-mono">{projects.length}</div>
        </div>

        <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d]">
          <div className="text-xs font-mono text-[#8b949e] uppercase tracking-wider mb-1">Recent Builds</div>
          <div className="text-2xl font-bold text-[#f0f6fc] font-mono">{totalBuilds}</div>
        </div>

        <div className="p-4 rounded-lg bg-[#161b22] border border-[#2ea043]/30 bg-[#162e1e]/20">
          <div className="text-xs font-mono text-[#3fb950] uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
          </div>
          <div className="text-2xl font-bold text-[#3fb950] font-mono">{passedBuilds}</div>
        </div>

        <div className="p-4 rounded-lg bg-[#161b22] border border-[#f85149]/30 bg-[#341a1d]/20">
          <div className="text-xs font-mono text-[#f85149] uppercase tracking-wider mb-1 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </div>
          <div className="text-2xl font-bold text-[#f85149] font-mono">{failedBuilds}</div>
        </div>
      </div>

      {/* Main Grid: Projects & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#3fb950]" /> Connected Repositories ({projects.length})
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-[#30363d] bg-[#161b22] text-[#8b949e]">
              <p className="text-sm">No connected projects found.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-3 py-1.5 rounded bg-[#238636] text-white text-xs font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => {
                const lastBuild = project.builds?.[0];
                return (
                  <div
                    key={project.id}
                    className="p-5 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#8b949e] transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-mono font-bold text-[#f0f6fc] hover:text-[#58a6ff] text-base truncate"
                        >
                          {project.name}
                        </Link>
                        {lastBuild && <BuildStatusBadge status={lastBuild.status as any} size="sm" />}
                      </div>

                      <p className="text-xs text-[#8b949e] font-mono truncate mt-1">
                        {project.repositoryUrl}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
                      <span>{project.builds?.length || 0} builds</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSimulateBuild(project.id)}
                          className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] font-mono flex items-center gap-1 border border-[#30363d]"
                          title="Simulate Build"
                        >
                          <Play className="w-3 h-3 text-[#3fb950]" /> Trigger
                        </button>
                        <Link
                          to={`/projects/${project.id}`}
                          className="p-1 rounded hover:bg-[#21262d] text-[#58a6ff]"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Builds Table */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#58a6ff]" /> Build Execution History
            </h2>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#30363d] bg-[#1f242c] text-[#8b949e]">
                    <th className="p-3">STATUS</th>
                    <th className="p-3">PROJECT</th>
                    <th className="p-3">COMMIT</th>
                    <th className="p-3">BRANCH</th>
                    <th className="p-3">DURATION</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                  {recentBuilds.map((build) => (
                    <tr key={build.id} className="hover:bg-[#1c2128]">
                      <td className="p-3">
                        <BuildStatusBadge status={build.status} size="sm" />
                      </td>
                      <td className="p-3 font-semibold text-[#f0f6fc]">
                        {build.project?.name || 'Project'}
                      </td>
                      <td className="p-3 text-[#58a6ff]">{build.commitHash.slice(0, 7)}</td>
                      <td className="p-3 text-[#8b949e]">{build.branch}</td>
                      <td className="p-3 text-[#8b949e]">{build.duration ? `${build.duration}s` : '--'}</td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/builds/${build.id}`}
                          className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] text-[11px]"
                        >
                          View Logs
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
              Real-Time Activity
            </h2>
            <span className="text-[11px] font-mono text-[#8b949e]">Socket.IO Stream</span>
          </div>

          <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 space-y-4 font-mono text-xs">
            {activities.length === 0 ? (
              <p className="text-[#8b949e] text-center py-4">Waiting for real-time events...</p>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded border border-[#30363d] bg-[#0d1117] space-y-1.5 transition-all animate-in fade-in"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#f0f6fc]">{act.projectName}</span>
                    <span className="text-[#8b949e]">{act.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#8b949e] text-[11px] flex items-center gap-1">
                      <GitBranch className="w-3 h-3" /> {act.branch} • {act.commitHash.slice(0, 7)}
                    </span>
                    <BuildStatusBadge status={act.status as any} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-md w-full p-6 space-y-5 font-sans shadow-2xl">
            <h3 className="text-lg font-bold text-[#f0f6fc]">Connect New Repository</h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#c9d1d9] uppercase tracking-wider mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. backend-api"
                  className="w-full px-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#f0f6fc] font-mono focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#c9d1d9] uppercase tracking-wider mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  required
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#f0f6fc] font-mono focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded text-xs font-medium text-[#c9d1d9] hover:bg-[#21262d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold"
                >
                  {creating ? 'Creating...' : 'Connect Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
