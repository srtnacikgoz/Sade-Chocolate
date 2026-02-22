import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';
import { Package, Save, Plus, ChevronDown, X, Shield } from 'lucide-react';
import { doc, onSnapshot, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { ProductForm } from '../components/admin/ProductForm';
import { InventoryTab } from '../components/admin/tabs/InventoryTab';
import { SommelierTab } from '../components/admin/tabs/SommelierTab';
import { ScenariosTab } from '../components/admin/tabs/ScenariosTab';
import { ConversationAnalyticsTab } from '../components/admin/tabs/ConversationAnalyticsTab';
import { BehaviorTrackingTab } from '../components/admin/tabs/BehaviorTrackingTab';
import { OrderManagementTab } from '../components/admin/tabs/OrderManagementTab';
import { LoyaltySettingsPanel } from '../components/admin/LoyaltySettingsPanel';
import { TasteQuizTab } from '../components/admin/tabs/TasteQuizTab';
import { GiftNotesTab } from '../components/admin/tabs/GiftNotesTab';
import { CompanyInfoTab } from '../components/admin/tabs/CompanyInfoTab';
import { BoxConfigTab } from '../components/admin/tabs/BoxConfigTab';
import { TypographyTab } from '../components/admin/tabs/TypographyTab';
import { EmailTemplatesTab } from '../components/admin/tabs/EmailTemplatesTab';
import { ReferralCampaignsTab } from '../components/admin/tabs/ReferralCampaignsTab';
import { ShippingSettingsTab } from '../components/admin/tabs/ShippingSettingsTab';
import { CatalogSettingsTab } from '../components/admin/tabs/CatalogSettingsTab';
import { BonbonSettingsTab } from '../components/admin/tabs/BonbonSettingsTab';
import { AdminManagementTab } from '../components/admin/tabs/AdminManagementTab';
import { CustomerSegmentsTab } from '../components/admin/tabs/CustomerSegmentsTab';
import { CohortAnalysisTab } from '../components/admin/tabs/CohortAnalysisTab';
import { DashboardTab } from '../components/admin/tabs/DashboardTab';
import { ReportsTab } from '../components/admin/tabs/ReportsTab';
import { EmailAutomationTab } from '../components/admin/tabs/EmailAutomationTab';
import { CouponManagementTab } from '../components/admin/tabs/CouponManagementTab';
import { CustomersTab } from '../components/admin/tabs/CustomersTab';
import { BadgesTab } from '../components/admin/tabs/BadgesTab';
import { CMSTab } from '../components/admin/tabs/CMSTab';
import { MetaAdsTab } from '../components/admin/tabs/MetaAdsTab';
import { Building2, Truck } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';

type TabId = 'inventory' | 'operations' | 'cms' | 'ai' | 'scenarios' | 'analytics' | 'journey' | 'customers' | 'badges' | 'loyalty-settings' | 'taste-quiz' | 'gift-notes' | 'referrals' | 'company-info' | 'box-config' | 'email-templates' | 'typography' | 'shipping' | 'catalog-settings' | 'bonbon-settings' | 'admin-management' | 'coupons' | 'meta-ads';

type ProductType = 'tablet' | 'box' | 'other';

const menuItems = [
  { id: 'inventory', label: 'Envanter' },
  { id: 'operations', label: 'Sipariş Yönetimi' },
  { id: 'customers', label: 'Müşteriler' },
  { id: 'referrals', label: 'Referanslar' },
  { id: 'coupons', label: 'Kuponlar' },
  { id: 'cms', label: 'İçerik (CMS)' },
  { id: 'badges', label: 'Rozetler' },
  { id: 'gift-notes', label: 'Hediye Notları' },
  { id: 'email-templates', label: 'Email Şablonları' },
  { id: 'ai', label: 'AI Sommelier' },
  { id: 'scenarios', label: 'Senaryolar' },
  { id: 'analytics', label: 'Konuşma Logları' },
  { id: 'journey', label: 'Yolculuk Takibi' },
  { id: 'meta-ads', label: 'Meta & Reklam' },
  { id: 'taste-quiz', label: 'Damak Tadı' },
  { id: 'loyalty-settings', label: 'Sadakat Sistemi' },
  { id: 'company-info', label: 'Şirket Künyesi' },
  { id: 'box-config', label: 'Kutu Oluşturucu' },
  { id: 'typography', label: 'Typography' },
  { id: 'shipping', label: 'Kargo Ayarları' },
  { id: 'catalog-settings', label: 'Katalog Ayarları' },
  { id: 'bonbon-settings', label: 'Bonbon Kartı' },
  { id: 'admin-management', label: 'Admin Yönetimi' },
] as const;

export const Admin = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();

  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductDropdownOpen, setIsNewProductDropdownOpen] = useState(false);
  const newProductDropdownRef = React.useRef<HTMLDivElement>(null);

  // AI config (geçirilen prop olarak)
  const [aiConfig, setAiConfig] = useState<any>({
    enabled: true,
    persona: {
      tone: 'friendly',
      greeting: '',
      expertise: `Sen Sade Chocolate'ın kurumsal hafızası ve sommelier'isin. Ses tonun, Playfair Display fontunun zarafetini ve krem tonlarının sıcaklığını taşımalı. Müşteriye bir 'tüketici' gibi değil, bir 'koleksiyoner' gibi davran.`
    },
    questions: [],
    rules: []
  });

  // Admin Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await getIdTokenResult(user, true);
          if (idTokenResult.claims.admin === true) {
            setIsAdminVerified(true);
          } else {
            toast.error('Admin yetkisi bulunamadı');
            navigate('/');
          }
        } catch (error) {
          console.error('Admin verification error:', error);
          toast.error('Yetkilendirme hatası');
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newProductDropdownRef.current && !newProductDropdownRef.current.contains(event.target as Node)) {
        setIsNewProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bakım modu
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_settings', 'maintenance'), (docSnap) => {
      if (docSnap.exists()) setMaintenanceMode(docSnap.data()?.enabled === true);
    });
    return () => unsub();
  }, []);

  // AI config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'ai'), (d) => {
      if (d.exists()) setAiConfig(d.data());
    });
    return () => unsub();
  }, []);

  // Siparişler (badge sayacı için)
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Sipariş verileri yüklenemedi:', error);
    });
    return () => unsub();
  }, []);

  const toggleMaintenanceMode = async () => {
    try {
      await setDoc(doc(db, 'site_settings', 'maintenance'), { enabled: !maintenanceMode }, { merge: true });
      toast.success(maintenanceMode ? 'Bakım modu kapatıldı' : 'Bakım modu açıldı');
    } catch {
      toast.error('Bakım modu değiştirilemedi');
    }
  };

  const validateAIConfig = (config: any) => {
    const dangerousPatterns = [/ignore previous instructions/i, /system:/i, /role:/i, /<script>/i];
    const textFields = [config.persona.greeting, config.persona.expertise, ...(config.questions || []).map((q: any) => q.text)].join(' ');
    for (const pattern of dangerousPatterns) {
      if (pattern.test(textFields)) throw new Error('Güvenlik riski tespit edildi');
    }
    return true;
  };

  const handleAiSave = async () => {
    try {
      validateAIConfig(aiConfig);
      await setDoc(doc(db, 'settings', 'ai'), aiConfig, { merge: true });
      toast.success('AI Sommelier güncellendi');
    } catch (err: any) {
      toast.error(err.message || 'Kaydedilemedi');
    }
  };

  // Auth kontrol ekranı
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-brand-mustard/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield size={28} className="text-brand-mustard" />
          </div>
          <p className="text-mocha-500 text-sm">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAdminVerified) return null;

  if (loading) return (
    <main className="max-w-7xl mx-auto px-8 pt-32 animate-pulse space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="bg-white h-28 rounded-xl border border-cream-200" />)}
      </div>
      <div className="bg-white h-16 rounded-xl border border-cream-200" />
      <div className="bg-white h-64 rounded-xl border border-cream-200" />
    </main>
  );

  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  const newProductCategories = [
    { id: 'tablet', label: 'Tablet', icon: '▬', description: 'Tablet çikolata', productType: 'tablet' as ProductType },
    { id: 'truffle', label: 'Truffle', icon: '🍫', description: 'Dolgulu çikolata', productType: 'other' as ProductType },
    { id: 'gift-box', label: 'Kutu', icon: '🎁', description: 'Hediye kutusu', productType: 'box' as ProductType },
    { id: 'other', label: 'Diğer', icon: '📦', description: 'Diğer ürünler', productType: 'other' as ProductType }
  ];

  return (
    <div className="flex min-h-screen bg-cream-50">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileSidebarToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        pendingOrdersCount={orders.length}
      />

      <main className="flex-1 transition-all duration-200 lg:ml-0">
        {/* Header */}
        <div className="bg-white border-b border-cream-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-mocha-900">{activeMenuItem?.label || 'Admin'}</h1>
              <p className="text-xs text-mocha-400 mt-0.5">Sade Chocolate Yönetim Paneli</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Bakım Modu */}
              <button
                onClick={toggleMaintenanceMode}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  maintenanceMode
                    ? 'bg-brand-peach/10 text-brand-orange border border-brand-orange/20'
                    : 'bg-cream-100 text-mocha-500 hover:bg-cream-200'
                }`}
              >
                {maintenanceMode ? 'Bakımdayız' : 'Bakım'}
              </button>

              {/* Yeni Ürün (Envanter tab) */}
              {activeTab === 'inventory' && (
                <div className="relative" ref={newProductDropdownRef}>
                  <Button
                    onClick={() => setIsNewProductDropdownOpen(!isNewProductDropdownOpen)}
                    className="bg-mocha-900 text-white gap-1.5 text-sm font-medium px-4 py-2 rounded-lg hover:bg-mocha-900/90 transition-colors"
                  >
                    <Plus size={16} /> Yeni Ürün
                    <ChevronDown size={14} className={`transition-transform duration-150 ${isNewProductDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {isNewProductDropdownOpen && (
                    <div className="absolute top-full mt-1 right-0 w-52 bg-white rounded-xl shadow-lg border border-cream-200 overflow-hidden z-50">
                      {newProductCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            const defaultProduct: Partial<Product> = {
                              id: '', title: '', price: 0, currency: '₺',
                              category: category.id === 'other' ? PRODUCT_CATEGORIES[0].id : category.id,
                              origin: '', image: '', video: '', description: '', detailedDescription: '',
                              tastingNotes: '', ingredients: '', allergens: '', isOutOfStock: false,
                              locationStock: { yesilbahce: 0 }, boxItems: [], images: [],
                              productType: category.productType, showSensory: true, attributes: [],
                              nutritionalValues: '', valueBadges: [],
                              sensory: { intensity: 50, sweetness: 50, creaminess: 50, fruitiness: 0, acidity: 0, crunch: 0 },
                              isBoxContent: false, boxContentIds: [], boxSize: 4
                            };
                            setEditingProduct(defaultProduct as Product);
                            setIsFormOpen(true);
                            setIsNewProductDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-cream-50 transition-colors duration-150 flex items-center gap-3 border-b last:border-b-0 border-cream-100"
                        >
                          <span className="text-lg">{category.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-mocha-900">{category.label}</div>
                            <div className="text-xs text-mocha-400">{category.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Kaydet (CMS, AI, vb.) */}
              {(activeTab === 'ai' || activeTab === 'gift-notes' || activeTab === 'taste-quiz' || activeTab === 'loyalty-settings') && (
                <button
                  onClick={activeTab === 'ai' ? handleAiSave : undefined}
                  className="flex items-center gap-1.5 bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors"
                >
                  <Save size={16} />
                  Kaydet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'inventory' ? (
            <InventoryTab
              products={products}
              updateProduct={updateProduct}
              deleteProduct={deleteProduct}
              setEditingProduct={setEditingProduct}
              setIsFormOpen={setIsFormOpen}
            />
          ) : activeTab === 'operations' ? (
            <OrderManagementTab />
          ) : activeTab === 'cms' ? (
            <CMSTab onSave={() => {}} />
          ) : activeTab === 'customers' ? (
            <CustomersTab />
          ) : activeTab === 'badges' ? (
            <BadgesTab />
          ) : activeTab === 'ai' ? (
            <SommelierTab aiConfig={aiConfig} setAiConfig={setAiConfig} />
          ) : activeTab === 'scenarios' ? (
            <ScenariosTab />
          ) : activeTab === 'analytics' ? (
            <ConversationAnalyticsTab />
          ) : activeTab === 'dashboard' ? (
            <DashboardTab />
          ) : activeTab === 'journey' ? (
            <BehaviorTrackingTab />
          ) : activeTab === 'segments' ? (
            <CustomerSegmentsTab />
          ) : activeTab === 'cohort' ? (
            <CohortAnalysisTab />
          ) : activeTab === 'reports' ? (
            <ReportsTab />
          ) : activeTab === 'email-automation' ? (
            <EmailAutomationTab />
          ) : activeTab === 'referrals' ? (
            <ReferralCampaignsTab />
          ) : activeTab === 'loyalty-settings' ? (
            <LoyaltySettingsPanel />
          ) : activeTab === 'taste-quiz' ? (
            <TasteQuizTab />
          ) : activeTab === 'gift-notes' ? (
            <GiftNotesTab />
          ) : activeTab === 'company-info' ? (
            <CompanyInfoTab />
          ) : activeTab === 'box-config' ? (
            <BoxConfigTab />
          ) : activeTab === 'typography' ? (
            <TypographyTab />
          ) : activeTab === 'email-templates' ? (
            <EmailTemplatesTab />
          ) : activeTab === 'shipping' ? (
            <ShippingSettingsTab />
          ) : activeTab === 'catalog-settings' ? (
            <CatalogSettingsTab />
          ) : activeTab === 'bonbon-settings' ? (
            <BonbonSettingsTab />
          ) : activeTab === 'coupons' ? (
            <CouponManagementTab />
          ) : activeTab === 'admin-management' ? (
            <AdminManagementTab />
          ) : activeTab === 'meta-ads' ? (
            <MetaAdsTab />
          ) : null}
        </div>
      </main>

      {/* Ürün Ekleme/Düzenleme Modalı */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60">
          <div className="bg-white w-full h-full shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-cream-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-mocha-900">
                  {editingProduct?.id ? 'Ürünü Düzenle' : 'Yeni Ürün'}
                </h2>
                <p className="text-xs text-mocha-400 mt-0.5">Ürün bilgilerini düzenleyin</p>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}
                className="w-10 h-10 flex items-center justify-center hover:bg-cream-100 rounded-lg text-mocha-400 hover:text-red-500 transition-colors duration-150"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductForm
                product={editingProduct}
                onSave={async (data) => {
                  try {
                    if (editingProduct?.id) await updateProduct(editingProduct.id, data);
                    else await addProduct(data);
                    setIsFormOpen(false);
                    setEditingProduct(null);
                    toast.success('Başarılı');
                  } catch {
                    toast.error('Hata oluştu');
                  }
                }}
                onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
