import React from 'react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function ActivityTable({ logs, title = 'Recent activity' }) {
  return (
    <Card className="overflow-hidden">
      <h2 className="font-bold text-navy px-5 py-4 border-b border-slate-100">{title}</h2>
      {logs.length === 0 ? <EmptyState title="No activity yet" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr><th scope="col" className="px-5 py-2.5">Action</th><th scope="col" className="px-5 py-2.5">By</th><th scope="col" className="px-5 py-2.5">When</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="px-5 py-2.5 font-mono font-semibold text-primary-700">{l.action}</td>
                  <td className="px-5 py-2.5 text-slate-600">{l.actorRole || 'SYSTEM'}</td>
                  <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">{new Date(l.timestamp || l.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
