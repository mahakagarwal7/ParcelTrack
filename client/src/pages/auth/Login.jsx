import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Shield, Building2, Settings2, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

const ROUTES = { STUDENT: '/student', GUARD: '/guard', WARDEN: '/warden', ADMIN: '/admin' };

const DEMOS = [
  { role: 'STUDENT', label: 'Student', email: 'student@hostel.edu', icon: GraduationCap, note: 'Room 101' },
  { role: 'GUARD', label: 'Security Guard', email: 'guard@hostel.edu', icon: Shield, note: 'Gate 1 Desk' },
  { role: 'WARDEN', label: 'Hostel Warden', email: 'warden@hostel.edu', icon: Building2, note: 'Hostel H-1' },
  { role: 'ADMIN', label: 'Campus Admin', email: 'admin@hostel.edu', icon: Settings2, note: 'Full System' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      navigate(ROUTES[loggedUser.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your campus account to manage and collect parcels."
    >
      {/* 1. SEGMENTED TAB SWITCHER: SIGN IN vs SIGN UP */}
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80">
        <Link
          to="/login"
          className="flex-1 py-2.5 text-center text-xs font-black rounded-xl transition bg-white text-indigo-600 shadow-sm flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sign In</span>
        </Link>
        <Link
          to="/register"
          className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-400" />
          <span>Sign Up / Register</span>
        </Link>
      </div>

      {/* 2. LOGIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="login-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="name@hostel.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* PRIMARY SUBMIT BUTTON */}
        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          <span>Sign In to Dashboard</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      {/* 3. 1-CLICK DEMO ACCOUNTS FILL */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Quick Demo Accounts (1-Click Fill)</span>
          <span className="text-[10px] text-indigo-600 font-bold lowercase">auto-fills credentials</span>
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {DEMOS.map((d) => (
            <button
              key={d.role}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword('password123');
                setError('');
              }}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition group cursor-pointer shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <d.icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-800 block leading-tight truncate">
                  {d.label}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono leading-tight truncate">
                  {d.note}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. FOOTER SIGN UP PROMPT */}
      <div className="mt-6 text-center text-xs text-slate-600">
        <span>Don't have an account yet? </span>
        <Link
          to="/register"
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Create an account / Sign Up
        </Link>
      </div>
    </AuthLayout>
  );
}