import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';
import { Package, Type, Save, Globe, X, Users, Mail, Calendar, Filter, Tag, Eye, EyeOff, Info, Lightbulb, ChevronDown, Plus, ShoppingCart, TrendingUp, AlertTriangle, LayoutGrid, Search, Edit3, Trash2, Minus, LogOut, Sparkles, Menu, Home, MessageSquare, BarChart3, Heart, Gift, Settings, ChevronLeft, Boxes } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { doc, onSnapshot, setDoc, collection, getDocs, query, orderBy, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { ProductForm } from '../components/admin/ProductForm';
import { ImageUpload } from '../components/admin/ImageUpload';
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
import { Building2 } from 'lucide-react';

export const Admin = () => {
  const navigate = useNavigate();

  // 🔐 Admin Authentication Check
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (isAuthenticated !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  // 🚪 Logout Handler
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    toast.success('Çıkış yapıldı');
    navigate('/');
  };

  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const [activeTab, setActiveTab] = useState<'inventory' | 'operations' | 'cms' | 'ai' | 'scenarios' | 'analytics' | 'journey' | 'customers' | 'badges' | 'loyalty-settings' | 'taste-quiz' | 'gift-notes' | 'referrals' | 'company-info' | 'box-config'>('inventory');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cmsPage, setCmsPage] = useState<'home' | 'about' | 'legal'>('home');
  const [aiConfig, setAiConfig] = useState<any>({
    enabled: true, // AI Sommelier aktif/deaktif durumu
    persona: {
      tone: 'friendly',
      greeting: '',
      expertise: `Sen Sade Chocolate'ın kurumsal hafızası ve sommelier'isin. Ses tonun, Playfair Display fontunun zarafetini ve krem tonlarının sıcaklığını taşımalı. Müşteriye bir 'tüketici' gibi değil, bir 'koleksiyoner' gibi davran. Veritabanındaki sensory verilerini kullanarak bilimsel ama şiirsel eşleşmeler yap.

EĞER KULLANICI HEDİYE GÖNDERİYORSA, ana rolün lojistik zekasına sahip bir 'Hediye Asistanı'na ve editoryal yeteneği olan bir 'Duygu Küratörü'ne dönüşür. Bu modda önceliklerin şunlardır:
1.  **Lojistik Zeka:** Teslimat adresindeki hava durumunu kontrol et. Gerekirse, müşteriyi gönderim güvenliği (fiyat gizliliği, buz aküsü vb.) konusunda proaktif olarak rahatlat.
2.  **Duygu Küratörlüğü:** Müşteri hediye notu yazmak istediğinde, ona Sade Chocolate editoryal standartlarında 3 farklı üslup (Minimalist, Şiirsel, Duyusal) öner. Notları oluştururken seçilen ürünün tadım notlarından (meyvemsi, odunsu vb.) ve duyusal profilinden ilham al. El yazısı veya kaligrafi seçenekleri sunma; sadece markanın 'Sıcak Minimalizm' anlayışını yansıtan, duygusal derinliği olan dijital metin taslakları üret.

Genel üslubun daima nazik, çözüm odaklı ve profesyonel olmalıdır.`
    },
    questions: [],
    rules: []
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [cmsData, setCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [aboutCmsData, setAboutCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [legalCmsData, setLegalCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [customers, setCustomers] = useState<any[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [filterByNewsletter, setFilterByNewsletter] = useState<'all' | 'subscribed' | 'not-subscribed' | 'vip' | 'new'>('all');
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [isAddingBadge, setIsAddingBadge] = useState(false);
  const [isBadgeInfoOpen, setIsBadgeInfoOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newBadge, setNewBadge] = useState<any>({
    name: { tr: '', en: '', ru: '' },
    bgColor: '#1a1a1a',
    textColor: '#ffffff',
    icon: '',
    active: true,
    priority: 1
  });

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };

  // Sidebar Menü Yapılandırması
  const menuItems = [
    { id: 'inventory', label: 'Envanter', icon: Package, group: 'ana' },
    { id: 'operations', label: 'Sipariş Yönetimi', icon: ShoppingCart, group: 'ana' },
    { id: 'customers', label: 'Müşteriler', icon: Users, group: 'ana' },
    { id: 'referrals', label: 'Referanslar', icon: Gift, group: 'ana' },
    { id: 'cms', label: 'İçerik (CMS)', icon: Globe, group: 'icerik' },
    { id: 'badges', label: 'Rozetler', icon: Tag, group: 'icerik' },
    { id: 'gift-notes', label: 'Hediye Notları', icon: Gift, group: 'icerik' },
    { id: 'ai', label: 'AI Sommelier', icon: Sparkles, group: 'ai' },
    { id: 'scenarios', label: 'Senaryolar', icon: MessageSquare, group: 'ai' },
    { id: 'analytics', label: 'Konuşma Logları', icon: BarChart3, group: 'ai' },
    { id: 'journey', label: 'Yolculuk Takibi', icon: TrendingUp, group: 'analitik' },
    { id: 'taste-quiz', label: 'Damak Tadı', icon: Heart, group: 'analitik' },
    { id: 'loyalty-settings', label: 'Sadakat Sistemi', icon: Settings, group: 'ayarlar' },
    { id: 'company-info', label: 'Şirket Künyesi', icon: Building2, group: 'ayarlar' },
    { id: 'box-config', label: 'Kutu Oluşturucu', icon: Boxes, group: 'ayarlar' },
  ] as const;

  const menuGroups = {
    ana: 'Ana İşlemler',
    icerik: 'İçerik Yönetimi',
    ai: 'AI & Otomasyon',
    analitik: 'Analitik',
    ayarlar: 'Ayarlar',
  };

  // Site İçeriği (CMS) Snapshot - Home
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'home'), (doc) => {
      if (doc.exists()) setCmsData(doc.data());
    });
    return () => unsub();
  }, []);

  // Site İçeriği (CMS) Snapshot - About
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'about'), (doc) => {
      if (doc.exists()) setAboutCmsData(doc.data());
    });
    return () => unsub();
  }, []);

  // Site İçeriği (CMS) Snapshot - Legal
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'legal'), (doc) => {
      if (doc.exists()) setLegalCmsData(doc.data());
    });
    return () => unsub();
  }, []);

  // AI Konfigürasyon Snapshot
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'ai'), (doc) => {
      if (doc.exists()) {
        setAiConfig(doc.data());
      }
    });
    return () => unsub();
  }, []);

  // Müşteri Verileri Snapshot
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const customerData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customerData);
      } catch (error) {
        console.error('Müşteri verileri yüklenemedi:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Bülten Aboneleri Snapshot
  useEffect(() => {
    const fetchNewsletterSubscribers = async () => {
      try {
        const q = query(collection(db, 'newsletter_subscribers'), orderBy('subscribedAt', 'desc'));
        const snapshot = await getDocs(q);
        const subscriberData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setNewsletterSubscribers(subscriberData);
      } catch (error) {
        console.error('Bülten verileri yüklenemedi:', error);
      }
    };

    fetchNewsletterSubscribers();
  }, []);

  // Referans Bonusları Snapshot
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const q = query(collection(db, 'referral_bonuses'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const referralData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setReferrals(referralData);
      } catch (error) {
        console.error('Referans verileri yüklenemedi:', error);
      }
    };

    fetchReferrals();
  }, []);

  // Birleştirilmiş Müşteri Listesi (users + newsletter_subscribers)
  const allCustomers = useMemo(() => {
    // Önce tüm users'ı al
    const customerEmails = new Set(customers.map((c: any) => c.email));

    // Newsletter'a abone olup users'da olmayan kişileri bul
    const newsletterOnlySubscribers = newsletterSubscribers
      .filter((sub: any) => !customerEmails.has(sub.email))
      .map((sub: any) => ({
        id: sub.id,
        email: sub.email,
        displayName: null, // Newsletter'dan sadece email gelir
        photoURL: null,
        createdAt: sub.subscribedAt, // Kayıt tarihi olarak abone olma tarihini kullan
        source: 'newsletter' // Bu kişinin nereden geldiğini işaretle
      }));

    // İki listeyi birleştir
    return [...customers, ...newsletterOnlySubscribers];
  }, [customers, newsletterSubscribers]);

  // Product Badges Snapshot
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
        const snapshot = await getDocs(q);
        const badgeData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setBadges(badgeData);
      } catch (error) {
        console.error('Badge verileri yüklenemedi:', error);
      }
    };

    fetchBadges();
  }, []);

  // Orders Snapshot
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderData);
    }, (error) => {
      console.error('Sipariş verileri yüklenemedi:', error);
    });

    return () => unsub();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success('Sipariş durumu güncellendi');
    } catch (error) {
      console.error('Sipariş durumu güncellenemedi:', error);
      toast.error('Sipariş durumu güncellenemedi');
    }
  };

  const handleCustomerUpdate = async () => {
    if (!editingCustomer) return;

    try {
      await updateDoc(doc(db, 'users', editingCustomer.id), {
        displayName: editingCustomer.displayName,
        updatedAt: serverTimestamp()
      });
      toast.success('Müşteri bilgileri güncellendi');
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Müşteri güncellenemedi:', error);
      toast.error('Müşteri güncellenemedi');
    }
  };

  const handleCmsSave = async () => {
    try {
      if (cmsPage === 'home') {
        await setDoc(doc(db, 'site_content', 'home'), cmsData, { merge: true });
      } else if (cmsPage === 'about') {
        await setDoc(doc(db, 'site_content', 'about'), aboutCmsData, { merge: true });
      } else if (cmsPage === 'legal') {
        await setDoc(doc(db, 'site_content', 'legal'), legalCmsData, { merge: true });
      }
      toast.success("Yayına alındı! 🎉");
    } catch (err) {
      toast.error("Kaydedilemedi.");
    }
  };

  const validateAIConfig = (config: any) => {
    const dangerousPatterns = [/ignore previous instructions/i, /system:/i, /role:/i, /<script>/i];
    const textFields = [
      config.persona.greeting,
      config.persona.expertise,
      ...(config.questions || []).map((q: any) => q.text)
    ].join(' ');

    for (const pattern of dangerousPatterns) {
      if (pattern.test(textFields)) throw new Error('Güvenlik riski tespit edildi! Lütfen sistem komutları kullanmayın.');
    }
    return true;
  };

  const handleAiSave = async () => {
    try {
      validateAIConfig(aiConfig);
      await setDoc(doc(db, 'settings', 'ai'), aiConfig, { merge: true });
      toast.success("AI Sommelier eğitildi ve yayına alındı! 🧠");
    } catch (err: any) {
      toast.error(err.message || "Kaydedilemedi.");
    }
  };

  const handleAddExampleBadges = async () => {
    try {
      const exampleBadges = [
        { name: { tr: 'YENİ', en: 'NEW', ru: 'НОВИНКА' }, bgColor: '#D4AF37', textColor: '#000000', priority: 1 },
        { name: { tr: 'RAMAZAN ÖZEL', en: 'RAMADAN SPECIAL', ru: 'РАМАДАН СПЕЦИАЛЬНЫЙ' }, bgColor: '#059669', textColor: '#FFFFFF', priority: 2 },
        { name: { tr: 'SINIRLI ÜRETİM', en: 'LIMITED EDITION', ru: 'ОГРАНИЧЕННАЯ СЕРИЯ' }, bgColor: '#1a1a1a', textColor: '#D4AF37', priority: 3 },
        { name: { tr: 'BESTSELLER', en: 'BESTSELLER', ru: 'БЕСТСЕЛЛЕР' }, bgColor: '#78350f', textColor: '#FFFFFF', priority: 4 },
        { name: { tr: 'İNDİRİM', en: 'SALE', ru: 'СКИДКА' }, bgColor: '#dc2626', textColor: '#FFFFFF', priority: 5 },
        { name: { tr: 'SON FIRSAT', en: 'LAST CHANCE', ru: 'ПОСЛЕДНИЙ ШАНС' }, bgColor: '#ea580c', textColor: '#FFFFFF', priority: 6 },
        { name: { tr: 'VEGAN', en: 'VEGAN', ru: 'ВЕГАН' }, bgColor: '#16a34a', textColor: '#FFFFFF', priority: 7 },
        { name: { tr: 'SEVGİLİLER GÜNÜ', en: 'VALENTINE\'S DAY', ru: 'ДЕНЬ СВЯТОГО ВАЛЕНТИНА' }, bgColor: '#ec4899', textColor: '#FFFFFF', priority: 8 },
        { name: { tr: 'ORGANİK', en: 'ORGANIC', ru: 'ОРГАНИЧЕСКИЙ' }, bgColor: '#2563eb', textColor: '#FFFFFF', priority: 9 },
        { name: { tr: 'EL YAPIMI', en: 'HANDMADE', ru: 'РУЧНАЯ РАБОТА' }, bgColor: '#9333ea', textColor: '#FFFFFF', priority: 10 }
      ];

      for (const badge of exampleBadges) {
        await addDoc(collection(db, 'product_badges'), {
          ...badge,
          icon: '',
          active: true,
          createdAt: serverTimestamp()
        });
      }

      toast.success('10 örnek rozet başarıyla eklendi! 🎉');

      // Refresh badges
      const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const badgeData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setBadges(badgeData);
    } catch (error: any) {
      toast.error('Rozetler eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleAddBadge = async () => {
    try {
      if (!newBadge.name.tr || !newBadge.name.en || !newBadge.name.ru) {
        toast.error('Tüm dillerde isim girmelisiniz!');
        return;
      }
      await addDoc(collection(db, 'product_badges'), {
        ...newBadge,
        createdAt: serverTimestamp()
      });
      toast.success('Badge oluşturuldu! 🏷️');
      setNewBadge({
        name: { tr: '', en: '', ru: '' },
        bgColor: '#1a1a1a',
        textColor: '#ffffff',
        icon: '',
        active: true,
        priority: badges.length + 1
      });
      setIsAddingBadge(false);
      // Refresh badges
      const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const badgeData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setBadges(badgeData);
    } catch (error) {
      toast.error('Badge eklenemedi.');
      console.error(error);
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    try {
      await deleteDoc(doc(db, 'product_badges', badgeId));
      toast.success('Badge silindi!');
      // Refresh badges
      const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const badgeData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setBadges(badgeData);
    } catch (error) {
      toast.error('Badge silinemedi.');
      console.error(error);
    }
  };

  const handleToggleBadgeActive = async (badgeId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'product_badges', badgeId), { active: !currentStatus });
      toast.success(currentStatus ? 'Badge devre dışı!' : 'Badge aktif!');
      // Refresh badges
      const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      const badgeData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setBadges(badgeData);
    } catch (error) {
      toast.error('Durum değiştirilemedi.');
      console.error(error);
    }
  };


  if (loading) return (
    <main className="max-w-7xl mx-auto px-8 pt-32 animate-pulse space-y-8">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white h-36 rounded-[32px] border" />
        <div className="bg-white h-36 rounded-[32px] border" />
        <div className="bg-white h-36 rounded-[32px] border" />
        <div className="bg-white h-36 rounded-[32px] border" />
      </div>
      <div className="bg-white h-20 rounded-[32px] border" />
      <div className="bg-white h-64 rounded-[40px] border" />
    </main>
  );

  // Aktif menü öğesini bul
  const activeMenuItem = menuItems.find(item => item.id === activeTab);
  const ActiveIcon = activeMenuItem?.icon || Package;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-slate-900 to-slate-800
        transition-all duration-300 ease-in-out
        flex flex-col shadow-2xl
      `}>
        {/* Logo & Collapse */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
                  <span className="text-xl">🍫</span>
                </div>
                <div>
                  <h1 className="font-display text-white font-bold text-lg italic">Sade</h1>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest">Admin Panel</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <ChevronLeft size={20} className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* Mobile close */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {Object.entries(menuGroups).map(([groupKey, groupLabel]) => {
            const groupItems = menuItems.filter(item => item.group === groupKey);
            if (groupItems.length === 0) return null;

            return (
              <div key={groupKey}>
                {sidebarOpen && (
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                    {groupLabel}
                  </p>
                )}
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                          ${isActive
                            ? 'bg-gold text-slate-900 shadow-lg shadow-gold/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon size={20} className={isActive ? 'text-slate-900' : ''} />
                        {sidebarOpen && (
                          <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                            {item.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => navigate('/home')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Ana Sayfaya Dön</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <ActiveIcon size={20} className="text-gold" />
            <span className="font-bold text-slate-800">{activeMenuItem?.label}</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 text-gold rounded-2xl">
                <ActiveIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-800">{activeMenuItem?.label || 'Komuta Merkezi'}</h1>
                <p className="text-sm text-slate-400">Sade Chocolate Yönetim Paneli</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {activeTab === 'inventory' && (
                <Button
                  onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
                  className="bg-slate-900 text-white gap-2 text-sm font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-black transition-all"
                >
                  <Plus size={18} /> Yeni Ürün
                </Button>
              )}
              {(activeTab === 'cms' || activeTab === 'ai' || activeTab === 'gift-notes' || activeTab === 'taste-quiz' || activeTab === 'loyalty-settings') && (
                <button
                  onClick={activeTab === 'ai' ? handleAiSave : handleCmsSave}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all"
                >
                  <Save size={18} />
                  <span className="text-sm font-bold">Kaydet</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-8">
          {/* --- ANA İÇERİK ALANI --- */}
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
        <div className="space-y-8 animate-in slide-in-from-bottom-3 duration-700">
        {/* Sayfa Seçici */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setCmsPage('home')}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${cmsPage === 'home' ? 'bg-brown-900 text-white shadow-xl' : 'bg-white dark:bg-dark-800 text-gray-400 hover:bg-gray-50'}`}
          >
            <span className="material-icons-outlined text-lg mr-2 align-middle">home</span>
            Ana Sayfa
          </button>
          <button
            onClick={() => setCmsPage('about')}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${cmsPage === 'about' ? 'bg-brown-900 text-white shadow-xl' : 'bg-white dark:bg-dark-800 text-gray-400 hover:bg-gray-50'}`}
          >
            <span className="material-icons-outlined text-lg mr-2 align-middle">info</span>
            Hakkımızda
          </button>
          <button
            onClick={() => setCmsPage('legal')}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${cmsPage === 'legal' ? 'bg-brown-900 text-white shadow-xl' : 'bg-white dark:bg-dark-800 text-gray-400 hover:bg-gray-50'}`}
          >
            <span className="material-icons-outlined text-lg mr-2 align-middle">gavel</span>
            Yasal Metinler
          </button>
        </div>

        {cmsPage === 'home' ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['tr', 'en', 'ru'].map((lang) => (
            <div key={lang} className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className={`p-3.5 rounded-2xl ${lang === 'tr' ? 'bg-red-50 text-red-600' : lang === 'en' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}><Globe size={26} /></div>
                <span className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{lang === 'tr' ? 'Türkçe (TR)' : lang === 'en' ? 'English (EN)' : 'Russian (RU)'}</span>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUpload
                    value={cmsData?.[lang]?.hero_image_desktop || ''}
                    onChange={(url) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_image_desktop: url } })}
                    onFocalPointChange={(point) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_focal_point_desktop: point } })}
                    focalPoint={cmsData?.[lang]?.hero_focal_point_desktop || { x: 50, y: 50 }}
                    label="Hero Görseli (Desktop)"
                    folder="hero-images/desktop"
                    showFocalPoint={true}
                  />
                  <ImageUpload
                    value={cmsData?.[lang]?.hero_image_mobile || ''}
                    onChange={(url) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_image_mobile: url } })}
                    onFocalPointChange={(point) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_focal_point_mobile: point } })}
                    focalPoint={cmsData?.[lang]?.hero_focal_point_mobile || { x: 50, y: 50 }}
                    label="Hero Görseli (Mobil)"
                    folder="hero-images/mobile"
                    showFocalPoint={true}
                  />
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">İpucu</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        <strong>Desktop:</strong> Yatay format (örn: 1920x1080) • <strong>Mobil:</strong> Dikey veya kare format (örn: 1080x1920 veya 1080x1080).
                        Farklı görseller kullanarak her ekran boyutunda mükemmel görünüm sağlayın.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hero Başlık</label>
                  <textarea value={cmsData?.[lang]?.hero_title || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-base font-display font-medium italic focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={3} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hero Alt Başlık</label>
                  <input type="text" value={cmsData?.[lang]?.hero_subtitle || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_subtitle: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-xs font-sans uppercase tracking-widest focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">"Sade'nin Sırrı" Başlığı</label>
                  <input type="text" value={cmsData?.[lang]?.secret_title || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], secret_title: e.target.value } })} placeholder="Örn: Sade'nin Sırrı" className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">"Sade'nin Sırrı" Alıntı</label>
                  <textarea value={cmsData?.[lang]?.secret_quote || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], secret_quote: e.target.value } })} placeholder="Örn: Minimalizm, lezzetin en saf halidir." className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-base font-display italic focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={3} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">"Sade'nin Sırrı" Açıklama</label>
                  <textarea value={cmsData?.[lang]?.secret_desc || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], secret_desc: e.target.value } })} placeholder="Felsefe ve yaklaşım..." className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm font-serif italic leading-relaxed focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={4} />
                <div className="mt-8">
  <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">Katalog Hızlı Etiketleri (Virgülle Ayır)</label>
  <input 
    type="text" 
    placeholder="Örn: Yoğun Bitter, İpeksi Beyaz, Vegan Dostu"
    value={cmsData?.[lang]?.featured_tags || ''} 
    onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], featured_tags: e.target.value } })} 
    className="w-full bg-white dark:bg-dark-900 border border-gold/20 rounded-[20px] p-4 text-[11px] font-bold focus:ring-2 focus:ring-gold/20 outline-none text-gray-900 dark:text-white" 
  />
</div>
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-dark-700">
  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Üst Duyuru Barı (Top Bar)</label>
  <div className="bg-emerald-50/30 dark:bg-emerald-900/10 p-6 rounded-[24px] border border-emerald-100 dark:border-emerald-900/20">
    <input 
      type="text" 
      placeholder="Örn: 1500 TL Üzeri Ücretsiz Kargo"
      value={cmsData?.[lang]?.top_bar_message || ''} 
      onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_message: e.target.value } })} 
      className="w-full bg-transparent border-none p-0 text-sm font-bold tracking-tight focus:ring-0 outline-none text-emerald-900 dark:text-emerald-400 placeholder:text-emerald-200" 
    />
    <p className="mt-2 text-[9px] text-emerald-600/50 font-medium">Bu alan boş bırakılırsa sitedeki duyuru barı tamamen gizlenir.</p>
  </div>
</div>
{/* --- TOP BAR TASARIM AYARLARI --- */}
  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-700">
    <div>
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Arka Plan Rengi</label>
      <div className="flex gap-2 items-center bg-slate-50 dark:bg-dark-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
        <input 
          type="color" 
          value={cmsData?.[lang]?.top_bar_bg || '#E5E1D1'} 
          onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_bg: e.target.value } })}
          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
        />
        <input 
          type="text" 
          value={cmsData?.[lang]?.top_bar_bg || '#E5E1D1'}
          onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_bg: e.target.value } })}
          className="flex-1 bg-transparent text-[10px] font-mono outline-none dark:text-white"
        />
      </div>
    </div>
    <div>
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Yazı Rengi</label>
      <div className="flex gap-2 items-center bg-slate-50 dark:bg-dark-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
        <input 
          type="color" 
          value={cmsData?.[lang]?.top_bar_text || '#4B3832'} 
          onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_text: e.target.value } })}
          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
        />
        <input 
          type="text" 
          value={cmsData?.[lang]?.top_bar_text || '#4B3832'}
          onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_text: e.target.value } })}
          className="flex-1 bg-transparent text-[10px] font-mono outline-none dark:text-white"
        />
      </div>
    </div>
    <div className="col-span-2 md:col-span-1">
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Bar Yüksekliği (px)</label>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-dark-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
        <input
          type="number"
          min="30"
          max="60"
          value={cmsData?.[lang]?.top_bar_height || 36}
          onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_height: parseInt(e.target.value) || 36 } })}
          className="flex-1 bg-transparent text-[10px] font-bold outline-none dark:text-white px-2"
        />
        <span className="text-[9px] text-gray-400">px</span>
      </div>
    </div>
  </div>
                </div>
                <div className="mt-6">
  <label className="block text-[10px] font-black text-emerald-600/50 uppercase tracking-widest mb-4">Üst Mesaj Barı (Duyuru)</label>
  <input 
    type="text" 
    placeholder="Örn: 1500 TL Üzeri Ücretsiz Kargo"
    value={cmsData?.[lang]?.top_bar_message || ''} 
    onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_message: e.target.value } })} 
    className="w-full bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[20px] p-4 text-[11px] font-bold tracking-widest focus:ring-2 focus:ring-emerald-500/20 outline-none text-emerald-900 dark:text-emerald-400" 
  />
</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ürün Seçimleri - Global (dil bağımsız) */}
        <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-600"><Package size={26} /></div>
            <div>
              <span className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Ürün Seçimleri</span>
              <p className="text-[9px] text-gray-400 font-medium mt-1">Anasayfa için ürünleri seçin</p>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Premium Selection (3 Ürün) */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest">Premium Selection (3 Ürün)</label>
              {[0, 1, 2].map((index) => (
                <select
                  key={index}
                  value={cmsData?.premium_collection_ids?.[index] || ''}
                  onChange={(e) => {
                    const newIds = [...(cmsData?.premium_collection_ids || ['', '', ''])];
                    newIds[index] = e.target.value;
                    setCmsData({ ...cmsData, premium_collection_ids: newIds });
                  }}
                  className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-gray-900 dark:text-white"
                >
                  <option value="">{index + 1}. Ürün Seçin</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - ₺{product.price}
                    </option>
                  ))}
                </select>
              ))}
            </div>

            {/* Ayın Favorisi (1 Ürün) */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest">Ayın Favorisi</label>
              <select
                value={cmsData?.featured_product_id || ''}
                onChange={(e) => setCmsData({ ...cmsData, featured_product_id: e.target.value })}
                className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-gray-900 dark:text-white"
              >
                <option value="">Ürün Seçin</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} - ₺{product.price}
                  </option>
                ))}
              </select>
              {cmsData?.featured_product_id && (
                <div className="mt-4 p-4 bg-orange-50/30 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-dark-900 border">
                      <img
                        src={products.find(p => p.id === cmsData.featured_product_id)?.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {products.find(p => p.id === cmsData.featured_product_id)?.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ₺{products.find(p => p.id === cmsData.featured_product_id)?.price}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        ) : cmsPage === 'about' ? (
        /* About CMS */
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['tr', 'en', 'ru'].map((lang) => (
            <div key={lang} className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className={`p-3.5 rounded-2xl ${lang === 'tr' ? 'bg-red-50 text-red-600' : lang === 'en' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}><Globe size={26} /></div>
                <span className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{lang === 'tr' ? 'Türkçe (TR)' : lang === 'en' ? 'English (EN)' : 'Russian (RU)'}</span>
              </div>
              <div className="space-y-8">
                {/* Hero Image */}
                <ImageUpload
                  value={aboutCmsData?.[lang]?.hero_image || ''}
                  onChange={(url) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], hero_image: url } })}
                  label="Ana Görsel (Sertan Açıkgöz)"
                  folder="about-images"
                />

                {/* Hero Section */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Üst Etiket</label>
                  <input value={aboutCmsData?.[lang]?.hero_label || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], hero_label: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-4 text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" placeholder="Örn: Hikayemiz" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ana Başlık</label>
                  <textarea value={aboutCmsData?.[lang]?.hero_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], hero_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-base font-display font-medium italic focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={3} placeholder="Örn: Hile Yok, Kalite Var." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Açıklama Paragrafı</label>
                  <textarea value={aboutCmsData?.[lang]?.hero_description || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], hero_description: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={5} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Signature (İmza)</label>
                  <input value={aboutCmsData?.[lang]?.signature || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], signature: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-4 text-sm font-handwriting focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" placeholder="Örn: Sertan Açıkgöz" />
                </div>

                {/* Philosophy Section */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Felsefe Başlığı</label>
                  <textarea value={aboutCmsData?.[lang]?.philosophy_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], philosophy_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-base font-display font-medium italic focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={3} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Felsefe Açıklaması</label>
                  <textarea value={aboutCmsData?.[lang]?.philosophy_description || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], philosophy_description: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={5} />
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">İstatistikler (4 Kart)</label>
                  <input value={aboutCmsData?.[lang]?.stat1_value || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat1_value: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Stat 1 Değer (Örn: 2016)" />
                  <input value={aboutCmsData?.[lang]?.stat1_label || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat1_label: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-xs outline-none text-gray-900 dark:text-white" placeholder="Stat 1 Etiket (Örn: Kuruluş)" />

                  <input value={aboutCmsData?.[lang]?.stat2_value || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat2_value: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Stat 2 Değer" />
                  <input value={aboutCmsData?.[lang]?.stat2_label || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat2_label: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-xs outline-none text-gray-900 dark:text-white" placeholder="Stat 2 Etiket" />

                  <input value={aboutCmsData?.[lang]?.stat3_value || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat3_value: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Stat 3 Değer" />
                  <input value={aboutCmsData?.[lang]?.stat3_label || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat3_label: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-xs outline-none text-gray-900 dark:text-white" placeholder="Stat 3 Etiket" />

                  <input value={aboutCmsData?.[lang]?.stat4_value || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat4_value: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Stat 4 Değer" />
                  <input value={aboutCmsData?.[lang]?.stat4_label || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], stat4_label: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-xs outline-none text-gray-900 dark:text-white" placeholder="Stat 4 Etiket" />
                </div>

                {/* Delivery Section */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Teslimat Başlığı</label>
                  <textarea value={aboutCmsData?.[lang]?.delivery_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], delivery_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-base font-display italic focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={2} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Teslimat Açıklaması</label>
                  <textarea value={aboutCmsData?.[lang]?.delivery_description || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], delivery_description: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={5} />
                </div>

                {/* Experience Section - 3 Items */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4">Artizan Deneyim (3 Madde)</label>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 mb-2">Madde 1 Başlık:</label>
                    <input value={aboutCmsData?.[lang]?.exp1_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], exp1_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white mb-2" placeholder="Örn: Gıda Boyasız" />
                    <textarea value={aboutCmsData?.[lang]?.exp1_desc || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], exp1_desc: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" rows={2} placeholder="Açıklama" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 mb-2">Madde 2 Başlık:</label>
                    <input value={aboutCmsData?.[lang]?.exp2_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], exp2_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white mb-2" />
                    <textarea value={aboutCmsData?.[lang]?.exp2_desc || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], exp2_desc: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" rows={2} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 mb-2">Madde 3 Başlık:</label>
                    <input value={aboutCmsData?.[lang]?.exp3_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], exp3_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white mb-2" />
                    <textarea value={aboutCmsData?.[lang]?.exp3_desc || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], exp3_desc: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" rows={2} />
                  </div>
                </div>

                {/* Locations Section */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">Mağazalar Başlığı</label>
                  <textarea value={aboutCmsData?.[lang]?.locations_title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], locations_title: e.target.value } })} className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-base font-display italic focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white" rows={2} placeholder="Örn: Atölyelerimiz & Şubelerimiz" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Store Locations - Global (dil bağımsız) */}
        {cmsPage === 'about' && (
        <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3.5 rounded-2xl bg-gold/10 text-gold"><span className="material-icons-outlined text-2xl">store</span></div>
            <div>
              <span className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Mağaza Bilgileri</span>
              <p className="text-[9px] text-gray-400 font-medium mt-1">2 Şube için adres bilgileri</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Store 1 */}
            <div className="space-y-4 p-6 bg-gray-50 dark:bg-dark-900 rounded-3xl">
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">1. Mağaza (Yeşilbahçe)</label>
              <input value={aboutCmsData?.store1_name || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store1_name: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Mağaza Adı" />
              <input value={aboutCmsData?.store1_address || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store1_address: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Adres" />
              <input value={aboutCmsData?.store1_phone || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store1_phone: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Telefon" />
              <input value={aboutCmsData?.store1_map || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store1_map: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Google Maps Link" />
            </div>

            {/* Store 2 */}
            <div className="space-y-4 p-6 bg-gray-50 dark:bg-dark-900 rounded-3xl">
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">2. Mağaza (Çağlayan)</label>
              <input value={aboutCmsData?.store2_name || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store2_name: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Mağaza Adı" />
              <input value={aboutCmsData?.store2_address || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store2_address: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Adres" />
              <input value={aboutCmsData?.store2_phone || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store2_phone: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Telefon" />
              <input value={aboutCmsData?.store2_map || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, store2_map: e.target.value })} className="w-full bg-white dark:bg-dark-800 border-none rounded-[20px] p-4 text-sm outline-none text-gray-900 dark:text-white" placeholder="Google Maps Link" />
            </div>
          </div>
        </div>
        )}
        </>
        ) : cmsPage === 'legal' ? (
        /* Legal CMS */
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['tr', 'en', 'ru'].map((lang) => (
            <div key={lang} className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className={`p-3.5 rounded-2xl ${lang === 'tr' ? 'bg-red-50 text-red-600' : lang === 'en' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  <span className="material-icons-outlined text-2xl">gavel</span>
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{lang === 'tr' ? 'Türkçe (TR)' : lang === 'en' ? 'English (EN)' : 'Russian (RU)'}</span>
              </div>
              <div className="space-y-8">
                {/* Privacy Policy */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">📜 Gizlilik Politikası (Privacy)</label>
                  <textarea
                    value={legalCmsData?.[lang]?.privacy_content || ''}
                    onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], privacy_content: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-white font-mono leading-relaxed"
                    rows={12}
                    placeholder="Gizlilik politikası içeriği..."
                  />
                </div>

                {/* Shipping Terms */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">🚚 Teslimat Koşulları (Shipping)</label>
                  <textarea
                    value={legalCmsData?.[lang]?.shipping_content || ''}
                    onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], shipping_content: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-gray-900 dark:text-white font-mono leading-relaxed"
                    rows={12}
                    placeholder="Teslimat koşulları içeriği..."
                  />
                </div>

                {/* Pre-Information */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">ℹ️ Ön Bilgilendirme (Pre-Info)</label>
                  <textarea
                    value={legalCmsData?.[lang]?.preinfo_content || ''}
                    onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], preinfo_content: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none text-gray-900 dark:text-white font-mono leading-relaxed"
                    rows={12}
                    placeholder="Ön bilgilendirme içeriği..."
                  />
                </div>

                {/* Distance Sales Agreement */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4">📋 Mesafeli Satış Sözleşmesi (Distance Sales)</label>
                  <textarea
                    value={legalCmsData?.[lang]?.distance_sales_content || ''}
                    onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], distance_sales_content: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none text-gray-900 dark:text-white font-mono leading-relaxed"
                    rows={12}
                    placeholder="Mesafeli satış sözleşmesi içeriği..."
                  />
                </div>

                {/* KVKK */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">🔒 KVKK (Data Protection)</label>
                  <textarea
                    value={legalCmsData?.[lang]?.kvkk_content || ''}
                    onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], kvkk_content: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-red-500/20 outline-none text-gray-900 dark:text-white font-mono leading-relaxed"
                    rows={12}
                    placeholder="KVKK içeriği..."
                  />
                </div>

                {/* Refund Policy */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">↩️ İptal & İade (Refund)</label>
                  <textarea
                    value={legalCmsData?.[lang]?.refund_content || ''}
                    onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], refund_content: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-[24px] p-6 text-sm focus:ring-2 focus:ring-gold/20 outline-none text-gray-900 dark:text-white font-mono leading-relaxed"
                    rows={12}
                    placeholder="İptal ve iade politikası içeriği..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
        ) : null}
      </div>
      ) : activeTab === 'customers' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-700">
          {/* Stats Bar (Kompakt) */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            {[
              { label: 'Müşteri', val: allCustomers.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Abone', val: newsletterSubscribers.length, icon: Mail, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Yeni (7g)', val: allCustomers.filter((c: any) => {
                const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
                const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                return createdAt >= weekAgo;
              }).length, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
              { label: 'Oran', val: allCustomers.length > 0 ? `%${Math.round((newsletterSubscribers.filter(sub => allCustomers.some(c => c.email === sub.email)).length / allCustomers.length) * 100)}` : '%0', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50">
                <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                  <item.icon size={16} />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">{item.val}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative w-full lg:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ara..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none"
              />
            </div>

            {/* Segment Filter */}
            <div className="flex gap-1 bg-slate-100 dark:bg-dark-900 p-1 rounded-xl">
              {[
                { id: 'all', label: 'Tümü', icon: '👥' },
                { id: 'vip', label: 'VIP', icon: '⭐' },
                { id: 'new', label: 'Yeni', icon: '🆕' },
                { id: 'subscribed', label: 'Abone', icon: '📧' },
                { id: 'not-subscribed', label: 'Abone Değil', icon: '📭' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterByNewsletter(f.id as any)}
                  className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filterByNewsletter === f.id
                      ? 'bg-white dark:bg-dark-800 shadow-md text-brown-900 dark:text-white'
                      : 'text-gray-400 hover:text-slate-600'
                  }`}
                >
                  <span>{f.icon}</span>
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button className="ml-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2">
              <span>📥</span> Dışa Aktar
            </button>
          </div>

          {/* Customer List */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 grid grid-cols-12 gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-1">Tip</div>
              <div className="col-span-4">Müşteri</div>
              <div className="col-span-3">Durum</div>
              <div className="col-span-2">Kayıt</div>
              <div className="col-span-2 text-right">İşlemler</div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {allCustomers
                .filter((customer: any) => {
                  const searchMatch = customerSearchQuery === '' ||
                    customer.displayName?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase());

                  const isSubscribed = newsletterSubscribers.some(sub => sub.email === customer.email);
                  const createdAt = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
                  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                  const isNew = createdAt >= weekAgo;
                  const isVip = customer.loyaltyPoints >= 500 || customer.totalOrders >= 5;

                  const filterMatch =
                    filterByNewsletter === 'all' ||
                    (filterByNewsletter === 'subscribed' && isSubscribed) ||
                    (filterByNewsletter === 'not-subscribed' && !isSubscribed) ||
                    (filterByNewsletter === 'vip' && isVip) ||
                    (filterByNewsletter === 'new' && isNew);

                  return searchMatch && filterMatch;
                })
                .map((customer: any) => {
                  const isSubscribed = newsletterSubscribers.some(sub => sub.email === customer.email);
                  const createdAt = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
                  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                  const isNew = createdAt >= weekAgo;
                  const isVip = customer.loyaltyPoints >= 500 || customer.totalOrders >= 5;

                  // Segment icon & color
                  const getSegment = () => {
                    if (isVip) return { icon: '⭐', label: 'VIP', color: 'bg-amber-100 text-amber-700' };
                    if (isNew) return { icon: '🆕', label: 'Yeni', color: 'bg-blue-100 text-blue-700' };
                    if (isSubscribed) return { icon: '📧', label: 'Abone', color: 'bg-emerald-100 text-emerald-700' };
                    return { icon: '👤', label: 'Standart', color: 'bg-slate-100 text-slate-600' };
                  };
                  const segment = getSegment();

                  return (
                    <div key={customer.id} className="px-4 py-3 hover:bg-slate-50/50 grid grid-cols-12 gap-4 items-center group transition-all">
                      {/* Segment Icon */}
                      <div className="col-span-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${segment.color}`} title={segment.label}>
                          {segment.icon}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="col-span-4">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {customer.displayName || 'İsimsiz'}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">{customer.email}</p>
                      </div>

                      {/* Status Badges */}
                      <div className="col-span-3 flex flex-wrap gap-1">
                        {isVip && <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">VIP</span>}
                        {isSubscribed && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Abone</span>}
                        {isNew && <span className="text-[8px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Yeni</span>}
                        {customer.loyaltyPoints > 0 && <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{customer.loyaltyPoints} puan</span>}
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-[10px] text-gray-400">
                          {customer.createdAt?.toDate ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(customer.createdAt.toDate()) : '-'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`mailto:${customer.email}`}
                          className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Mail Gönder"
                        >
                          <Mail size={14} />
                        </a>
                        <button
                          onClick={() => { setEditingCustomer(customer); setIsCustomerModalOpen(true); }}
                          className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Düzenle"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {/* Empty State */}
              {allCustomers.length === 0 && (
                <div className="p-20 text-center">
                  <Users size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                  <p className="text-gray-400 dark:text-gray-500 font-display text-lg">Henüz kayıtlı müşteri yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Edit Modal */}
          {isCustomerModalOpen && editingCustomer && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] flex items-center justify-center animate-in fade-in">
              <div className="bg-white dark:bg-dark-800 p-10 rounded-[48px] shadow-2xl w-full max-w-md animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold italic text-gray-900 dark:text-white">Müşteri Düzenle</h2>
                  <button
                    onClick={() => {
                      setIsCustomerModalOpen(false);
                      setEditingCustomer(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-900 rounded-xl transition-all"
                  >
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      İsim Soyisim
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.displayName || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, displayName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white"
                      placeholder="Müşteri adı..."
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Email (Değiştirilemez)
                    </label>
                    <input
                      type="email"
                      value={editingCustomer.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => {
                      setIsCustomerModalOpen(false);
                      setEditingCustomer(null);
                    }}
                    className="px-8 py-4 text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-dark-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
                  >
                    İPTAL
                  </button>
                  <button
                    onClick={handleCustomerUpdate}
                    className="px-8 py-4 text-[10px] font-black text-white bg-brown-900 rounded-2xl shadow-lg hover:bg-black transition-all"
                  >
                    KAYDET
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'badges' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-3 duration-700">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: 'Toplam Rozet',
                val: badges.length,
                icon: Tag,
                color: 'blue'
              },
              {
                label: 'Aktif Rozetler',
                val: badges.filter(b => b.active).length,
                icon: Eye,
                color: 'emerald'
              },
              {
                label: 'Pasif Rozetler',
                val: badges.filter(b => !b.active).length,
                icon: EyeOff,
                color: 'red'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-800 p-7 rounded-[32px] border border-gray-200 shadow-sm relative overflow-hidden group">
                <div className={`w-12 h-12 ${colorMap[item.color]} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
                </div>
                <div className="text-3xl font-display font-bold leading-none text-gray-900 dark:text-white">{item.val}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Info Accordion - Rozet Kullanım Örnekleri */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/20 overflow-hidden">
            <button
              onClick={() => setIsBadgeInfoOpen(!isBadgeInfoOpen)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-white/50 dark:hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Lightbulb size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-blue-900 dark:text-blue-100">💡 Sade Chocolate İçin Somut Örnekler</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Rozetlerin nasıl kullanılacağını öğrenin</p>
                </div>
              </div>
              <ChevronDown
                size={24}
                className={`text-blue-500 transition-transform duration-300 ${isBadgeInfoOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isBadgeInfoOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-8 pt-0 space-y-6">
                {/* Senaryo 1 */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">Yeni Tablet Serisi Çıktı</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span>Admin panelde <strong className="text-blue-600 dark:text-blue-400">"YENİ"</strong> rozeti oluştur (Altın renk: #D4AF37)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span>Yeni tabletlere bu rozeti ekle</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span>Katalogda bu tabletler altın <strong>"YENİ"</strong> rozeti ile öne çıkar ✨</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Senaryo 2 */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">Ramazan Kampanyası</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">→</span>
                          <span><strong className="text-green-600 dark:text-green-400">"RAMAZAN ÖZEL"</strong> rozeti oluştur (Yeşil renk: #059669)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">→</span>
                          <span>Ramazan için hazırlanan gift box'lara ekle</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">→</span>
                          <span>Müşteriler katalogda hangi ürünlerin ramazan özel olduğunu anında görür</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Senaryo 3 */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-900/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">Sınırlı Üretim Truffle</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">→</span>
                          <span><strong className="text-purple-600 dark:text-purple-400">"SINIRLI ÜRETİM"</strong> rozeti oluştur (Siyah/Altın: #1a1a1a / #D4AF37)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">→</span>
                          <span>Sadece 100 adet üretilen trufflelara ekle</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">→</span>
                          <span>Eksklüzif bir his yaratır, hemen satın almayı teşvik eder</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Senaryo 4 */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">4</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">En Çok Satan Ürünler</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">→</span>
                          <span><strong className="text-amber-600 dark:text-amber-400">"BESTSELLER"</strong> rozeti oluştur (Kahverengi: #78350f)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">→</span>
                          <span>Satış verilerine göre en çok satan 5 ürüne ekle</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">→</span>
                          <span>Yeni müşteriler neyi alacağını bilmiyorsa, bunlara güvenir (sosyal kanıt)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Diğer Örnekler */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl">
                  <h4 className="font-display text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info size={20} className="text-gray-600 dark:text-gray-400" />
                    Diğer Popüler Rozet Örnekleri
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>İNDİRİM</strong> - Kampanya ürünleri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>SON FIRSAT</strong> - Stok azaldı</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>VEGAN</strong> - Ürün özelliği</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>SEVGİLİLER GÜNÜ</strong> - Özel gün</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>ORGANİK</strong> - Sertifikalı ürün</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>EL YAPIMI</strong> - Artizan ürün</span>
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-6 rounded-2xl border-2 border-dashed border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-lg">💡</span>
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-gray-900 dark:text-white mb-2">Pro İpucu</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Rozetli ürünler katalogda <strong>%20-40 daha fazla tıklanır</strong>. Ancak her ürüne rozet eklemeyin - sadece gerçekten öne çıkması gereken ürünlere ekleyin. Çok fazla rozet, hiçbiri olmamak gibidir!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Badge Button */}
          <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200 shadow-sm p-6">
            {!isAddingBadge ? (
              <div className="flex gap-4">
                <button
                  onClick={() => setIsAddingBadge(true)}
                  className="flex-1 py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl hover:border-brown-900 dark:hover:border-gold hover:bg-brown-50 dark:hover:bg-dark-900/50 transition-all flex items-center justify-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-gold"
                >
                  <Plus size={24} />
                  <span className="font-display text-lg font-bold">Yeni Rozet Ekle</span>
                </button>
                <button
                  onClick={handleAddExampleBadges}
                  className="px-8 py-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-3xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <Sparkles size={20} />
                  <span className="font-display text-lg">Örnek Rozetleri Ekle</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Yeni Rozet Oluştur</h3>
                  <button onClick={() => setIsAddingBadge(false)} className="text-gray-400 hover:text-red-500">
                    <X size={24} />
                  </button>
                </div>

                {/* Badge Name - Multi-language */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">İsim (Türkçe)</label>
                    <input
                      type="text"
                      value={newBadge.name.tr}
                      onChange={(e) => setNewBadge({...newBadge, name: {...newBadge.name, tr: e.target.value}})}
                      placeholder="Yeni"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Name (English)</label>
                    <input
                      type="text"
                      value={newBadge.name.en}
                      onChange={(e) => setNewBadge({...newBadge, name: {...newBadge.name, en: e.target.value}})}
                      placeholder="New"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Название (Russian)</label>
                    <input
                      type="text"
                      value={newBadge.name.ru}
                      onChange={(e) => setNewBadge({...newBadge, name: {...newBadge.name, ru: e.target.value}})}
                      placeholder="Новинка"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Colors & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Arka Plan Rengi</label>
                    <input
                      type="color"
                      value={newBadge.bgColor}
                      onChange={(e) => setNewBadge({...newBadge, bgColor: e.target.value})}
                      className="w-full h-12 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Metin Rengi</label>
                    <input
                      type="color"
                      value={newBadge.textColor}
                      onChange={(e) => setNewBadge({...newBadge, textColor: e.target.value})}
                      className="w-full h-12 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Öncelik (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newBadge.priority}
                      onChange={(e) => setNewBadge({...newBadge, priority: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-50 dark:bg-dark-900 p-6 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Önizleme</p>
                  <div className="inline-flex">
                    <span
                      className="text-[10px] font-bold px-4 py-2 uppercase tracking-widest rounded"
                      style={{backgroundColor: newBadge.bgColor, color: newBadge.textColor}}
                    >
                      {newBadge.name.tr || 'Örnek Rozet'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddBadge}
                    className="flex-1 px-8 py-4 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-lg"
                  >
                    Rozet Oluştur
                  </button>
                  <button
                    onClick={() => setIsAddingBadge(false)}
                    className="px-8 py-4 bg-gray-100 dark:bg-dark-900 text-gray-600 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-dark-700 transition-all"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Badge List */}
          <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">Tüm Rozetler</h3>
              <p className="text-xs text-gray-400 mt-1">Rozetleri düzenleyin ve yönetin</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {badges.map((badge: any) => (
                <div key={badge.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-dark-900/50 flex items-center justify-between group transition-all">
                  <div className="flex items-center gap-6 flex-1">
                    {/* Badge Preview */}
                    <div>
                      <span
                        className="text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest rounded"
                        style={{backgroundColor: badge.bgColor, color: badge.textColor}}
                      >
                        {badge.name.tr}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-display font-bold text-base text-gray-900 dark:text-white">
                          {badge.name.tr} / {badge.name.en} / {badge.name.ru}
                        </h4>
                        {badge.active ? (
                          <span className="flex items-center gap-1.5 text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                            <Eye size={12} />
                            Aktif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[9px] bg-gray-50 dark:bg-gray-900/20 text-gray-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                            <EyeOff size={12} />
                            Pasif
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-gray-400">Öncelik: {badge.priority}</span>
                        <span className="text-[10px] text-gray-400">BG: {badge.bgColor}</span>
                        <span className="text-[10px] text-gray-400">Text: {badge.textColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBadgeActive(badge.id, badge.active)}
                      className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                    >
                      {badge.active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] animate-in fade-in" />
                        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 p-10 rounded-[48px] shadow-2xl z-[131] w-full max-w-md animate-in zoom-in-95">
                          <AlertDialog.Title className="text-2xl font-display font-bold mb-2 italic text-gray-900 dark:text-white">Rozeti Sil</AlertDialog.Title>
                          <AlertDialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            Bu rozeti kalıcı olarak silmek istediğinizden emin misiniz?
                          </AlertDialog.Description>
                          <div className="flex justify-end gap-3">
                            <AlertDialog.Cancel asChild>
                              <button className="px-8 py-4 text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-dark-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-dark-700">
                                VAZGEÇ
                              </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <button
                                onClick={() => handleDeleteBadge(badge.id)}
                                className="px-8 py-4 text-[10px] font-black text-white bg-red-600 rounded-2xl shadow-lg hover:bg-red-700"
                              >
                                SİL
                              </button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {badges.length === 0 && (
                <div className="p-20 text-center">
                  <Tag size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                  <p className="text-gray-400 dark:text-gray-500 font-display text-lg">Henüz rozet oluşturulmadı</p>
                  <button
                    onClick={() => setIsAddingBadge(true)}
                    className="mt-6 px-8 py-3 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-lg"
                  >
                    İlk Rozeti Oluştur
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'ai' ? (
        <SommelierTab aiConfig={aiConfig} setAiConfig={setAiConfig} />
      ) : activeTab === 'scenarios' ? (
        <ScenariosTab />
      ) : activeTab === 'analytics' ? (
        <ConversationAnalyticsTab />
      ) : activeTab === 'journey' ? (
        <BehaviorTrackingTab />
      ) : activeTab === 'referrals' ? (
        /* Referans Takibi */
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <span className="text-lg font-bold text-emerald-600">{referrals.filter(r => r.bonusAwarded).length}</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase">Tamamlanan</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <span className="text-lg font-bold text-amber-600">{referrals.filter(r => !r.bonusAwarded).length}</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase">Bekleyen</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <span className="text-lg font-bold text-blue-600">{referrals.length}</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase">Toplam</span>
            </div>
          </div>

          {/* Referral List */}
          <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-slate-50/30 dark:bg-dark-900/30">
              <h3 className="font-display text-xl font-bold italic text-gray-900 dark:text-white">Referans Kayıtları</h3>
              <p className="text-xs text-gray-500 mt-1">Davet edilen kullanıcılar ve bonus durumları</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {referrals.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Gift size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-medium">Henüz referans kaydı yok</p>
                </div>
              ) : (
                referrals.map((ref: any) => (
                  <div key={ref.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-dark-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ref.bonusAwarded ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {ref.bonusAwarded ? '✓' : '⏳'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{ref.refereeEmail}</p>
                        <p className="text-[10px] text-gray-400">
                          Davet eden: {customers.find((c: any) => c.id === ref.referrerId)?.email || ref.referralCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        ref.bonusAwarded
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {ref.bonusAwarded ? 'Ödül Verildi' : 'İlk Sipariş Bekleniyor'}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(ref.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
      ) : null}
        </div>
      </main>

      {/* Ürün Ekleme/Düzenleme Modalı */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-dark-800 w-full h-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex flex-col">
            <div className="px-12 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-dark-900">
              <div>
                <h2 className="text-4xl font-display font-bold italic text-brown-900 dark:text-white">
                  {editingProduct ? 'Ürünü Düzenle' : 'Yeni Artisan Koleksiyonu'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Master Chef Editör Modu</p>
                </div>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}
                className="w-16 h-16 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-800 rounded-full text-gray-400 hover:text-red-500 transition-all duration-300"
              >
                <X size={32} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProductForm
                product={editingProduct}
                onSave={async (data) => {
                  try {
                    if (editingProduct) await updateProduct(editingProduct.id, data);
                    else await addProduct(data);
                    setIsFormOpen(false);
                    setEditingProduct(null);
                    toast.success('Başarılı! ✨');
                  } catch {
                    toast.error('Hata oluştu.');
                  }
                }}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};