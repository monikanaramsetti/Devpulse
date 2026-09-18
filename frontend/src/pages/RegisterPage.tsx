import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
        <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Create your account</h2>
        <p className="mt-2 text-xs text-[#8b949e]">
          Already registered?{' '}
          <Link to="/login" className="text-[#58a6ff] hover:underline font-medium">
            Sign in to existing account
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
                Full Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b949e]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  placeholder="Jane Developer"
                />
              </div>
            </div>

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
                  placeholder="jane@devpulse.io"
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
              {loading ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
