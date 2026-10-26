import React from 'react';
import { motion } from 'framer-motion';
import { PackagePlus, UserCheck, ScanLine, KeyRound } from 'lucide-react';

const STEPS = [
  { icon: PackagePlus, title: 'Register Your Parcel', body: 'Add an expected parcel, or give consent when an unexpected delivery turns up at the gate.', tone: 'bg-primary-100 text-primary-700' },
  { icon: UserCheck, title: 'Authorize Reception', body: 'Your consent and, where your hostel requires it, warden approval are checked against hostel policy.', tone: 'bg-amber-100 text-amber-700' },
  { icon: ScanLine, title: 'Secure Reception', body: 'The guard verifies authorization and only then records the parcel as physically received.', tone: 'bg-teal-100 text-teal-700' },
  { icon: KeyRound, title: 'Collect Securely', body: 'Collect it with a single-use, expiring OTP. No OTP, no handover.', tone: 'bg-navy text-white' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-primary-600 uppercase tracking-wider">How it works</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">From the gate to your hands, in four checked steps.</h2>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-soft"
          >
            <span className="absolute top-5 right-5 text-5xl font-black text-slate-100 select-none" aria-hidden="true">{i + 1}</span>
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.tone}`}>
              <s.icon className="w-6 h-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-navy">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.body}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
