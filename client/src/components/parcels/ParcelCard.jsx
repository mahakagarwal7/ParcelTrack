import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, KeyRound, MapPin, History, Hash } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../ui/Button';

const fmt = (d) => (d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short' }) : null);
const fmtTime = (d) => new Date(d).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Status shown is the backend's: a pending authorization takes precedence over the parcel status.
export function displayStatus(parcel) {
  const auth = parcel.authorizationId?.status;
  if (['PENDING_STUDENT', 'PENDING_WARDEN', 'REJECTED', 'EXPIRED', 'REVOKED'].includes(auth) && parcel.status !== 'RECEIVED' && parcel.status !== 'COLLECTED') {
    return auth === 'PENDING_STUDENT' || auth === 'PENDING_WARDEN' ? auth : auth === 'REJECTED' ? 'REJECTED' : 'EXPIRED';
  }
  return parcel.status;
}

export default function ParcelCard({ parcel, onOtp, onTimeline }) {
  const ready = parcel.status === 'RECEIVED';
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift ${ready ? 'border-teal-400 ring-4 ring-teal-500/10' : 'border-slate-200/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-navy text-lg truncate">{parcel.courierName || 'Courier'}</p>
          <p className="text-sm text-slate-600 truncate">{parcel.description || 'No description'}</p>
        </div>
        <StatusBadge status={displayStatus(parcel)} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3" aria-hidden="true" />Tracking ID</dt><dd className="font-mono text-navy truncate">{parcel.trackingNumber || 'Not provided'}</dd></div>
        <div><dt className="text-xs text-slate-500 flex items-center gap-1"><CalendarDays className="w-3 h-3" aria-hidden="true" />Expected</dt><dd className="text-navy">{fmt(parcel.expectedDeliveryDate) || 'Not set'}</dd></div>
        {parcel.receivedAt && (
          <div className="col-span-2"><dt className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />Reception</dt>
            <dd className="text-navy">Received {fmtTime(parcel.receivedAt)}{parcel.shelfLocation ? ` · ${parcel.shelfLocation}` : ''}</dd></div>
        )}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {ready && <Button variant="success" icon={KeyRound} onClick={() => onOtp(parcel)}>Get collection OTP</Button>}
        <Button variant="ghost" icon={History} onClick={() => onTimeline(parcel)}>Timeline</Button>
      </div>
    </motion.article>
  );
}
