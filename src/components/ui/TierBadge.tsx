import React from 'react';
import type { LoyaltyTier } from '../../types/loyalty';

interface TierBadgeProps {
  tier: LoyaltyTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const config = {
    Bronze: {
      icon: '🥉',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-300 dark:border-amber-700'
    },
    Silver: {
      icon: '🥈',
      bg: 'bg-slate-200 dark:bg-slate-800/50',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-400 dark:border-slate-600'
    },
    Gold: {
      icon: '🏆',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border-yellow-400 dark:border-yellow-700'
    },
    Platinum: {
      icon: '💎',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-800 dark:text-indigo-200',
      border: 'border-indigo-400 dark:border-indigo-700'
    }
  };

  const tierConfig = config[tier];

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'text-sm',
      gap: 'gap-1'
    },
    md: {
      container: 'px-3 py-1 text-sm',
      icon: 'text-base',
      gap: 'gap-1.5'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'text-lg',
      gap: 'gap-2'
    }
  };

  const sizeConfig = sizeClasses[size];

  return (
    <span
      className={`
        inline-flex items-center ${sizeConfig.gap}
        ${sizeConfig.container}
        ${tierConfig.bg}
        ${tierConfig.text}
        border ${tierConfig.border}
        rounded-full
        font-medium
        ${className}
      `}
    >
      <span className={sizeConfig.icon}>{tierConfig.icon}</span>
      {showLabel && <span>{tier}</span>}
    </span>
  );
};
