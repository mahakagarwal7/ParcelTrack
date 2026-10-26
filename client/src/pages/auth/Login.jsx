import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Shield,
  User,
  Building,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: 'STUDENT',
      label: 'Student Portal',
      detail: 'Room 101 (Hostel H-1)',
      email: 'student@hostel.edu',
      password: 'password123',
      color: 'bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200 text-indigo-900',
      activeColor: 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50',
      icon: User,
    },
    {
      role: 'GUARD',
      label: 'Security Guard',
      detail: 'Gate 1 Intake Terminal',
      email: 'guard@hostel.edu',
      password: 'password123',
      color: 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200 text-emerald-900',
      activeColor: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50',
      icon: Shield,
    },
    {
      role: 'WARDEN',
      label: 'Hostel Warden',
      detail: 'Hostel H-1 Supervisor',
      email: 'warden@hostel.edu',
      password: 'password123',
      color: 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-200 text-amber-900',
      activeColor: 'ring-2 ring-amber-600 border-amber-600 bg-amber-50',
      icon: Building,
    },
    {
      role: 'ADMIN',
      label: 'Campus Admin',
      detail: 'Global System Oversight',
      email: 'admin@hostel.edu',
      password: 'password123',
      color: 'bg-purple-50/80 hover:bg-purple-100/80 border-purple-200 text-purple-900',
      activeColor: 'ring-2 ring-purple-600 border-purple-600 bg-purple-50',
      icon: Lock,
    },
  ];

  const handleQuickFill = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setSelectedRole(demo.role);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 selection:bg-indigo-500 selection:text-white">
      {/* LEFT COLUMN: BRAND HERO & SHOWCASE (Deep Dark Gradient / High Aesthetic) */}
      <div className="relative lg:w-7/12 p-8 lg:p-14 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Real Campus Hostel Photography Background with Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity filter blur-xs pointer-events-none scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-indigo-950/80 pointer-events-none" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Tag */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Parcel<span className="text-indigo-400">Track</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 ml-1">
                  Hostel OS
                </span>
              </span>
              <span className="text-[11px] font-medium tracking-wide text-slate-400 block -mt-0.5">
                Hostel Parcel Reception & Secure Handover System
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-slate-300 transition"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Unboxing & Campus</span>
          </Link>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-10 lg:my-0 space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Campus Logistics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Zero Lost Parcels. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                Cryptographic Handover
              </span>{' '}
              at the Gate.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Replaces vulnerable pen-and-paper hostel registers with a state-machine governed intake workflow, salted single-use OTPs, and real-time courier alerts.
            </p>
          </div>

          {/* Interactive Floating Preview Card (Inspired by Delisas & Purrweb) */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Amazon Prime
                </span>
                <span className="font-mono text-slate-400 text-[11px]">PKG-H1-9874</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready for Pickup</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Shelf</span>
                <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Shelf A-1
                </span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Single-Use OTP</span>
                <span className="font-mono font-black text-indigo-300 text-sm mt-0.5 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" /> 729 415
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Intake: 04:30 PM (Gate 1)</span>
              </span>
              <span className="font-semibold text-slate-300">Room 101 • Hostel H-1</span>
            </div>
          </div>

          {/* Hostel Gate 1 & Storeroom Real Photo Badges */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=200&q=80"
                alt="Gate 1 Intake Desk"
                className="w-12 h-12 rounded-xl object-cover border border-white/15 flex-shrink-0"
              />
              <div className="text-left">
                <span className="text-[9px] font-extrabold uppercase text-emerald-400 tracking-wider block">
                  Gate 1 Checkpoint
                </span>
                <p className="text-xs font-bold text-white">Uniformed Guard Desk</p>
                <span className="text-[10px] text-slate-400">Amazon & Flipkart Inward</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80"
                alt="Hostel Storeroom Racks"
                className="w-12 h-12 rounded-xl object-cover border border-white/15 flex-shrink-0"
              />
              <div className="text-left">
                <span className="text-[9px] font-extrabold uppercase text-amber-400 tracking-wider block">
                  Hostel H-1 Storeroom
                </span>
                <p className="text-xs font-bold text-white">Shelves A-1 to D-8</p>
                <span className="text-[10px] text-slate-400">Physical Custody Tagged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Features */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>80/80 Unit & Concurrency Tests Passed</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Constant-Time OTP Hash Verification</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE AUTH & QUICK-FILL PANEL */}
      <div className="lg:w-5/12 bg-slate-50 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/90 space-y-6">
          {/* Form Header */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Sign In to ParcelTrack
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a 1-click demo account below or sign in with your email.
            </p>
          </div>

          {/* 1-Click Demo Accounts Quick-Fill Section */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Quick Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">1-Click Fill</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                const isSelected = selectedRole === account.role;

                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleQuickFill(account)}
                    className={`flex flex-col items-start p-2.5 text-left rounded-xl border text-xs transition-all transform active:scale-95 ${
                      isSelected ? account.activeColor : account.color
                    }`}
                  >
                    <div className="flex items-center justify-between w-full font-bold">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{account.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] opacity-75 mt-0.5">{account.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hostel.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all transform active:scale-98 disabled:opacity-60"
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

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Need a new account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
