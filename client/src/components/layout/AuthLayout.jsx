import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShieldCheck } from 'lucide-react';

const PHOTO = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <aside className="relative hidden lg:block">
        <img src={PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl"><Package className="w-6 h-6 text-amber-400" aria-hidden="true" />ParcelTrack</Link>
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Your Parcels. Your Hostel. Handled.</h2>
            <p className="mt-3 text-primary-100 max-w-md flex gap-2"><ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-teal-300" aria-hidden="true" />Nothing is accepted without your consent. Collection needs a one-time OTP.</p>
          </div>
        </div>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 font-extrabold text-xl text-navy mb-6"><Package className="w-6 h-6 text-primary-600" aria-hidden="true" />ParcelTrack</Link>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">{title}</h1>
          <p className="mt-1 text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
