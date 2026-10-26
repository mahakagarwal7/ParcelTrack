import React from 'react';

const statusConfig = {
  EXPECTED: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    label: 'Expected / In Transit',
  },
  AUTHORIZED: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    label: 'Pre-Authorized',
  },
  RECEIVED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs ring-2 ring-emerald-500/10',
    dot: 'bg-emerald-500 animate-pulse',
    label: 'Ready for Pickup (At Gate)',
  },
  COLLECTED: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Handed Over',
  },
  DISPUTED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Disputed',
  },
  PENDING_STUDENT: {
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500 animate-ping',
    label: 'Consent Needed',
  },
  PENDING_WARDEN: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Warden Review',
  },
  REJECTED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Rejected',
  },
  AWAITING_AUTHORIZATION: {
    bg: 'bg-amber-50 text-amber-800 border-amber-300',
    dot: 'bg-amber-500 animate-pulse',
    label: 'Gate Arrival (Consent Needed)',
  },
  ACCEPTED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Gate Accepted',
  },
  DENIED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Gate Denied',
  },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
