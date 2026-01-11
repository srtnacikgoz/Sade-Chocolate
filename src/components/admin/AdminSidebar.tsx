import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  Gift,
  Globe,
  Tag,
  Mail,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Heart,
  Settings,
  Building2,
  Boxes,
  Type,
  ChevronDown,
  LogOut,
  Home,
  Menu,
  X,
  Sparkles,
  Truck,
  LayoutGrid
} from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';
import { toast } from 'sonner';

// Menu item type
type TabId = 'inventory' | 'operations' | 'cms' | 'ai' | 'scenarios' | 'analytics' | 'journey' | 'customers' | 'badges' | 'loyalty-settings' | 'taste-quiz' | 'gift-notes' | 'referrals' | 'company-info' | 'box-config' | 'email-templates' | 'typography' | 'shipping' | 'catalog-settings';

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  group: string;
}

interface AdminSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  mobileSidebarOpen: boolean;
  onMobileSidebarToggle: () => void;
  pendingOrdersCount?: number;
}

const menuItems: MenuItem[] = [
  { id: 'inventory', label: 'Envanter', icon: Package, group: 'ana' },
  { id: 'operations', label: 'Sipariş Yönetimi', icon: ShoppingCart, group: 'ana' },
  { id: 'customers', label: 'Müşteriler', icon: Users, group: 'ana' },
  { id: 'referrals', label: 'Referanslar', icon: Gift, group: 'ana' },
  { id: 'cms', label: 'İçerik (CMS)', icon: Globe, group: 'icerik' },
  { id: 'badges', label: 'Rozetler', icon: Tag, group: 'icerik' },
  { id: 'gift-notes', label: 'Hediye Notları', icon: Gift, group: 'icerik' },
  { id: 'email-templates', label: 'Email Şablonları', icon: Mail, group: 'icerik' },
  { id: 'ai', label: 'AI Sommelier', icon: BrandIcon, group: 'ai' },
  { id: 'scenarios', label: 'Senaryolar', icon: MessageSquare, group: 'ai' },
  { id: 'analytics', label: 'Konuşma Logları', icon: BarChart3, group: 'ai' },
  { id: 'journey', label: 'Yolculuk Takibi', icon: TrendingUp, group: 'analitik' },
  { id: 'taste-quiz', label: 'Damak Tadı', icon: Heart, group: 'analitik' },
  { id: 'loyalty-settings', label: 'Sadakat Sistemi', icon: Settings, group: 'ayarlar' },
  { id: 'company-info', label: 'Şirket Künyesi', icon: Building2, group: 'ayarlar' },
  { id: 'box-config', label: 'Kutu Oluşturucu', icon: Boxes, group: 'ayarlar' },
  { id: 'typography', label: 'Typography', icon: Type, group: 'ayarlar' },
  { id: 'shipping', label: 'Kargo Ayarları', icon: Truck, group: 'ayarlar' },
  { id: 'catalog-settings', label: 'Katalog Ayarları', icon: LayoutGrid, group: 'ayarlar' },
];

const menuGroups: Record<string, { label: string; icon: React.ElementType }> = {
  ana: { label: 'Ana İşlemler', icon: Sparkles },
  icerik: { label: 'İçerik Yönetimi', icon: Globe },
  ai: { label: 'AI & Otomasyon', icon: MessageSquare },
  analitik: { label: 'Analitik', icon: BarChart3 },
  ayarlar: { label: 'Ayarlar', icon: Settings },
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  sidebarOpen,
  onSidebarToggle,
  mobileSidebarOpen,
  onMobileSidebarToggle,
  pendingOrdersCount = 0,
}) => {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ana: true,
    icerik: true,
    ai: true,
    analitik: true,
    ayarlar: true,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    toast.success('Çıkış yapıldı');
    navigate('/');
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupItems = (group: string) => menuItems.filter(item => item.group === group);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header - Logo & Brand */}
      <div className={`relative px-6 pt-8 pb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {/* Decorative art deco corner */}
        <div className="absolute top-0 left-0 w-20 h-20 opacity-20">
          <svg viewBox="0 0 64 64" className="w-full h-full text-slate-900">
            <path d="M0 0 L64 0 L64 8 L8 8 L8 64 L0 64 Z" fill="currentColor" />
            <path d="M16 16 L48 16 L48 20 L20 20 L20 48 L16 48 Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
            <span className="font-santana text-slate-900 text-xl font-bold">S</span>
          </div>
          {(sidebarOpen || isMobile) && (
            <div className="overflow-hidden">
              <h1 className="font-santana text-slate-900 text-lg tracking-wide font-semibold">Sade Chocolate</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Decorative line */}
        <div className="mt-6 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 bg-slate-300" />
          <div className="h-px flex-1 bg-gradient-to-l from-slate-300 via-slate-200 to-transparent" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {Object.entries(menuGroups).map(([groupKey, group], groupIndex) => {
          const items = getGroupItems(groupKey);
          const isExpanded = expandedGroups[groupKey];
          const hasActiveItem = items.some(item => item.id === activeTab);
          const GroupIcon = group.icon;

          return (
            <div
              key={groupKey}
              className={`mb-1 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
              style={{ transitionDelay: `${groupIndex * 75}ms` }}
            >
              {/* Group Header */}
              <button
                onClick={() => sidebarOpen || isMobile ? toggleGroup(groupKey) : null}
                className={`
                  relative w-full flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1
                  transition-colors duration-200 group
                  ${hasActiveItem ? 'bg-slate-100' : 'hover:bg-slate-50'}
                `}
              >
                {/* Active group indicator */}
                {hasActiveItem && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-slate-900" />
                )}

                <GroupIcon className={`
                  w-4 h-4 transition-colors duration-200 flex-shrink-0
                  ${hasActiveItem ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}
                `} />

                {(sidebarOpen || isMobile) && (
                  <>
                    <span className={`
                      font-display text-xs uppercase tracking-wider flex-1 text-left
                      transition-colors duration-200
                      ${hasActiveItem ? 'text-slate-900 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}
                    `}>
                      {group.label}
                    </span>
                    <ChevronDown className={`
                      w-3.5 h-3.5 transition-transform duration-150 ease-in-out
                      ${hasActiveItem ? 'text-slate-900' : 'text-slate-500'}
                      ${isExpanded ? 'rotate-180' : 'rotate-0'}
                    `} />
                  </>
                )}
              </button>

              {/* Group Items - Grid-based smooth animation */}
              <div
                className="grid transition-[grid-template-rows] duration-150 ease-in-out"
                style={{
                  gridTemplateRows: isExpanded && (sidebarOpen || isMobile) ? '1fr' : '0fr',
                  willChange: 'grid-template-rows'
                }}
              >
                <div className="overflow-hidden">
                  <div className="pl-2 space-y-0.5 pb-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            if (isMobile) onMobileSidebarToggle();
                          }}
                          className={`
                            relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-colors duration-200 group
                            ${isActive
                              ? 'bg-slate-900 text-white'
                              : 'hover:bg-slate-50'
                            }
                          `}
                        >
                          {/* Active indicator dot */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white" />
                          )}

                          {/* Icon */}
                          <Icon className={`
                            w-4 h-4 transition-colors duration-200 flex-shrink-0
                            ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}
                          `} />

                          <span className={`
                            text-sm transition-colors duration-200 flex-1 text-left
                            ${isActive ? 'font-medium text-white' : 'text-slate-700 group-hover:text-slate-900'}
                          `}>
                            {item.label}
                          </span>

                          {/* Sipariş sayacı badge */}
                          {item.id === 'operations' && pendingOrdersCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                              {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Divider between groups */}
              {groupIndex < Object.keys(menuGroups).length - 1 && (sidebarOpen || isMobile) && (
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className={`
        px-3 py-4 border-t border-slate-200
        transition-all duration-500 delay-300
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* Home Link */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-200 group"
        >
          <Home className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors duration-200" />
          {(sidebarOpen || isMobile) && <span className="text-sm text-left">Siteye Dön</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 group"
        >
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-600 transition-colors duration-200" />
          {(sidebarOpen || isMobile) && <span className="text-sm text-left">Çıkış Yap</span>}
        </button>
      </div>

      {/* Decorative bottom corner */}
      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-20 rotate-180 pointer-events-none">
        <svg viewBox="0 0 64 64" className="w-full h-full text-slate-900">
          <path d="M0 0 L64 0 L64 8 L8 8 L8 64 L0 64 Z" fill="currentColor" />
          <path d="M16 16 L48 16 L48 20 L20 20 L20 48 L16 48 Z" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40
          bg-white
          border-r border-slate-200
          transition-[width] duration-200 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Toggle button */}
        <button
          onClick={onSidebarToggle}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-colors duration-150 shadow-md z-50"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ease-in-out ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
        </button>

        <SidebarContent />
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        onClick={onMobileSidebarToggle}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-400 transition-colors duration-200 shadow-md"
      >
        {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 z-40 transition-opacity duration-200
          ${mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-mocha-900/40 backdrop-blur-sm"
          onClick={onMobileSidebarToggle}
        />

        {/* Mobile Drawer */}
        <aside
          className={`
            absolute left-0 top-0 h-full w-72
            bg-white
            border-r border-slate-200
            transition-transform duration-200 ease-in-out
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <SidebarContent isMobile />
        </aside>
      </div>

      {/* Spacer for main content */}
      <div className={`hidden lg:block flex-shrink-0 transition-[width] duration-200 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'}`} />
    </>
  );
};

export default AdminSidebar;
