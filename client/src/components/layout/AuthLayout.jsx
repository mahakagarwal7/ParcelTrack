import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShieldCheck,
  Building2,
  MapPin,
  KeyRound,
  Clock,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// Mixture of Hostel and Parcel imagery
const COURIER_DELIVERY_BG = 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1400&q=80';
const HOSTEL_CAMPUS_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80';
const PARCEL_SHELVES_IMG = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-surface selection:bg-primary-500 selection:text-white">
      {/* LEFT COLUMN: 7 COLS — MIXTURE OF HOSTEL CAMPUS + PARCEL RECEPTION SHOWCASE */}
      <aside className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-10 xl:p-14 text-white overflow-hidden bg-navy">
        {/* Photorealistic Courier & Parcel Delivery Background */}
        <img
          src={COURIER_DELIVERY_BG}
          alt="Hostel courier package intake"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity filter blur-[1px] scale-105 pointer-events-none"
        />

        {/* Rich Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/90 to-navy/70 pointer-events-none" />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP HEADER: BRAND + BACK TO CAMPUS & 3D UNBOXING */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-900/40 text-white group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Parcel<span className="text-primary-300">Track</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white/10 text-amber-300 rounded-full border border-white/15">
                  Hostel OS
                </span>
              </span>
              <span className="text-[11px] font-medium tracking-wide text-slate-300 block -mt-0.5">
                Hostel Parcel Reception & Secure Handover
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 transition"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Unboxing & Campus</span>
          </Link>
        </div>

        {/* 2. CENTER CONTENT: MIXTURE OF HOSTEL CAMPUS + PARCEL LOGISTICS */}
        <div className="relative z-10 my-8 space-y-6 max-w-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-primary-500/20 border border-primary-400/30 text-primary-200 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Hostel Logistics Hub</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Hostel Parcels Delivered, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-primary-200 to-teal-300">
                Safely Handed Over
              </span>{' '}
              at Gate 1.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Eliminating lost packages, delivery gate disputes, and pen-and-paper logs across university dorms. Connecting couriers, gate security, and resident students.
            </p>
          </div>

          {/* DUAL MINI-CARDS SHOWCASING BOTH HOSTEL & PARCEL */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hostel Campus Card */}
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3 shadow-lg">
              <img
                src={HOSTEL_CAMPUS_IMG}
                alt="Hostel Dormitory Building"
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
              />
              <div className="text-left overflow-hidden">
                <span className="text-[9px] font-extrabold uppercase text-amber-300 tracking-wider block truncate">
                  Hostel H-1 Residence
                </span>
                <p className="text-xs font-bold text-white truncate">450 Student Dorms</p>
                <span className="text-[10px] text-slate-300 block truncate">Gate 1 Intake Terminal</span>
              </div>
            </div>

            {/* Parcel Shelves Card */}
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3 shadow-lg">
              <img
                src={PARCEL_SHELVES_IMG}
                alt="Hostel Storeroom Parcel Shelves"
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
              />
              <div className="text-left overflow-hidden">
                <span className="text-[9px] font-extrabold uppercase text-teal-300 tracking-wider block truncate">
                  Storeroom Shelves
                </span>
                <p className="text-xs font-bold text-white truncate">Rack A-1 to D-8</p>
                <span className="text-[10px] text-slate-300 block truncate">Custody Shelf Tracking</span>
              </div>
            </div>
          </div>

          {/* LIVE PARCEL INTAKE SIMULATOR CARD */}
          <div className="bg-slate-900/85 backdrop-blur-xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Amazon Prime
                </span>
                <span className="font-mono text-slate-300 text-[11px]">PKG-H1-9874-IN</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Ready at Gate 1</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-200">
              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Shelf</span>
                <span className="font-mono font-black text-teal-300 text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" /> Shelf B-2
                </span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Single-Use OTP</span>
                <span className="font-mono font-black text-amber-300 text-sm mt-0.5 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> 729 415
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Gate 1 Guard Verified</span>
              </span>
              <span className="font-semibold text-white">Room 101 • Hostel H-1</span>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM TRUST PILLARS */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Zero Lost Parcels</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Constant-Time OTP Handover</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 font-semibold">
            <Building2 className="w-4 h-4 text-primary-300" />
            <span>Hostel Multi-Tenancy Scoped</span>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: 5 COLS — CLEAN AUTH FORM */}
      <main className="lg:col-span-5 flex items-center justify-center px-4 py-10 sm:px-8 bg-surface">
        <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl shadow-lift border border-slate-200/80">
          {/* Mobile Top Brand & Hostel Parcel Badge */}
          <div className="lg:hidden mb-6 space-y-3">
            <Link to="/" className="flex items-center gap-2 font-black text-xl text-navy">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <Package className="w-4 h-4" />
              </div>
              <span>Parcel<span className="text-primary-600">Track</span></span>
            </Link>

            <div className="p-3 bg-primary-50 rounded-2xl border border-primary-200 flex items-center gap-3">
              <img
                src={PARCEL_SHELVES_IMG}
                alt="Parcel Shelves"
                className="w-10 h-10 rounded-xl object-cover border border-primary-200 shrink-0"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-primary-800 tracking-wider block">
                  Hostel Parcel Reception & Handover
                </span>
                <span className="text-xs text-slate-600">
                  Gate 1 Intake • Shelf Custody • OTP Pickup
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">{title}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}