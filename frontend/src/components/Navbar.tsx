import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiveIndicator } from './LiveIndicator';
import { Activity, LogOut, Shield, FolderGit2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#30363d] bg-[#0d1117]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 font-mono font-bold text-lg text-[#f0f6fc] tracking-tight hover:opacity-90">
            <div className="h-7 w-7 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#2ea043]">
              <Activity className="w-4 h-4 text-[#3fb950]" />
            </div>
            DevPulse
            <span className="text-[10px] font-sans font-normal px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              v1.0
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/dashboard" className="text-[#c9d1d9] hover:text-[#f0f6fc] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#161b22]">
                <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
                Projects & Builds
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <LiveIndicator />

          {isAuthenticated ? (
            <div className="flex items-center gap-3 border-l border-[#30363d] pl-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center font-mono text-xs font-semibold text-[#f0f6fc]">
                  {user?.name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div className="hidden sm:block text-xs">
                  <div className="font-medium text-[#f0f6fc] flex items-center gap-1">
                    {user?.name}
                    {user?.role === 'ADMIN' && (
                      <span className="px-1 py-0.2 text-[9px] font-mono bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/30 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[#8b949e] truncate max-w-[120px]">{user?.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link to="/login" className="px-3 py-1.5 text-[#c9d1d9] hover:text-[#f0f6fc]">
                Sign In
              </Link>
              <Link to="/register" className="px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs transition-colors border border-[#2ea043]/50">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
