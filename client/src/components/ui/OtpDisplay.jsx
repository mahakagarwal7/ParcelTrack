import React from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

// Shows an OTP issued by the backend. The code is never generated client-side.
export default function OtpDisplay({ code, expiresLabel }) {
  const digits = String(code || '').split('');
  return (
    <div className="rounded-2xl bg-navy text-white p-5 text-center">
      <p className="text-xs uppercase tracking-widest text-primary-200">Collection OTP · single use</p>
      <div className="flex justify-center gap-2 mt-3" aria-label={`OTP ${digits.join(' ')}`}>
        {digits.map((d, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 12, rotateX: -60 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="w-11 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-mono font-bold"
          >
            {d}
          </motion.span>
        ))}
      </div>
      {expiresLabel && (
        <p className="mt-3 text-xs text-amber-300 inline-flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" aria-hidden="true" /> {expiresLabel}
        </p>
      )}
    </div>
  );
}
