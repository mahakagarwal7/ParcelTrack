import React from 'react';
import { BellRing } from 'lucide-react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function NotificationList({ notifications, onRead, limit = 5 }) {
  return (
    <Card className="p-5">
      <h2 className="font-bold text-navy mb-3">Notifications</h2>
      {notifications.length === 0 ? <EmptyState icon={BellRing} title="You're all caught up" /> : (
        <ul className="divide-y divide-slate-100">
          {notifications.slice(0, limit).map((n) => (
            <li key={n._id}>
              <button onClick={() => !n.isRead && onRead(n._id)} className="w-full text-left py-2.5 flex gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-slate-300' : 'bg-primary-500'}`} aria-label={n.isRead ? 'Read' : 'Unread'} />
                <span>
                  <span className="block text-sm font-semibold text-navy">{n.title}</span>
                  <span className="block text-xs text-slate-600">{n.message}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
