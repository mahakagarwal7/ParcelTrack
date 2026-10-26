import React from 'react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function ActivityFeed({ logs }) {
  return (
    <Card className="p-5">
      <h2 className="font-bold text-navy mb-3">Recent activity</h2>
      {logs.length === 0 ? <EmptyState title="No recent activity" /> : (
        <ul className="divide-y divide-slate-100">
          {logs.map((l) => (
            <li key={l._id} className="py-2 flex justify-between gap-3 text-sm">
              <span className="font-mono font-semibold text-primary-700 truncate">{l.action}</span>
              <time className="text-xs text-slate-500 shrink-0" dateTime={l.createdAt}>
                {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
