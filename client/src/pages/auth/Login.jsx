import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Package, Shield, User, Building, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: 'STUDENT',
      label: 'Student',
      detail: 'Room 101 (Hostel H-1)',
      email: 'student@hostel.edu',
      password: 'password123',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
      icon: User,
    },
    {
      role: 'GUARD',
      label: 'Security Guard',
      detail: 'Gate 1 Intake Desk',
      email: 'guard@hostel.edu',
      password: 'password123',
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
      icon: Shield,
    },
    {
      role: 'WARDEN',
      label: 'Hostel Warden',
      detail: 'Hostel H-1 Supervisor',
      email: 'warden@hostel.edu',
      password: 'password123',
      color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
      icon: Building,
    },
    {
      role: 'ADMIN',
      label: 'Campus Admin',
      detail: 'Full System Oversight',
      email: 'admin@hostel.edu',
      password: 'password123',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
      icon: Lock,
    },
  ];

  const handleQuickFill = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email, password);
      // Navigate to role dashboard
      switch (loggedUser.role) {
        case 'STUDENT':
          navigate('/student');
          break;
        case 'GUARD':
          navigate('/guard');
          break;
        case 'WARDEN':
          navigate('/warden');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            Sign in to ParcelTrack
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Hostel Parcel Reception & Secure OTP Handover System
          </p>
        </div>

        {/* Demo Accounts Quick-Fill Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Quick Demo Accounts (1-Click Fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleQuickFill(account)}
                  className={`flex flex-col items-start p-2.5 text-left rounded-lg border text-xs transition-all ${account.color}`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{account.label}</span>
                  </div>
                  <span className="text-[11px] opacity-80 mt-0.5">{account.detail}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-3.5 rounded-md flex items-center gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hostel.edu"
                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          New student or staff?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 underline">
            Register your account
          </Link>
        </div>
      </div>
    </div>
  );
}
