import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Shield,
  KeyRound,
  MapPin,
  Sparkles,
  ArrowRight,
  Truck,
  CheckCircle2,
  Building,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';

export default function ParcelUnboxIntro({ onComplete, onSkip }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Play synthesized web audio chimes (zero external audio files needed)
  const playSoundEffect = (type) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'unseal') {
        // Tape tear / unseal swoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } else if (type === 'reveal') {
        // Success chord when flaps open and hologram emerges
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7 + idx * 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + 0.8 + idx * 0.08);
        });
      }
    } catch (e) {
      // AudioContext might be blocked until user gesture, safely ignore
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 30;
    setMousePos({ x, y });
  };

  const handleUnbox = () => {
    if (isOpen) {
      // If already open, proceed to landing page
      handleProceed();
      return;
    }
    playSoundEffect('unseal');
    setIsOpen(true);
    setTimeout(() => {
      playSoundEffect('reveal');
    }, 400);
  };

  const handleProceed = () => {
    setHasEntered(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white select-none overflow-hidden transition-all duration-700 ${
        hasEntered ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 40%, rgba(79, 70, 229, 0.18) 0%, rgba(15, 23, 42, 0.98) 75%)`,
      }}
    >
      {/* Real University Hostel Background Texture */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity filter blur-xs pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=80')`,
        }}
      />

      {/* Atmospheric Star / Dust Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                Parcel<span className="text-indigo-400">Track</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                Hostel Intake OS
              </span>
            </div>
            <span className="text-xs text-slate-400">Gate 1 • University Residence Deliveries</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 transition text-xs flex items-center gap-1.5"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button
            onClick={onSkip || handleProceed}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 group"
          >
            <span>Skip directly to Campus</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Center 3D Stage */}
      <div
        className="relative z-20 w-full flex-1 flex flex-col items-center justify-center max-w-4xl px-4"
        style={{ perspective: '1400px' }}
      >
        {/* Intro Instruction Badge */}
        <div className="mb-6 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Campus Delivery Unboxing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            A parcel just arrived at <span className="text-indigo-400">Hostel Gate 1</span>.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Experience how university residence parcels transition from courier gate arrival to secure cryptographic handover.
          </p>
        </div>

        {/* 3D Parcel Box Object */}
        <div
          onClick={handleUnbox}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative cursor-pointer transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${16 + mousePos.y * 0.4}deg) rotateY(${-20 + mousePos.x * 0.4}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ambient Box Shadow */}
          <div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-64 h-24 bg-black/60 rounded-full blur-2xl transition-all duration-500"
            style={{
              transform: isOpen ? 'scale(1.2) translateY(20px)' : 'scale(1)',
              opacity: isOpen ? 0.4 : 0.8,
            }}
          />

          {/* Main Cardboard Box Body */}
          <div
            className="relative w-64 sm:w-72 md:w-80 h-56 sm:h-64 rounded-3xl bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border-2 border-amber-600/60 shadow-[0_30px_70px_rgba(217,119,6,0.35)] flex flex-col justify-between p-5 text-amber-950 transition-all duration-700"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: isOpen
                ? '0 0 80px rgba(99, 102, 241, 0.4), 0 30px 60px rgba(0,0,0,0.5)'
                : '0 25px 60px rgba(180, 83, 9, 0.35)',
            }}
          >
            {/* Box Texture & Inner Depth */}
            <div className="absolute inset-0 rounded-3xl bg-amber-950/5 pointer-events-none" />

            {/* Top Shipping Label */}
            <div className="relative z-10 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-500/40 shadow-md space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">
                    PT
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-tight">
                    Hostel Express Inward
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Gate 1 Logged
                </span>
              </div>

              <div className="text-[10px] space-y-1 text-slate-700">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">To:</span>
                  <span className="font-extrabold text-slate-900">Kabir Mehta (Room 101, H-1)</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Tracking:</span>
                  <span className="font-bold text-indigo-600">AMZ-H1-9874-IN</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Courier:</span>
                  <span>Blue Dart Express (Gate 1)</span>
                </div>
              </div>

              {/* Barcode Graphic */}
              <div className="pt-1 flex items-center justify-between h-4 bg-slate-900/10 px-2 rounded font-mono text-[8px] tracking-widest text-slate-900">
                |||| | |||||| || | |||| ||| |||||
              </div>
            </div>

            {/* Central Holographic Security Tape */}
            <div
              className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 transition-all duration-500 flex items-center justify-center overflow-hidden border-y border-amber-600/50 ${
                isOpen
                  ? 'opacity-0 scale-x-0 pointer-events-none'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-sm opacity-100'
              }`}
            >
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-950 flex items-center gap-2">
                <span>★ HOSTEL RESIDENCE SEAL</span>
                <span className="w-1 h-1 rounded-full bg-amber-900" />
                <span>DO NOT ACCEPT IF BROKEN ★</span>
              </span>
            </div>

            {/* 3D Flaps (Animate Open when Clicked) */}
            {/* Top Flap (Opens Backward) */}
            <div
              className="absolute -top-14 inset-x-4 h-14 bg-amber-300/90 border-t-2 border-x-2 border-amber-500 rounded-t-2xl shadow-md transition-transform duration-700 ease-out pointer-events-none"
              style={{
                transformOrigin: 'bottom',
                transform: isOpen ? 'rotateX(135deg)' : 'rotateX(0deg)',
              }}
            />

            {/* Bottom/Front Flap (Opens Downward) */}
            <div
              className="absolute -bottom-14 inset-x-4 h-14 bg-amber-300/90 border-b-2 border-x-2 border-amber-500 rounded-b-2xl shadow-md transition-transform duration-700 ease-out pointer-events-none"
              style={{
                transformOrigin: 'top',
                transform: isOpen ? 'rotateX(-135deg)' : 'rotateX(0deg)',
              }}
            />

            {/* Left Flap (Opens Left) */}
            <div
              className="absolute inset-y-4 -left-12 w-12 bg-amber-400/90 border-l-2 border-y-2 border-amber-500 rounded-l-2xl shadow-md transition-transform duration-700 ease-out pointer-events-none"
              style={{
                transformOrigin: 'right',
                transform: isOpen ? 'rotateY(-130deg)' : 'rotateY(0deg)',
              }}
            />

            {/* Right Flap (Opens Right) */}
            <div
              className="absolute inset-y-4 -right-12 w-12 bg-amber-400/90 border-r-2 border-y-2 border-amber-500 rounded-r-2xl shadow-md transition-transform duration-700 ease-out pointer-events-none"
              style={{
                transformOrigin: 'left',
                transform: isOpen ? 'rotateY(130deg)' : 'rotateY(0deg)',
              }}
            />

            {/* Box Footer Badges */}
            <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-amber-900 border-t border-amber-600/30 pt-2">
              <span className="flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-900" />
                Hostel H-1 Storeroom
              </span>
              <span className="uppercase px-2 py-0.5 rounded-full bg-amber-900/15 text-amber-950 font-black">
                Fragile
              </span>
            </div>
          </div>

          {/* INSIDE REVEAL: Holographic Content that Rises Up in 3D Space */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none ${
              isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
            style={{
              transform: isOpen ? 'translateZ(90px) translateY(-25px)' : 'translateZ(0px)',
            }}
          >
            {/* Radiant Glowing Flare Beams */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/40 via-purple-500/30 to-amber-300/30 blur-2xl animate-pulse" />

            {/* Floating Holographic Handover Card */}
            <div className="relative bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-400/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-white w-64 sm:w-72 space-y-3.5">
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/50">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">Intake Verified</span>
                    <span className="text-xs font-black text-white">Shelf B-2 (Rack 4)</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {/* Single-Use OTP Display */}
              <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 p-3 rounded-2xl border border-indigo-500/30 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                  Student Pickup OTP
                </span>
                <span className="font-mono font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 tracking-widest">
                  729 415
                </span>
                <span className="text-[9px] text-slate-400 block">Salted SHA-256 • 10-Min Expiry</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gate 1 Signed
                </span>
                <span className="text-slate-400 font-mono">Room 101</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Callout Button */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={isOpen ? handleProceed : handleUnbox}
            className={`px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm transition-all duration-300 flex items-center gap-3 shadow-xl active:scale-95 ${
              isOpen
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:scale-105'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-indigo-600/30 hover:scale-105 animate-pulse-subtle'
            }`}
          >
            {isOpen ? (
              <>
                <span>Enter Campus Hostel Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                <span>Click to Open & Unbox Parcel</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>

          <span className="text-xs text-slate-400">
            {isOpen ? 'Verified package opened! Tap to explore.' : 'Move mouse to tilt box in 3D • Tap to open flaps'}
          </span>
        </div>
      </div>

      {/* Bottom Campus Credentials */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-400" />
          <span>Hostel H-1 Residential Logistics Infrastructure</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="hidden sm:inline">Boys & Girls Hostels</span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span>Security Gate 1 Intake</span>
          <span className="text-white/20">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zero Lost Parcels
          </span>
        </div>
      </div>
    </div>
  );
}