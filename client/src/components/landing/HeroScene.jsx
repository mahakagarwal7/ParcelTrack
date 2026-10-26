import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, BellRing, KeyRound, Package } from 'lucide-react';

const HOSTEL_PHOTO =
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';

// CSS-3D parcel floating in front of a hostel photo. No 3D library needed.
function ParcelBox({ reduced }) {
  const face = 'absolute inset-0 flex items-center justify-center border border-amber-700/30';
  const size = 140;
  const half = size / 2;
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
      animate={reduced ? undefined : { rotateY: [-28, -12, -28], rotateX: [-18, -10, -18], y: [0, -14, 0] }}
      initial={{ rotateY: -24, rotateX: -14 }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className={`${face} bg-amber-400`} style={{ transform: `translateZ(${half}px)` }}>
        <div className="absolute inset-x-0 top-0 h-full w-8 mx-auto bg-amber-300/70" />
        <div className="relative bg-white/90 rounded-md px-2 py-1 text-[10px] font-bold text-navy leading-tight text-center">
          PT-2041<br />Room 214
        </div>
      </div>
      <div className={`${face} bg-amber-600`} style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}>
        <div className="absolute inset-x-0 h-full w-8 mx-auto bg-amber-500/70" />
      </div>
      <div className={`${face} bg-amber-300`} style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}>
        <div className="absolute inset-y-0 w-8 left-1/2 -translate-x-1/2 bg-amber-200" />
      </div>
      <div className={`${face} bg-amber-700`} style={{ transform: `rotateY(180deg) translateZ(${half}px)` }} />
      <div className={`${face} bg-amber-500`} style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }} />
    </motion.div>
  );
}

function FloatTag({ icon: Icon, tone, title, sub, className, delay = 0, reduced }) {
  return (
    <motion.div
      className={`absolute bg-white rounded-2xl shadow-lift border border-slate-200/80 px-3.5 py-2.5 flex items-center gap-2.5 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -6, 0] }}
      transition={reduced ? { delay } : { opacity: { delay }, y: { duration: 5, repeat: Infinity, delay, ease: 'easeInOut' } }}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-xs font-bold text-navy">{title}</span>
        <span className="block text-[11px] text-slate-500">{sub}</span>
      </span>
    </motion.div>
  );
}

export default function HeroScene() {
  const reduced = useReducedMotion();
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[4/5] sm:aspect-square" role="img" aria-label="Illustration: a parcel at a hostel gate with authorization and OTP handover status">
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-lift">
        <img src={HOSTEL_PHOTO} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 900 }}>
        <ParcelBox reduced={reduced} />
      </div>
      <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-40 h-5 rounded-full bg-navy/40 blur-md" aria-hidden="true" />

      <FloatTag reduced={reduced} icon={BadgeCheck} tone="bg-teal-100 text-teal-700" title="Authorized" sub="You approved this parcel" className="top-6 -left-2 sm:-left-6" delay={0.2} />
      <FloatTag reduced={reduced} icon={BellRing} tone="bg-amber-100 text-amber-700" title="Received at gate" sub="Guard confirmed · 11:42 AM" className="top-[38%] -right-2 sm:-right-8" delay={0.5} />
      <FloatTag reduced={reduced} icon={KeyRound} tone="bg-primary-100 text-primary-700" title="One-time OTP" sub="Collect when you're back" className="bottom-6 left-4 sm:-left-4" delay={0.8} />

      <div className="absolute bottom-4 right-4 hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white/90">
        <Package className="w-3.5 h-3.5" aria-hidden="true" /> Hostel reception
      </div>
    </div>
  );
}
