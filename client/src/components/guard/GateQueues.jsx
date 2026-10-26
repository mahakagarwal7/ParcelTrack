import React from 'react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import AuthDecisionBanner from '../authorization/AuthDecisionBanner';
import { Truck } from 'lucide-react';

// Splits delivery attempts using the authorization status returned by the backend.
export default function GateQueues({ attempts, onReceive }) {
  const open = attempts.filter((a) => a.status === 'AWAITING_AUTHORIZATION');
  const ready = open.filter((a) => a.authorizationId?.status === 'AUTHORIZED');
  const waiting = open.filter((a) => a.authorizationId?.status !== 'AUTHORIZED');

  const row = (a, action) => (
    <li key={a._id} className="rounded-xl border border-slate-200 p-3 space-y-2">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-semibold text-navy">{a.studentId?.name || 'Student'} · Room {a.studentId?.roomNumber || 'N/A'}</span>
        <span className="text-slate-500 truncate">{a.courierName}</span>
      </div>
      <AuthDecisionBanner status={a.authorizationId?.status} compact />
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
        {waiting.length === 0 ? <EmptyState title="No pending requests" /> : <ul className="space-y-2">{waiting.map((a) => row(a))}</ul>}
      </Card>
    </div>
  );
}
