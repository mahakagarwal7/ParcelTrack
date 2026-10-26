import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import * as student from '../../api/studentService';

const field = 'w-full h-11 px-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const CATEGORIES = ['DOCUMENTS', 'ELECTRONICS', 'CLOTHING', 'MEDICINE', 'FOOD', 'OTHER'];
const initial = () => ({ courierName: '', trackingNumber: '', description: '', expectedDeliveryDate: '', category: 'OTHER', isCOD: false, codAmount: '', consent: false });

export default function RegisterParcelModal({ isOpen, onClose, onDone }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent) { setError('Please confirm consent for the hostel to receive this parcel.'); return; }
    setBusy(true);
    setError('');
    try {
      await student.registerParcel({
        courierName: form.courierName.trim(),
        trackingNumber: form.trackingNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        category: form.category,
        isCOD: form.isCOD,
        codAmount: form.isCOD ? Number(form.codAmount) || 0 : 0,
        consent: true,
      });
      setForm(initial());
      onDone();
      onClose();
    } catch (err) {
      setError(student.errorMessage(err, 'Could not register parcel'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register expected parcel" maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="rp-courier" className="block text-sm font-semibold text-navy mb-1.5">Courier *</label>
          <input id="rp-courier" required className={field} value={form.courierName} onChange={(e) => set('courierName', e.target.value)} placeholder="Amazon, Flipkart, Delhivery…" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rp-track" className="block text-sm font-semibold text-navy mb-1.5">Tracking ID</label>
            <input id="rp-track" className={`${field} font-mono`} value={form.trackingNumber} onChange={(e) => set('trackingNumber', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label htmlFor="rp-date" className="block text-sm font-semibold text-navy mb-1.5">Expected date</label>
            <input id="rp-date" type="date" className={field} value={form.expectedDeliveryDate} onChange={(e) => set('expectedDeliveryDate', e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="rp-desc" className="block text-sm font-semibold text-navy mb-1.5">What is it?</label>
          <input id="rp-desc" className={field} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Textbooks, headphones…" />
        </div>
        <div>
          <label htmlFor="rp-cat" className="block text-sm font-semibold text-navy mb-1.5">Category</label>
          <select id="rp-cat" className={field} value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input id="rp-cod" type="checkbox" checked={form.isCOD} onChange={(e) => set('isCOD', e.target.checked)} className="w-4 h-4" />
          <label htmlFor="rp-cod" className="text-sm text-navy">Cash on delivery</label>
          {form.isCOD && <input aria-label="COD amount" type="number" min="0" className={`${field} max-w-[9rem]`} value={form.codAmount} onChange={(e) => set('codAmount', e.target.value)} placeholder="Amount" />}
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-primary-50 p-3 text-sm text-navy">
          <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 w-4 h-4" />
          <span>I consent to hostel staff receiving this parcel on my behalf. Hostel policy decides whether warden approval is also needed.</span>
        </label>
        {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
        <Button type="submit" size="lg" loading={busy} className="w-full">Register parcel</Button>
      </form>
    </Modal>
  );
}
