import React from 'react';

export default function TextField({ id, label, hint, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy mb-1.5">{label}</label>
      <input id={id} className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" {...props} />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
