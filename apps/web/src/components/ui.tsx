import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm ${className}`}
  >
    {children}
  </div>
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger';
  }
> = ({ variant = 'primary', className = '', ...props }) => {
  const styles: Record<string, string> = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    ghost: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };
  return (
    <button
      {...props}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...props
}) => (
  <input
    {...props}
    className={`w-full border border-zinc-200 bg-zinc-50 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-600 ${className}`}
  />
);

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-medium text-zinc-600">{label}</span>
    {children}
  </label>
);

export const Badge: React.FC<{ children: React.ReactNode; tone?: string }> = ({
  children,
  tone = 'zinc',
}) => {
  const tones: Record<string, string> = {
    zinc: 'bg-zinc-100 text-zinc-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${tones[tone] ?? tones.zinc}`}
    >
      {children}
    </span>
  );
};

export const KES = (kes: number): string => `KES ${kes.toLocaleString()}`;
export const centsToKes = (c: number): string => KES(Math.round(c) / 100);
