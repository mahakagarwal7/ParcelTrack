import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, UserRound, Home, Package, Clock } from 'lucide-react';
import Button from '../ui/Button';

const CONSENT = {
  GRANTED: ['Student consent granted', 'bg-teal-50 text-teal-700 border-teal-200'],
  PENDING: ['Student consent pending', 'bg-amber-50 text-amber-800 border-amber-200'],
  REVOKED: ['Student consent revoked', 'bg-rose-50 text-rose-700 border-rose-200'],
};

const flags = (p) => [p?.isHighValue && 'High value', p?.isOversized && 'Oversized', p?.isCOD && `COD${p.codAmount ? ` ₹${p.codAmount}` : ''}`, p?.category === 'ELECTRONICS' && 'Electronics'].filter(Boolean);

export default function ApprovalCard({ auth, onDecide }) {
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const parcel = auth.parcelId;
  const attempt = auth.deliveryAttemptId;
  const info = parcel || attempt || {};
  const [consentLabel, consentCls] = CONSENT[auth.studentConsent] || [auth.studentConsent, 'bg-slate-50 text-slate-700 border-slate-200'];

  const act = async (decision) => {
    setBusy(decision);
    setError('');
    try { await onDecide(auth._id, decision, comments.trim()); } catch (e) { setError(e.message); } finally { setBusy(null); }
  };

  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-navy flex items-center gap-2"><UserRound className="w-4 h-4 text-primary-600" aria-hidden="true" />{auth.studentId?.name || 'Student'}</p>
          <p className="text-sm text-slate-600 flex items-center gap-2 mt-0.5"><Home className="w-4 h-4" aria-hidden="true" />Room {auth.studentId?.roomNumber || 'N/A'} · <span className="font-mono">{auth.studentId?.studentId || auth.studentId?.email}</span></p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${consentCls}`}>{consentLabel}</span>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
        <p className="font-semibold text-navy flex items-center gap-2"><Package className="w-4 h-4 text-primary-600" aria-hidden="true" />{info.courierName || 'Courier'} · {parcel ? 'Registered parcel' : 'Gate delivery attempt'}</p>
        {info.description && <p className="text-slate-600">{info.description}</p>}
        <p className="font-mono text-xs text-slate-500">{info.trackingNumber || 'No tracking number'}</p>
        {flags(parcel).length > 0 && <p className="flex flex-wrap gap-1.5 pt-1">{flags(parcel).map((f) => <span key={f} className="text-xs font-semibold bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">{f}</span>)}</p>}
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" aria-hidden="true" />
        Requested {new Date(auth.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        {auth.studentConsentAt && ` · consent ${new Date(auth.studentConsentAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
        {auth.wardenComments && ` · earlier note: “${auth.wardenComments}”`}
      </p>

      <div>
        <label htmlFor={`c-${auth._id}`} className="block text-sm font-semibold text-navy mb-1">Comment (optional)</label>
        <input id={`c-${auth._id}`} value={comments} onChange={(e) => setComments(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="success" icon={Check} loading={busy === 'APPROVE'} disabled={Boolean(busy)} onClick={() => act('APPROVE')}>Approve</Button>
        <Button variant="danger" icon={X} loading={busy === 'REJECT'} disabled={Boolean(busy)} onClick={() => act('REJECT')}>Reject</Button>
      </div>
    </motion.article>
  );
}
