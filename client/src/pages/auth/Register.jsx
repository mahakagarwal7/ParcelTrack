import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  User,
  Building,
  Lock,
  Mail,
  Phone,
  Hash,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    hostelId: 'H-1',
    studentId: '',
    roomNumber: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.hostelId) {
      setError('Please provide Name, Email, Password, and Hostel ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await register(formData);
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
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 selection:bg-indigo-500 selection:text-white">
      {/* LEFT COLUMN: BRAND HERO & OVERVIEW */}
      <div className="relative lg:w-5/12 p-8 lg:p-14 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Real Campus Hostel Photography Background with Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity filter blur-xs pointer-events-none scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-indigo-950/80 pointer-events-none" />

        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Parcel<span className="text-indigo-400">Track</span>
              </span>
              <span className="text-[11px] font-medium tracking-wide text-slate-400 block -mt-0.5">
                Hostel Intake & Handover Platform
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-slate-300 transition"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Campus Portal</span>
          </Link>
        </div>

        <div className="relative z-10 my-8 lg:my-0 space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Your Campus Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Start Managing Your Deliveries Today.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Create an account to pre-register online orders, receive instant gate arrival alerts, and collect your packages with cryptographic OTP tokens.
          </p>

          {/* Storeroom Real Photo Mini Card */}
          <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=80"
              alt="Parcel Storage Racks"
              className="w-12 h-12 rounded-xl object-cover border border-white/15 flex-shrink-0"
            />
            <div>
              <span className="text-[9px] font-extrabold uppercase text-amber-400 tracking-wider block">
                Hostel H-1 Storeroom
              </span>
              <p className="text-xs font-bold text-white">Rack B Custody Shelving</p>
              <span className="text-[10px] text-slate-300">Live reception terminal active</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Credentials</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Hostel Multi-Tenancy Scoped</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTRATION FORM */}
      <div className="lg:w-7/12 bg-slate-50 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/90 space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Create an Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Join your hostel's parcel network for verified reception & collection.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STUDENT', label: 'Student' },
                  { id: 'GUARD', label: 'Security Guard' },
                  { id: 'WARDEN', label: 'Hostel Warden' },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setFormData({ ...formData, role: r.id })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition ${
                      formData.role === r.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@hostel.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Password & Hostel ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Hostel ID *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="hostelId"
                    required
                    value={formData.hostelId}
                    onChange={handleChange}
                    placeholder="H-1"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Student Specific Fields */}
            {formData.role === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Student / Roll ID
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="STU-2026-01"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Room Number
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                      placeholder="101"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Contact Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
