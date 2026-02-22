import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral';

type AdminStatusBadgeProps = {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-brand-green/10 text-green-700',
  warning: 'bg-brand-peach/10 text-brand-orange',
  info: 'bg-brand-blue/10 text-blue-700',
  error: 'bg-red-50 text-red-600',
  neutral: 'bg-cream-100 text-mocha-600',
};

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  variant,
  children,
  icon,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${variantStyles[variant]} ${className}`}>
    {icon}
    {children}
  </span>
);
