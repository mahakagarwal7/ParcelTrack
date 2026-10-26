import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, Building2, Settings2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEMOS = [
  { icon: GraduationCap, label: 'Student', email: 'student@hostel.edu', to: '/student' },
  { icon: Shield, label: 'Guard', email: 'guard@hostel.edu', to: '/guard' },
  { icon: Building2, label: 'Warden', email: 'warden@hostel.edu', to: '/warden' },
  { icon: Settings2, label: 'Admin', email: 'admin@hostel.edu', to: '/admin' },
];

// Signs in through the normal /auth/login endpoint with the seeded demo accounts.
export default function DemoAccess() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const launch = async (d) => {
    setBusy(d.email);
    setError('');
    try {
      await login(d.email, 'password123');
      navigate(d.to);
    } catch {
      setError('Demo sign-in failed. Use the regular sign-in page.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-soft p-8 sm:p-12">
        <p className="text-sm font-bold text-teal-600 uppercase tracking-wider">Try it</p>
        <h2 className="mt-2 text-3xl font-extrabold text-navy tracking-tight">Open any role with the demo accounts</h2>
        <p className="mt-2 text-slate-600 text-sm">Seeded demo data. Signs in through the normal login.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.map((d) => (
            <button
              key={d.email}
              onClick={() => launch(d)}
              disabled={Boolean(busy)}
              className="group text-left p-5 rounded-2xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition disabled:opacity-60"
            >
              <d.icon className="w-6 h-6 text-primary-600" aria-hidden="true" />
              <span className="block mt-3 font-bold text-navy">{d.label}</span>
              <span className="block text-xs text-slate-500">{d.email}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                {busy === d.email ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in</> : <>Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
              </span>
            </button>
          ))}
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
      </div>
    </section>
  );
}
