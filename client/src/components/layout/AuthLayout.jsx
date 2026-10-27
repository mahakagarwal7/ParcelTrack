import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShieldCheck,
  Building2,
  MapPin,
  KeyRound,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Truck,
  Shield,
  Check,
} from 'lucide-react';
import parcelLockerImg from '../../assets/hostel_parcel_locker.png';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row selection:bg-indigo-500 selection:text-white"
      style={{ backgroundColor: '#090d16' }}
    >
      {/* ========================================================= */}
      {/* LEFT COLUMN: SHADCN / DELISAS PREMIUM CAMPUS SAAS HERO   */}
      {/* Featuring the User-Selected Smart Parcel Locker Visual    */}
      {/* ========================================================= */}
      <aside
        className="relative lg:w-7/12 xl:w-7/12 hidden lg:flex flex-col justify-between p-8 xl:p-12 overflow-hidden border-r border-white/10"
        style={{ backgroundColor: '#090d16' }}
      >
        {/* Subtle Ambient Radial Glows */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}
        />

        {/* 1. TOP BAR: BRAND + RETURN TO 3D CAMPUS */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Parcel<span className="text-indigo-400">Track</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  Hostel OS v2.0
                </span>
              </span>
              <span className="text-[11px] font-medium tracking-wide text-slate-400 block -mt-0.5">
                University Parcel Reception & Secure Handover
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 transition group"
          >
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span>3D Unboxing & Campus</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-white transition" />
          </Link>
        </div>

        {/* 2. CENTER: USER SELECTED SMART PARCEL LOCKER VISUAL & LIVE TRACKER */}
        <div className="relative z-10 my-4 space-y-4 max-w-xl">
          {/* Photorealistic Smart Parcel Locker Hero Visual */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-slate-900 group">
            <img
              src={parcelLockerImg}
              alt="University Hostel Smart Parcel Locker Bank and Student Package Handover"
              className="w-full h-56 xl:h-64 object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Floating Live Badge Top Left */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-xs text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-amber-300">Hostel H-1 • Gate 1 Desk</span>
              <span className="text-white/40">|</span>
              <span className="text-slate-300 font-mono text-[11px]">Guard Intake Active</span>
            </div>

            {/* Floating Live Badge Top Right */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-xs text-white shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-300">Shelf B-2 Tagged</span>
            </div>

            {/* Floating Live Badge Bottom Right: OTP Token */}
            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-indigo-500/30 text-xs shadow-xl">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-indigo-300 block leading-none">
                  Single-Use OTP
                </span>
                <span className="font-mono font-black text-white text-xs tracking-wider">
                  729 415
                </span>
              </div>
            </div>
          </div>

          {/* DELISAS / SHADCN SIGNATURE LIVE TRACKING CARD */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-3.5 text-xs">
            {/* Card Header: Courier & Status */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-amber-400" />
                  Amazon Prime
                </span>
                <span className="font-mono text-slate-400 text-xs font-semibold">
                  AWB-H1-9874-IN
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready for Pickup</span>
              </span>
            </div>

            {/* Middle Grid: Storage Shelf & Recipient */}
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Assigned Storage Rack
                </span>
                <span className="font-mono font-black text-emerald-400 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Shelf B-2 (Rack 4)
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Hostel H-1 Intake Storeroom
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Resident Destination
                </span>
                <span className="font-black text-white text-sm flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Room 101 (Hostel H-1)
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Kabir Mehta (ID: CS2024)
                </span>
              </div>
            </div>

            {/* Stepper Timeline: Gate ➔ Storeroom ➔ Handover */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 w-2/3 rounded-full" />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Gate 1 Verified
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Shelf B-2 Tagged
                </span>
                <span className="text-indigo-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" /> Awaiting OTP Pickup
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM TRUST PILLARS */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex flex-wrap items-center gap-5 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Lost Parcels at Gate 1</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Constant-Time OTP Handover</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Live Cloud Multi-Tenancy</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: SHADCN ADMIN AUTH CARD                      */}
      {/* High contrast, clean white card on rich slate surface     */}
      {/* ========================================================= */}
      <main className="lg:w-5/12 flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-slate-900/50 lg:bg-slate-950">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/90 text-slate-900">
          {/* Mobile Top Brand & Parcel Locker Thumbnail */}
          <div className="lg:hidden mb-6 space-y-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 font-black text-lg text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Package className="w-4 h-4" />
                </div>
                <span>Parcel<span className="text-indigo-600">Track</span></span>
              </Link>
              <Link to="/" className="text-xs font-bold text-indigo-600 hover:underline">
                3D Unboxing →
              </Link>
            </div>

            <div className="p-2.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center gap-3">
              <img
                src={parcelLockerImg}
                alt="Parcel Locker"
                className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shrink-0 shadow-xs"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block truncate">
                  Hostel Parcel Locker System
                </span>
                <span className="text-xs font-semibold text-slate-700 block truncate">
                  Gate 1 Intake • Shelf Custody • OTP Pickup
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-normal">
              {subtitle}
            </p>
          </div>

          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}