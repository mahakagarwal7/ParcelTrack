import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#why', label: 'Why ParcelTrack' },
  { href: '#roles', label: 'For every role' },
  { href: '#security', label: 'Security' },
];

const ROLE_ROUTES = { STUDENT: '/student', GUARD: '/guard', WARDEN: '/warden', ADMIN: '/admin' };

export default function LandingNav({ onReplayIntro }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
            <Package className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-navy">
            Parcel<span className="text-primary-600">Track</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-primary-700 transition-colors">
              {l.label}
            </a>
          ))}
          <button onClick={onReplayIntro} className="hover:text-primary-700 transition-colors">
            Unbox intro
          </button>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => navigate(ROLE_ROUTES[user.role] || '/login')}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
            >
              Dashboard <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex h-10 items-center px-3 text-sm font-semibold text-slate-700 hover:text-primary-700">
                Sign in
              </Link>
              <Link to="/register" className="inline-flex h-10 items-center px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">
                Get started
              </Link>
            </>
          )}
          <button
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1" aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-slate-700">
              {l.label}
            </a>
          ))}
          <button onClick={() => { setOpen(false); onReplayIntro(); }} className="py-2 text-left text-sm font-semibold text-slate-700">
            Unbox intro
          </button>
        </nav>
      )}
    </header>
  );
}
