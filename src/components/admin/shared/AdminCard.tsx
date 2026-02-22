import React from 'react';

type AdminCardProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
};

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  noPadding = false,
}) => (
  <div className={`bg-white border border-cream-200 rounded-xl shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
        <div>
          {title && <h3 className="text-base font-semibold text-mocha-900">{title}</h3>}
          {subtitle && <p className="text-xs text-mocha-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </div>
);
