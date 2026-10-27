import React from 'react';
import { Clock, EyeOff, ShieldCheck, FileSearch } from 'lucide-react';
import parcelLockerImg from '../../assets/hostel_parcel_locker.png';

const POINTS = [
  { icon: Clock, title: 'Never miss a delivery', body: 'Deliveries land while you are in class. Reception is handled for you, with your consent.' },
  { icon: ShieldCheck, title: 'Nothing accepted without you', body: 'A guard cannot accept a parcel without student authorization. Standing permissions do not skip it.' },
  { icon: FileSearch, title: 'A clear record', body: 'Every step from attempt to handover is logged, so disputes have answers.' },
  { icon: EyeOff, title: 'No more noticeboard chaos', body: 'No unclaimed piles at the gate. Students see exactly where each parcel stands.' },
];

const PHOTOS = [
  { src: parcelLockerImg, alt: 'Hostel parcel locker bank with courier delivery package handover', cls: 'row-span-2' },
  { src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', alt: 'Parcels arranged on storage shelves', cls: '' },
  { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', alt: 'Students walking across campus path', cls: '' },
];

export default function WhyAndLife() {
  return (
    <section id="why" className="py-20 bg-white border-y border-slate-200/70 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="text-sm font-bold text-primary-600 uppercase tracking-wider">Why ParcelTrack</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">Designed for hostel life.</h2>
          <p className="mt-4 text-slate-600 max-w-xl">
            ParcelTrack is not a courier tracker. It is the reception and handover layer a hostel was missing.
          </p>
          <ul className="mt-8 grid sm:grid-cols-2 gap-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 w-9 h-9 shrink-0 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <p.icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-navy">{p.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[420px] sm:h-[480px]">
          {PHOTOS.map((p) => (
            <img key={p.src} src={p.src} alt={p.alt} loading="lazy" className={`w-full h-full object-cover rounded-2xl shadow-soft ${p.cls}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
