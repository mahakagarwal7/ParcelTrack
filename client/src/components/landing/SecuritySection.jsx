import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

const RULES = [
  'Student consent is required before a guard can accept any parcel.',
  'Standing permission never replaces per-parcel authorization.',
  'A parcel is "received" only after the guard confirms it physically.',
  'Unexpected deliveries are recorded as attempts first, not as received parcels.',
  'Collection needs a single-use OTP that expires.',
  'Every action is logged for accountability.',
];

export default function SecuritySection() {
  return (
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-16">
      <div className="max-w-7xl mx-auto rounded-3xl bg-navy text-white p-8 sm:p-14 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Lock className="w-6 h-6 text-amber-300" aria-hidden="true" /></span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">Security and accountability, by design.</h2>
          <p className="mt-4 text-primary-200 max-w-md">The server makes every authorization decision. The app only shows it.</p>
        </div>
        <ul className="space-y-3">
          {RULES.map((r) => (
            <li key={r} className="flex gap-3 text-sm sm:text-base text-primary-100">
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />{r}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
