import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] shadow-md shadow-indigo-600/20',
  secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20',
  ghost: 'text-indigo-600 hover:bg-indigo-50',
};

const variantStyles = {
  primary: { backgroundColor: '#4f46e5', color: '#ffffff' },
  secondary: { backgroundColor: '#ffffff', color: '#0f172a' },
  success: { backgroundColor: '#059669', color: '#ffffff' },
  danger: { backgroundColor: '#e11d48', color: '#ffffff' },
  ghost: { backgroundColor: 'transparent', color: '#4f46e5' },
};

const sizes = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  style = {},
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      style={{ ...variantStyles[variant], ...style }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          {children}
        </>
      )}
    </button>
  );
}