// components/account/AccountMobileNav.tsx
// Mobil alt tab bar navigasyonu

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  Award,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import type { AccountView } from './AccountSidebar';

interface AccountMobileNavProps {
  currentView: AccountView;
  onViewChange: (view: AccountView) => void;
  ordersCount: number;
}

interface TabItem {
  id: AccountView;
  icon: React.ElementType;
  label: string;
}

const tabs: TabItem[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Genel' },
  { id: 'orders', icon: ShoppingBag, label: 'Siparişler' },
  { id: 'addresses', icon: MapPin, label: 'Adresler' },
  { id: 'loyalty', icon: Award, label: 'Sadakat' },
  { id: 'settings', icon: Settings, label: 'Ayarlar' },
];

export const AccountMobileNav: React.FC<AccountMobileNavProps> = ({
  currentView,
  onViewChange,
  ordersCount
}) => {
  // Yardım, fatura gibi ikincil sayfalar için settings'i aktif göster
  const activeTab = ['help', 'invoice'].includes(currentView) ? 'settings' : currentView;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'orders' && ordersCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 h-full py-1 min-w-0
                transition-all duration-200
                ${isActive ? 'text-gold' : 'text-gray-400 active:text-gray-600 dark:active:text-gray-300'}
              `}
            >
              {/* Aktif indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-b-full" />
              )}

              {/* Icon container with badge */}
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[9px] font-bold bg-gold text-white rounded-full">
                    {ordersCount > 9 ? '9+' : ordersCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`
                text-[9px] font-medium mt-0.5 transition-all duration-200 truncate
                ${isActive ? 'font-bold' : ''}
              `}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AccountMobileNav;
