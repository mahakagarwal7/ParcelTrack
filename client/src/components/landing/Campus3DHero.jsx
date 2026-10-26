import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Shield,
  KeyRound,
  MapPin,
  Sparkles,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  Lock,
} from 'lucide-react';

export default function Campus3DHero() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 12, y: -18 });
  const [activeStep, setActiveStep] = useState(2); // 0: Pre-registered, 1: Gate Arrival, 2: Stored in Custody, 3: OTP Collected

  // Mouse tilt tracking for 3D depth
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / rect.height) * 24;
    const rotY = (x / rect.width) * 24;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 12, y: -18 });
  };

  // Background animated constellation of campus gate nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.18 * (1 - dist / 110)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw particle dots
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129, 140, 248, 0.5)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-lg lg:max-w-xl mx-auto h-[480px] sm:h-[540px] flex items-center justify-center select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl"
      />

      {/* Ambient Radial Glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-blue-500/10 blur-3xl pointer-events-none animate-pulse-subtle" />

      {/* 3D Scene Root with Dynamic Rotation */}
      <div
        className="relative transition-transform duration-200 ease-out flex items-center justify-center"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Core 3D Parcel Box */}
        <div
          className="relative w-56 sm:w-64 h-56 sm:h-64 rounded-3xl bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 border-2 border-amber-400/80 shadow-[0_30px_70px_rgba(217,119,6,0.25)] flex flex-col justify-between p-5 text-amber-950 transition-all cursor-pointer group hover:scale-105"
          style={{ transform: 'translateZ(20px)' }}
        >
          {/* Box Sealing Tape Graphic */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-amber-400/60 border-y border-amber-500/40 flex items-center justify-center overflow-hidden">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-amber-900/60 whitespace-nowrap">
              HOSTEL INTAKE VERIFIED • SECURE OTP SEAL
            </span>
          </div>

          {/* Box Header Label */}
          <div className="flex items-start justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-950 text-amber-200 flex items-center justify-center font-black text-xs shadow-sm">
                PT
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-900 block">Amazon Prime</span>
                <span className="text-xs font-mono font-black text-amber-950">PKG-H1-9874</span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider shadow-xs">
              In Custody
            </span>
          </div>

          {/* Box Barcode and Destination Info */}
          <div className="z-10 space-y-2 bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-amber-400/50">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-amber-900">Destination:</span>
              <span className="text-indigo-900 font-extrabold">Room 101 (Hostel H-1)</span>
            </div>
            {/* Barcode Graphic */}
            <div className="flex items-center justify-between h-5 bg-amber-950/10 px-2 rounded font-mono text-[9px] tracking-widest text-amber-950">
              ||| | |||| | |||||| || | |||
            </div>
          </div>
        </div>

        {/* Floating 3D Satellite 1: Gate 1 Security Clearance (Top Right) */}
        <div
          className="absolute -top-6 -right-12 sm:-right-16 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-300 shadow-xl flex items-center gap-3 text-xs pointer-events-none transition-transform"
          style={{ transform: 'translateZ(70px)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Gate 1 Desk
            </span>
            <p className="font-extrabold text-slate-900">Hostel Guard Verified</p>
          </div>
        </div>

        {/* Floating 3D Satellite 2: Storage Rack Location (Bottom Left) */}
        <div
          className="absolute -bottom-8 -left-10 sm:-left-14 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-indigo-200 shadow-xl flex items-center gap-3 text-xs pointer-events-none transition-transform"
          style={{ transform: 'translateZ(60px)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-600">Storage Rack</span>
            <p className="font-mono font-black text-slate-900 text-sm">Shelf B-2 (Rack 4)</p>
          </div>
        </div>

        {/* Floating 3D Satellite 3: Glowing Salted OTP (Bottom Right) */}
        <div
          className="absolute -bottom-10 -right-8 sm:-right-10 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-indigo-400/40 shadow-2xl flex items-center gap-3 text-xs pointer-events-none transition-transform"
          style={{ transform: 'translateZ(85px)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/50">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-extrabold text-indigo-300 tracking-wider">
              10-Min Single-Use OTP
            </span>
            <p className="font-mono font-black text-indigo-200 text-base tracking-widest">
              729 415
            </p>
          </div>
        </div>

        {/* Floating 3D Satellite 4: Student Consent Granted (Top Left) */}
        <div
          className="absolute -top-10 -left-8 sm:-left-12 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-2.5 text-xs pointer-events-none transition-transform"
          style={{ transform: 'translateZ(50px)' }}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Hostel H-1</span>
            <p className="font-bold text-slate-800 text-[11px]">Room 101 Resident</p>
          </div>
        </div>
      </div>
    </div>
  );
}
