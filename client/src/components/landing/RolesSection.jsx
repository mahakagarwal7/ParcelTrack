import React from 'react';
import { GraduationCap, Shield, Building2, Settings2 } from 'lucide-react';

const ROLES = [
  { icon: GraduationCap, name: 'Students', tone: 'bg-primary-600', points: ['Register expected parcels', 'Approve or reject unexpected deliveries', 'Generate a one-time collection OTP'] },
  { icon: Shield, name: 'Guards', tone: 'bg-teal-600', points: ['Search by student ID, name or room', 'See the backend authorization decision at a glance', 'Receive parcels and verify OTP at handover'] },
  { icon: Building2, name: 'Wardens', tone: 'bg-amber-500', points: ['Approve or reject requests per hostel policy', 'Manage standing permissions', 'Watch disputed and expired parcels'] },
  { icon: Settings2, name: 'Admins', tone: 'bg-navy', points: ['Manage hostels, users and roles', 'Hostel-wise parcel statistics', 'Audit logs and configuration'] },
];

export default function RolesSection() {
  return (
    <section id="roles" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
      <div className="max-w-2xl">
        <p className="text-sm font-bold text-primary-600 uppercase tracking-wider">Four roles, four workflows</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">Everyone sees only what they need to act on.</h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <article key={r.name} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`w-11 h-11 rounded-xl text-white flex items-center justify-center ${r.tone}`}>
              <r.icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">{r.name}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {r.points.map((p) => (
                <li key={p} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" aria-hidden="true" />{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
