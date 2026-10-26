import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AuthDecisionBanner from '../authorization/AuthDecisionBanner';
import * as guard from '../../api/guardService';

const field = 'w-full h-12 px-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const INITIAL = { courierName: '', trackingNumber: '', deliveryPersonContact: '', notes: '' };

// Records a delivery ATTEMPT only. Nothing is received until the backend authorizes it.
export default function UnexpectedDeliveryModal({ student, onClose, onDone }) {
  const [form, setForm] = useState(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authStatus, setAuthStatus] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const close = () => { setForm(INITIAL); setError(''); setAuthStatus(null); onClose(); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await guard.registerDeliveryAttempt({ studentId: student._id, ...form });
      setAuthStatus(data.data?.authorization?.status || 'UNKNOWN');
      onDone();
    } catch (err) {
      setError(guard.errorMessage(err, 'Could not register delivery attempt'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={Boolean(student)} onClose={close} title="Unexpected delivery" maxWidth="max-w-lg">
      {authStatus ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Delivery attempt recorded for <strong>{student?.name}</strong>. Backend decision:</p>
          <AuthDecisionBanner status={authStatus} />
          <p className="text-xs text-slate-500">The parcel is not received yet. Receive it from the gate search or the ready list once it shows AUTHORIZED.</p>
          <Button onClick={close}>Close</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-600">For <strong>{student?.name}</strong> · Room {student?.roomNumber || 'N/A'}</p>
          <div>
            <label htmlFor="ud-courier" className="block text-sm font-semibold text-navy mb-1.5">Courier name</label>
            <input id="ud-courier" required className={field} value={form.courierName} onChange={(e) => set('courierName', e.target.value)} placeholder="Amazon, Delhivery, BlueDart…" />
          </div>
          <div>
            <label htmlFor="ud-track" className="block text-sm font-semibold text-navy mb-1.5">Tracking number (if on label)</label>
            <input id="ud-track" className={`${field} font-mono`} value={form.trackingNumber} onChange={(e) => set('trackingNumber', e.target.value)} />
          </div>
          <div>
            <label htmlFor="ud-contact" className="block text-sm font-semibold text-navy mb-1.5">Delivery agent contact</label>
            <input id="ud-contact" type="tel" className={field} value={form.deliveryPersonContact} onChange={(e) => set('deliveryPersonContact', e.target.value)} />
          </div>
          <div>
            <label htmlFor="ud-notes" className="block text-sm font-semibold text-navy mb-1.5">Notes</label>
            <input id="ud-notes" className={field} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
          <Button type="submit" size="lg" loading={busy} className="w-full">Record delivery attempt</Button>
        </form>
      )}
    </Modal>
  );
}
