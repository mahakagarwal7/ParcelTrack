import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldQuestion, Check, X } from 'lucide-react';
import Button from '../ui/Button';

// A courier is at the gate with a parcel the student did not register. The backend records the decision.
export default function ConsentRequestCard({ attempt, onDecide }) {
  const [busy, setBusy] = useState(null);
  const authId = attempt.authorizationId?._id || attempt.authorizationId;
  const decide = async (decision) => {
    setBusy(decision);
    try { await onDecide(authId, decision); } finally { setBusy(null); }
  };
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0"><ShieldQuestion className="w-6 h-6" aria-hidden="true" /></span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-navy">A {attempt.courierName || 'courier'} parcel is at the gate</p>
        <p className="text-sm text-slate-700">You did not register this one. Should the guard receive it for you?</p>
        {attempt.trackingNumber && <p className="text-xs font-mono text-slate-600 mt-1">{attempt.trackingNumber}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="success" icon={Check} loading={busy === 'GRANT'} disabled={Boolean(busy)} onClick={() => decide('GRANT')}>Approve</Button>
        <Button variant="danger" icon={X} loading={busy === 'REJECT'} disabled={Boolean(busy)} onClick={() => decide('REJECT')}>Reject</Button>
      </div>
    </motion.div>
  );
}
