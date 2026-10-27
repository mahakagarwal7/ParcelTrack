import React from 'react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import AuthDecisionBanner from '../authorization/AuthDecisionBanner';
import { Truck, Info } from 'lucide-react';

// Splits delivery attempts using the authorization returned by the backend. The backend marks an attempt
// ACCEPTED as soon as it is authorized, so "not yet received" means the authorization has no parcelId.
export default function GateQueues({ attempts, onReceive }) {
  const ready = attempts.filter((a) => a.authorizationId?.status === 'AUTHORIZED' && !a.authorizationId?.parcelId);
  const waiting = attempts.filter((a) => a.status === 'AWAITING_AUTHORIZATION' && a.authorizationId?.status?.startsWith('PENDING'));

  const row = (a, action, isWaiting = false) => (
    <li key={a._id} className="rounded-xl border border-slate-200 p-3 space-y-2.5 bg-white">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-semibold text-navy">{a.studentId?.name || 'Student'} · Room {a.studentId?.roomNumber || 'N/A'}</span>
        <span className="text-slate-500 truncate">{a.courierName}</span>
      </div>
      <AuthDecisionBanner status={a.authorizationId?.status} compact />
      {isWaiting && (
        <div className="text-xs text-amber-950 bg-amber-50 rounded-lg p-2.5 border border-amber-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <p className="font-semibold text-amber-900">Waiting for Student Consent</p>
            <p className="text-amber-800/90 mt-0.5">
              The resident (<strong>{a.studentId?.name || 'Student'}</strong>) must approve this delivery from their student portal. The guard cannot accept it until consent is granted.
            </p>
          </div>
        </div>
      )}
      {action}
    </li>
  );

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="p-5 space-y-3">
        <h2 className="font-bold text-navy">Ready to receive ({ready.length})</h2>
        {ready.length === 0 ? <EmptyState icon={Truck} title="Nothing authorized yet" /> : (
          <ul className="space-y-2">{ready.map((a) => row(a, <Button size="md" variant="success" className="w-full" onClick={() => onReceive('attempt', a)}>Receive parcel</Button>))}</ul>
        )}
      </Card>
      <Card className="p-5 space-y-3">
        <h2 className="font-bold text-navy">Waiting on approval ({waiting.length})</h2>
        {waiting.length === 0 ? <EmptyState title="No pending requests" /> : <ul className="space-y-2">{waiting.map((a) => row(a, null, true))}</ul>}
      </Card>
    </div>
  );
}
