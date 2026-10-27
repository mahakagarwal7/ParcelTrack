import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Hourglass, ShieldAlert, XCircle } from 'lucide-react';

// Presents the authorization status returned by the backend. It never computes a decision itself.
const DECISIONS = {
  AUTHORIZED: { icon: CheckCircle2, title: 'AUTHORIZED', hint: 'Guard can receive this parcel.', cls: 'bg-teal-600 text-white' },
  PENDING_STUDENT: { icon: Hourglass, title: 'AWAITING STUDENT CONSENT', hint: 'Do not accept. Wait for the student to approve.', cls: 'bg-amber-500 text-white' },
  PENDING_WARDEN: { icon: Hourglass, title: 'AWAITING WARDEN APPROVAL', hint: 'Do not accept. Wait for the warden to approve.', cls: 'bg-amber-500 text-white' },
  REJECTED: { icon: XCircle, title: 'REJECTED', hint: 'Do not accept this parcel.', cls: 'bg-rose-600 text-white' },
  EXPIRED: { icon: XCircle, title: 'EXPIRED', hint: 'Authorization expired. Do not accept.', cls: 'bg-rose-600 text-white' },
  REVOKED: { icon: XCircle, title: 'REVOKED', hint: 'Authorization was revoked. Do not accept.', cls: 'bg-rose-600 text-white' },
};

const UNKNOWN = { icon: ShieldAlert, title: 'NO AUTHORIZATION ON RECORD', hint: 'Do not accept. Ask the student to register or approve.', cls: 'bg-slate-700 text-white' };

export function isAuthorized(status) {
  return status === 'AUTHORIZED';
}

export default function AuthDecisionBanner({ status, compact = false }) {
  const d = DECISIONS[status] || UNKNOWN;
  const Icon = d.icon;
  return (
    <motion.div
      role="status"
      title={d.hint}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl flex items-center gap-3 cursor-default select-none shadow-sm ${compact ? 'px-3 py-2' : 'px-4 py-3.5'} ${d.cls}`}
    >
      <Icon className={compact ? 'w-5 h-5 shrink-0' : 'w-7 h-7 shrink-0'} aria-hidden="true" />
      <div className="leading-tight">
        <p className={`font-extrabold tracking-wide ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>{d.title}</p>
        {!compact && <p className="text-xs sm:text-sm opacity-90 mt-0.5">{d.hint}</p>}
      </div>
    </motion.div>
  );
}
