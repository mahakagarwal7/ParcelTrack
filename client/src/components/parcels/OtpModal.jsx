import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import OtpDisplay from '../ui/OtpDisplay';
import { Loader2 } from 'lucide-react';
import * as student from '../../api/studentService';

// The OTP is issued by the backend and shown once; it is single-use and expires.
export default function OtpModal({ parcel, onClose }) {
  const [state, setState] = useState({ loading: true, otp: '', expiresAt: null, error: '' });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!parcel) return undefined;
    let cancelled = false;
    setState({ loading: true, otp: '', expiresAt: null, error: '' });
    student.requestCollectionOtp(parcel._id)
      .then((d) => !cancelled && setState({ loading: false, otp: d.otp, expiresAt: d.expiresAt, error: '' }))
      .catch((err) => !cancelled && setState({ loading: false, otp: '', expiresAt: null, error: student.errorMessage(err, 'Could not generate OTP') }));
    return () => { cancelled = true; };
  }, [parcel]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = state.expiresAt ? Math.max(0, Math.floor((new Date(state.expiresAt) - now) / 1000)) : null;
  const label = left === null ? '' : left === 0 ? 'Expired. Close and request a new one.' : `Expires in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <Modal isOpen={Boolean(parcel)} onClose={onClose} title="Collection OTP" maxWidth="max-w-md">
      {state.loading && <p className="flex items-center justify-center gap-2 py-8 text-slate-600"><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />Generating secure OTP…</p>}
      {state.error && <p role="alert" className="text-sm font-medium text-rose-600">{state.error}</p>}
      {state.otp && (
        <div className="space-y-4">
          <OtpDisplay code={state.otp} expiresLabel={label} />
          <p className="text-sm text-slate-600">Show this code to the guard at the gate for <strong>{parcel?.parcelId}</strong>. It works once. Do not share it with anyone else.</p>
        </div>
      )}
    </Modal>
  );
}
