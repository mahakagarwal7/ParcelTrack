import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import * as guard from '../../api/guardService';

const SHELVES = ['Shelf A-1', 'Shelf A-2', 'Shelf B-1', 'Shelf B-2', 'Locker 1'];
const CONDITIONS = ['INTACT', 'DAMAGED', 'OPENED', 'TAMPERED'];
const field = 'w-full h-12 px-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

// target = { kind: 'parcel' | 'attempt', item }. The backend re-checks authorization on submit.
export default function ReceiveDrawer({ target, onClose, onDone }) {
  const [form, setForm] = useState({ shelf: 'Shelf A-1', condition: 'INTACT', notes: '', photoUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const data = await guard.uploadPhoto(file);
      if (data.success) set('photoUrl', data.url);
    } catch (err) {
      setError(guard.errorMessage(err, 'Photo upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { kind, item } = target;
      const data = kind === 'parcel'
        ? await guard.receiveExpectedParcel(item._id, { shelfLocation: form.shelf, condition: form.condition, damageNotes: form.notes, photoUrl: form.photoUrl })
        : await guard.receiveUnexpectedDelivery(item._id, { storageLocation: form.shelf, remarks: form.notes, photoUrl: form.photoUrl });
      setDone(data.parcel?.parcelId || 'Parcel');
      onDone();
    } catch (err) {
      setError(guard.errorMessage(err, 'Could not receive parcel'));
    } finally {
      setBusy(false);
    }
  };

  const isParcel = target?.kind === 'parcel';

  return (
    <Modal isOpen={Boolean(target)} onClose={onClose} title="Receive parcel" side>
      {done ? (
        <div className="text-center py-10">
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="mx-auto w-20 h-20 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-11 h-11" aria-hidden="true" />
          </motion.div>
          <p className="mt-4 text-xl font-extrabold text-navy">Received at gate</p>
          <p className="text-sm text-slate-600 mt-1">Logged as <span className="font-mono font-bold">{done}</span> at {form.shelf}.</p>
          <Button className="mt-6" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <p className="block text-sm font-semibold text-navy mb-1.5">Storage location</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {SHELVES.map((s) => (
                <button type="button" key={s} onClick={() => set('shelf', s)} aria-pressed={form.shelf === s}
                  className={`h-10 px-3 rounded-xl text-sm font-semibold border ${form.shelf === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-slate-200 text-slate-700'}`}>{s}</button>
              ))}
            </div>
            <label htmlFor="shelf" className="sr-only">Custom storage location</label>
            <input id="shelf" required className={field} value={form.shelf} onChange={(e) => set('shelf', e.target.value)} />
          </div>
          {isParcel && (
            <div>
              <label htmlFor="cond" className="block text-sm font-semibold text-navy mb-1.5">Package condition</label>
              <select id="cond" className={field} value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-navy mb-1.5">{isParcel ? 'Condition notes (optional)' : 'Remarks (optional)'}</label>
            <input id="notes" className={field} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div>
            <label htmlFor="photo" className="text-sm font-semibold text-navy mb-1.5 flex items-center gap-1.5"><Camera className="w-4 h-4" aria-hidden="true" />Inspection photo (optional)</label>
            <input id="photo" type="file" accept="image/*" onChange={upload} disabled={uploading} className="text-sm" />
            {uploading && <p className="text-xs text-primary-600 mt-1">Uploading…</p>}
            {form.photoUrl && <img src={form.photoUrl} alt="Inspection preview" className="mt-2 w-20 h-20 rounded-xl object-cover border" />}
          </div>
          {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
          <Button type="submit" size="lg" variant="success" loading={busy} className="w-full">Confirm physical reception</Button>
        </form>
      )}
    </Modal>
  );
}
