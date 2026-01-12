// components/account/AccountSidebar.tsx
// Desktop sidebar navigasyonu

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  Receipt,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  ExternalLink,
  User
} from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';

export type AccountView = 'overview' | 'orders' | 'addresses' | 'invoice' | 'loyalty' | 'settings' | 'help';

interface AccountSidebarProps {
  currentView: AccountView;
  onViewChange: (view: AccountView) => void;
  user: {
    displayName?: string;
    firstName?: string;
    email?: string;
    photoURL?: string;
  } | null;
  ordersCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: AccountView;
  icon: React.ElementType;
  label: string;
  badge?: number | string;
}

const mainNavItems: NavItem[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Genel Bakış' },
  { id: 'orders', icon: ShoppingBag, label: 'Siparişlerim' },
  { id: 'addresses', icon: MapPin, label: 'Adreslerim' },
  { id: 'invoice', icon: Receipt, label: 'Fatura Bilgileri' },
  { id: 'loyalty', icon: Award, label: 'Sadakat Programı' },
];

const secondaryNavItems: NavItem[] = [
  { id: 'settings', icon: Settings, label: 'Ayarlar' },
  { id: 'help', icon: HelpCircle, label: 'Yardım & Destek' },
];

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
  currentView,
  onViewChange,
  user,
  ordersCount,
  isDark,
  onToggleTheme,
  onLogout
}) => {
  const navigate = useNavigate();
  const displayName = user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'Kullanıcı';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-[calc(100vh-128px)] sticky top-32 bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-gray-800">
      {/* Kullanıcı Bilgileri */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-gold/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-100 dark:from-gold/30 dark:to-amber-900/20 flex items-center justify-center border-2 border-gold/20">
              <span className="text-lg font-bold text-gold">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white truncate">
              {displayName}
            </h3>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Ana Navigasyon */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const badge = item.id === 'orders' && ordersCount > 0 ? ordersCount : undefined;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                  ${isActive
                    ? 'bg-gold/10 text-gold border-l-4 border-gold -ml-[4px] pl-[calc(1rem+4px)]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-gold' : ''} />
                <span className="flex-1 font-medium text-sm">{item.label}</span>
                {badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-gold text-white rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Damak Tadı Quiz - External Link */}
        <div className="px-3 mt-2">
          <Link
            to="/tasting-quiz"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gold/5 hover:text-gold group"
          >
            <BrandIcon size={20} />
            <span className="flex-1 font-medium text-sm">Damak Tadı Quiz</span>
            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Ayırıcı */}
        <div className="my-4 mx-6 border-t border-gray-100 dark:border-gray-800" />

        {/* İkincil Navigasyon */}
        <div className="px-3 space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                  ${isActive
                    ? 'bg-gold/10 text-gold border-l-4 border-gold -ml-[4px] pl-[calc(1rem+4px)]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-gold' : ''} />
                <span className="flex-1 font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Alt Kısım - Tema & Çıkış */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        {/* Tema Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 transition-all"
        >
          {isDark ? <Sun size={20} className="text-gold" /> : <Moon size={20} />}
          <span className="flex-1 font-medium text-sm text-left">
            {isDark ? 'Aydınlık Mod' : 'Karanlık Mod'}
          </span>
        </button>

        {/* Çıkış */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
        >
          <LogOut size={20} />
          <span className="flex-1 font-medium text-sm text-left">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};

export default AccountSidebar;
