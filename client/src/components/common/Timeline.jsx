import React from 'react';
import StatusBadge from './StatusBadge';
import { CheckCircle2, Clock, ShieldCheck, User } from 'lucide-react';

export default function Timeline({ statusHistory = [], history = [] }) {
  const records = statusHistory.length > 0 ? statusHistory : history;

  if (!records || records.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200">
        No lifecycle status transitions recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {records.map((item, idx) => {
        const isLatest = idx === records.length - 1;

        return (
          <div key={idx} className="relative group">
            {/* Stepper Node Dot */}
            <div
              className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                isLatest
                  ? 'border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100 ring-4 ring-indigo-50'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              {isLatest ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-400" />
              )}
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                isLatest
                  ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <StatusBadge status={item.status} />
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {item.note && (
                <p className="text-slate-700 text-xs mt-1.5 leading-relaxed font-normal">
                  {item.note}
                </p>
              )}

              {item.changedBy && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Verified by: {typeof item.changedBy === 'object' ? item.changedBy.name : 'Authorized Officer'}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
