import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('demo@devpulse.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-[#3fb950] mb-4">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Sign in to DevPulse</h2>
        <p className="mt-2 text-xs text-[#8b949e]">
          Or{' '}
          <Link to="/register" className="text-[#58a6ff] hover:underline font-medium">
            create a new developer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#161b22] py-8 px-4 shadow-xl border border-[#30363d] sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded bg-[#341a1d] border border-[#f85149]/40 text-[#f85149] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-[#c9d1d9] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b949e]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] font-mono"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c9d1d9] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b949e]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-[#2ea043]/50 rounded-md text-sm font-medium text-white bg-[#238636] hover:bg-[#2ea043] focus:outline-none transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#30363d] text-center">
            <p className="text-xs text-[#8b949e]">
              Demo credentials pre-filled: <code className="text-[#3fb950] font-mono">demo@devpulse.io</code> / <code className="text-[#3fb950] font-mono">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
