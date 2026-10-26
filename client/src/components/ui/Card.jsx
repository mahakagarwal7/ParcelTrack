import React from 'react';

export default function Card({ as: Tag = 'div', hover = false, className = '', children, ...props }) {
  return (
    <Tag
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-soft ${
        hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
