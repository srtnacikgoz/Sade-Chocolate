import React, { useState } from 'react';
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
  Truck,
  LayoutGrid,
  Candy,
  Shield,
  FileSpreadsheet,
  Percent,
  Megaphone
} from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';
import { toast } from 'sonner';

// Menu item type
type TabId = 'dashboard' | 'inventory' | 'operations' | 'cms' | 'ai' | 'scenarios' | 'analytics' | 'journey' | 'segments' | 'cohort' | 'reports' | 'email-automation' | 'customers' | 'badges' | 'loyalty-settings' | 'taste-quiz' | 'gift-notes' | 'referrals' | 'company-info' | 'box-config' | 'email-templates' | 'typography' | 'shipping' | 'catalog-settings' | 'bonbon-settings' | 'admin-management' | 'coupons' | 'meta-ads';

type MenuItem = {
  id: TabId;
  label: string;
  icon: React.ElementType;
  group: string;
};

type AdminSidebarProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  mobileSidebarOpen: boolean;
  onMobileSidebarToggle: () => void;
  pendingOrdersCount?: number;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, group: 'ana' },
  { id: 'inventory', label: 'Envanter', icon: Package, group: 'ana' },
  { id: 'operations', label: 'Sipariş Yönetimi', icon: ShoppingCart, group: 'ana' },
  { id: 'customers', label: 'Müşteriler', icon: Users, group: 'ana' },
  { id: 'referrals', label: 'Referanslar', icon: Gift, group: 'ana' },
  { id: 'coupons', label: 'Kuponlar', icon: Percent, group: 'ana' },
  { id: 'cms', label: 'İçerik (CMS)', icon: Globe, group: 'icerik' },
  { id: 'badges', label: 'Rozetler', icon: Tag, group: 'icerik' },
  { id: 'gift-notes', label: 'Hediye Notları', icon: Gift, group: 'icerik' },
  { id: 'email-templates', label: 'Email Şablonları', icon: Mail, group: 'icerik' },
  { id: 'ai', label: 'AI Sommelier', icon: BrandIcon, group: 'ai' },
  { id: 'scenarios', label: 'Senaryolar', icon: MessageSquare, group: 'ai' },
  { id: 'analytics', label: 'Konuşma Logları', icon: BarChart3, group: 'ai' },
  { id: 'journey', label: 'Yolculuk Takibi', icon: TrendingUp, group: 'analitik' },
  { id: 'segments', label: 'Müşteri Segmentleri', icon: Users, group: 'analitik' },
  { id: 'cohort', label: 'Cohort Analizi', icon: BarChart3, group: 'analitik' },
  { id: 'reports', label: 'Raporlar', icon: FileSpreadsheet, group: 'analitik' },
  { id: 'meta-ads', label: 'Meta & Reklam', icon: Megaphone, group: 'analitik' },
  { id: 'email-automation', label: 'Email Otomasyonu', icon: Mail, group: 'ai' },
  { id: 'taste-quiz', label: 'Damak Tadı', icon: Heart, group: 'analitik' },
  { id: 'loyalty-settings', label: 'Sadakat Sistemi', icon: Settings, group: 'ayarlar' },
  { id: 'company-info', label: 'Şirket Künyesi', icon: Building2, group: 'ayarlar' },
  { id: 'box-config', label: 'Kutu Oluşturucu', icon: Boxes, group: 'ayarlar' },
  { id: 'typography', label: 'Typography', icon: Type, group: 'ayarlar' },
  { id: 'shipping', label: 'Kargo Ayarları', icon: Truck, group: 'ayarlar' },
  { id: 'catalog-settings', label: 'Katalog Ayarları', icon: LayoutGrid, group: 'ayarlar' },
  { id: 'bonbon-settings', label: 'Bonbon Kartı', icon: Candy, group: 'ayarlar' },
  { id: 'admin-management', label: 'Admin Yönetimi', icon: Shield, group: 'ayarlar' },
];

const menuGroups: Record<string, string> = {
  ana: 'Ana İşlemler',
  icerik: 'İçerik Yönetimi',
  ai: 'AI & Otomasyon',
  analitik: 'Analitik',
  ayarlar: 'Ayarlar',
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
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-mustard/10 flex items-center justify-center">
            <span className="font-santana text-brand-mustard text-lg font-bold">S</span>
          </div>
          {(sidebarOpen || isMobile) && (
            <div>
              <h1 className="font-santana text-mocha-900 text-sm font-semibold tracking-wide">Sade Chocolate</h1>
              <p className="text-[10px] text-mocha-400 uppercase tracking-widest">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {Object.entries(menuGroups).map(([groupKey, groupLabel], groupIndex) => {
          const items = getGroupItems(groupKey);
          const isExpanded = expandedGroups[groupKey];

          return (
            <div key={groupKey} className="mb-1">
              {/* Section Label */}
              <button
                onClick={() => sidebarOpen || isMobile ? toggleGroup(groupKey) : null}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-150 group hover:bg-cream-50"
              >
                {(sidebarOpen || isMobile) && (
                  <>
                    <span className="text-xs font-medium uppercase tracking-wider text-mocha-400">
                      {groupLabel}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-mocha-400 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Group Items */}
              <div
                className="grid transition-[grid-template-rows] duration-150"
                style={{
                  gridTemplateRows: isExpanded && (sidebarOpen || isMobile) ? '1fr' : '0fr',
                }}
              >
                <div className="overflow-hidden">
                  <div className="space-y-0.5 pb-1">
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
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg
                            transition-colors duration-150
                            ${isActive
                              ? 'bg-brand-mustard/10 text-brand-mustard'
                              : 'text-mocha-600 hover:bg-cream-50 hover:text-mocha-900'
                            }
                          `}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-mustard' : 'text-mocha-400'}`} />
                          <span className={`text-sm flex-1 text-left ${isActive ? 'font-medium' : ''}`}>
                            {item.label}
                          </span>

                          {/* Sipariş badge */}
                          {item.id === 'operations' && pendingOrdersCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Divider */}
              {groupIndex < Object.keys(menuGroups).length - 1 && (sidebarOpen || isMobile) && (
                <div className="mx-3 my-1 h-px bg-cream-200" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-cream-200">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-mocha-600 hover:bg-cream-50 hover:text-mocha-900 transition-colors duration-150"
        >
          <Home className="w-4 h-4 text-mocha-400" />
          {(sidebarOpen || isMobile) && <span className="text-sm">Siteye Dön</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-mocha-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4 text-mocha-400" />
          {(sidebarOpen || isMobile) && <span className="text-sm">Çıkış Yap</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40
          bg-white border-r border-cream-200
          transition-[width] duration-200 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <button
          onClick={onSidebarToggle}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-white border border-cream-300 flex items-center justify-center text-mocha-500 hover:bg-cream-50 hover:text-mocha-900 transition-colors duration-150 shadow-sm z-50"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile Hamburger */}
      <button
        onClick={onMobileSidebarToggle}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-white border border-cream-200 flex items-center justify-center text-mocha-600 hover:bg-cream-50 transition-colors duration-150 shadow-sm"
      >
        {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 z-40 transition-opacity duration-200
          ${mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div className="absolute inset-0 bg-mocha-900/40" onClick={onMobileSidebarToggle} />
        <aside
          className={`
            absolute left-0 top-0 h-full w-72
            bg-white border-r border-cream-200
            transition-transform duration-200 ease-in-out
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <SidebarContent isMobile />
        </aside>
      </div>

      {/* Spacer */}
      <div className={`hidden lg:block flex-shrink-0 transition-[width] duration-200 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'}`} />
    </>
  );
};

export default AdminSidebar;
