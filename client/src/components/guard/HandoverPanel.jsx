import React, { useState } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import * as guard from '../../api/guardService';

// Collection OTP is verified by the backend: single use, expiring, attempt-limited.
export default function HandoverPanel({ parcels, onDone }) {
  const [parcelRef, setParcelRef] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const data = await guard.collectWithOtp(parcelRef.trim(), otp.trim());
      setSuccess(data.message || 'Parcel handed over.');
      setOtp('');
      setParcelRef('');
      onDone();
    } catch (err) {
      setError(guard.errorMessage(err, 'Verification failed. Check the OTP.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-bold text-navy flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary-600" aria-hidden="true" />Handover with OTP</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="ho-parcel" className="block text-sm font-semibold text-navy mb-1.5">Parcel ID</label>
          <input id="ho-parcel" required value={parcelRef} onChange={(e) => setParcelRef(e.target.value.toUpperCase())} placeholder="Tap a parcel below or type its ID"
            className="w-full h-12 px-3 rounded-xl border border-slate-300 font-mono focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
        </div>
        <div>
          <label htmlFor="ho-otp" className="block text-sm font-semibold text-navy mb-1.5">Student&apos;s 6-digit OTP</label>
          <input id="ho-otp" required inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full h-14 px-3 rounded-xl border border-slate-300 text-center text-2xl tracking-[0.5em] font-mono font-bold focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        {success && <p role="status" className="text-sm font-semibold text-teal-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />{success}</p>}
        <Button type="submit" size="lg" loading={busy} disabled={otp.length < 6} className="w-full">Verify OTP &amp; hand over</Button>
      </form>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Awaiting collection ({parcels.length})</h3>
        {parcels.length === 0 ? (
          <EmptyState title="No parcels in custody" />
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {parcels.map((p) => (
              <li key={p._id}>
                <button type="button" onClick={() => setParcelRef(p.parcelId)} aria-pressed={parcelRef === p.parcelId}
                  className={`w-full text-left rounded-xl border p-3 transition ${parcelRef === p.parcelId ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <span className="flex justify-between gap-2">
                    <span className="font-mono font-bold text-primary-700 text-sm">{p.parcelId}</span>
                    <span className="text-xs font-mono bg-slate-100 rounded px-1.5 py-0.5">{p.shelfLocation || 'No shelf'}</span>
                  </span>
                  <span className="block text-sm text-navy font-semibold mt-0.5">{p.studentId?.name || 'Student'} · Room {p.studentId?.roomNumber || 'N/A'}</span>
                  <span className="block text-xs text-slate-500">{p.courierName || p.carrier || 'Courier'} · {p.trackingNumber || 'No tracking'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
