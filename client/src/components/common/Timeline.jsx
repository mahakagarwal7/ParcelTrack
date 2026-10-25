import React from 'react';
import StatusBadge from './StatusBadge';

export default function Timeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p className="text-slate-400 text-xs italic">No status history recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
      {history.map((item, idx) => (
        <div key={idx} className="relative group">
          {/* Timeline Dot */}
          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-slate-900 bg-indigo-500 shadow-sm shadow-indigo-500/50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <StatusBadge status={item.status} />
              <span className="text-xs text-slate-400 font-mono">
                {new Date(item.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {item.note && <p className="text-sm text-slate-300 mt-1">{item.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
