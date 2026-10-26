import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Shield, Building2, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

const ROUTES = { STUDENT: '/student', GUARD: '/guard', WARDEN: '/warden', ADMIN: '/admin' };

const DEMOS = [
  { role: 'STUDENT', label: 'Student', email: 'student@hostel.edu', icon: GraduationCap },
  { role: 'GUARD', label: 'Guard', email: 'guard@hostel.edu', icon: Shield },
  { role: 'WARDEN', label: 'Warden', email: 'warden@hostel.edu', icon: Building2 },
  { role: 'ADMIN', label: 'Admin', email: 'admin@hostel.edu', icon: Settings2 },
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
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your hostel parcels.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField id="login-email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField id="login-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">Sign in</Button>
      </form>

      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Demo accounts (fills the form)</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <button key={d.role} type="button" onClick={() => { setEmail(d.email); setPassword('password123'); setError(''); }}
              className="flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50 text-sm font-semibold text-navy">
              <d.icon className="w-4 h-4 text-primary-600" aria-hidden="true" />{d.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-600">New student? <Link to="/register" className="font-semibold text-primary-700 hover:underline">Create an account</Link></p>
    </AuthLayout>
  );
}
