import React, { useState, useEffect, useMemo } from 'react';
import { Users, Mail, Calendar, TrendingUp, Search, Edit3, Trash2, X } from 'lucide-react';
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { toast } from 'sonner';
import { AdminCard } from '../shared/AdminCard';
import { AdminEmptyState } from '../shared/AdminEmptyState';

export const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [filterByNewsletter, setFilterByNewsletter] = useState<'all' | 'subscribed' | 'not-subscribed' | 'vip' | 'new'>('all');
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setCustomers(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Müşteri verileri yüklenemedi:', error);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchNewsletterSubscribers = async () => {
      try {
        const q = query(collection(db, 'newsletter_subscribers'), orderBy('subscribedAt', 'desc'));
        const snapshot = await getDocs(q);
        setNewsletterSubscribers(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Bülten verileri yüklenemedi:', error);
      }
    };
    fetchNewsletterSubscribers();
  }, []);

  const allCustomers = useMemo(() => {
    const customerEmails = new Set(customers.map((c: any) => c.email));
    const newsletterOnlySubscribers = newsletterSubscribers
      .filter((sub: any) => !customerEmails.has(sub.email))
      .map((sub: any) => ({
        id: sub.id,
        email: sub.email,
        displayName: null,
        photoURL: null,
        createdAt: sub.subscribedAt,
        source: 'newsletter'
      }));
    return [...customers, ...newsletterOnlySubscribers];
  }, [customers, newsletterSubscribers]);

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

  const handleDeleteCustomer = async (customer: any) => {
    try {
      if (customer.id && !customer.isNewsletterOnly) {
        await deleteDoc(doc(db, 'users', customer.id));
        setCustomers(prev => prev.filter((c: any) => c.id !== customer.id));
      }
      if (customer.isNewsletterOnly && customer.newsletterId) {
        await deleteDoc(doc(db, 'newsletter_subscribers', customer.newsletterId));
        setNewsletterSubscribers(prev => prev.filter((ns: any) => ns.id !== customer.newsletterId));
      }
      const newsletterSub = newsletterSubscribers.find((ns: any) => ns.email === customer.email);
      if (newsletterSub && !customer.isNewsletterOnly) {
        await deleteDoc(doc(db, 'newsletter_subscribers', newsletterSub.id));
        setNewsletterSubscribers(prev => prev.filter((ns: any) => ns.id !== newsletterSub.id));
      }
      toast.success('Müşteri silindi');
    } catch (error) {
      console.error('Müşteri silinemedi:', error);
      toast.error('Müşteri silinemedi');
    }
  };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const stats = [
    { label: 'Müşteri', val: allCustomers.length, icon: Users, color: 'bg-brand-blue/10 text-blue-700' },
    { label: 'Abone', val: newsletterSubscribers.length, icon: Mail, color: 'bg-brand-green/10 text-green-700' },
    { label: 'Yeni (7g)', val: allCustomers.filter((c: any) => {
      const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return d >= weekAgo;
    }).length, icon: Calendar, color: 'bg-purple-50 text-purple-700' },
    { label: 'Oran', val: allCustomers.length > 0 ? `%${Math.round((newsletterSubscribers.filter(sub => allCustomers.some(c => c.email === sub.email)).length / allCustomers.length) * 100)}` : '%0', icon: TrendingUp, color: 'bg-brand-peach/10 text-brand-orange' }
  ];

  const filters = [
    { id: 'all', label: 'Tümü' },
    { id: 'vip', label: 'VIP' },
    { id: 'new', label: 'Yeni' },
    { id: 'subscribed', label: 'Abone' },
    { id: 'not-subscribed', label: 'Abone Değil' }
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap items-center gap-3">
        {stats.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-200 rounded-xl shadow-sm">
            <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
              <item.icon size={16} />
            </div>
            <div>
              <span className="text-lg font-bold text-mocha-900">{item.val}</span>
              <span className="text-xs text-mocha-400 font-medium ml-1">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <AdminCard>
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative w-full lg:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-mustard/20 outline-none text-mocha-900"
            />
          </div>
          <div className="flex gap-1 bg-cream-50 p-1 rounded-lg">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilterByNewsletter(f.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                  filterByNewsletter === f.id
                    ? 'bg-white shadow-sm text-mocha-900'
                    : 'text-mocha-400 hover:text-mocha-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </AdminCard>

      {/* Customer List */}
      <AdminCard noPadding>
        {/* Table Header */}
        <div className="px-4 py-3 bg-cream-50 border-b border-cream-200 grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-mocha-400">
          <div className="col-span-1">Tip</div>
          <div className="col-span-4">Müşteri</div>
          <div className="col-span-3">Durum</div>
          <div className="col-span-2">Kayıt</div>
          <div className="col-span-2 text-right">İşlemler</div>
        </div>

        <div className="divide-y divide-cream-100">
          {allCustomers
            .filter((customer: any) => {
              const searchMatch = customerSearchQuery === '' ||
                customer.displayName?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase());

              const isSubscribed = newsletterSubscribers.some(sub => sub.email === customer.email);
              const createdAt = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
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
              const isNew = createdAt >= weekAgo;
              const isVip = customer.loyaltyPoints >= 500 || customer.totalOrders >= 5;

              return (
                <div key={customer.id} className="px-4 py-3 hover:bg-cream-50 grid grid-cols-12 gap-4 items-center group transition-colors duration-150">
                  <div className="col-span-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      isVip ? 'bg-brand-peach/10 text-brand-orange' :
                      isNew ? 'bg-brand-blue/10 text-blue-700' :
                      isSubscribed ? 'bg-brand-green/10 text-green-700' :
                      'bg-cream-100 text-mocha-500'
                    }`}>
                      {isVip ? '⭐' : isNew ? '🆕' : isSubscribed ? '📧' : '👤'}
                    </div>
                  </div>

                  <div className="col-span-4">
                    <p className="font-medium text-sm text-mocha-900 truncate">{customer.displayName || 'İsimsiz'}</p>
                    <p className="text-xs text-mocha-400 font-mono truncate">{customer.email}</p>
                  </div>

                  <div className="col-span-3 flex flex-wrap gap-1">
                    {isVip && <span className="text-xs bg-brand-peach/10 text-brand-orange px-2 py-0.5 rounded-md font-medium">VIP</span>}
                    {isSubscribed && <span className="text-xs bg-brand-green/10 text-green-700 px-2 py-0.5 rounded-md font-medium">Abone</span>}
                    {isNew && <span className="text-xs bg-brand-blue/10 text-blue-700 px-2 py-0.5 rounded-md font-medium">Yeni</span>}
                    {customer.loyaltyPoints > 0 && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium">{customer.loyaltyPoints} puan</span>}
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-mocha-400">
                      {customer.createdAt?.toDate ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(customer.createdAt.toDate()) : '-'}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`mailto:${customer.email}`} className="p-1.5 text-mocha-400 hover:text-blue-600 hover:bg-brand-blue/10 rounded-lg transition-colors" title="Mail Gönder">
                      <Mail size={14} />
                    </a>
                    <button onClick={() => { setEditingCustomer(customer); setIsCustomerModalOpen(true); }} className="p-1.5 text-mocha-400 hover:text-green-600 hover:bg-brand-green/10 rounded-lg transition-colors" title="Düzenle">
                      <Edit3 size={14} />
                    </button>
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <button className="p-1.5 text-mocha-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                          <Trash2 size={14} />
                        </button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[150]" />
                        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl z-[151] w-full max-w-sm">
                          <AlertDialog.Title className="text-lg font-semibold text-mocha-900 mb-2">Müşteriyi Sil</AlertDialog.Title>
                          <AlertDialog.Description className="text-sm text-mocha-500 mb-6">
                            <strong>{customer.email}</strong> adresli müşteriyi silmek istediğinizden emin misiniz?
                          </AlertDialog.Description>
                          <div className="flex justify-end gap-3">
                            <AlertDialog.Cancel asChild>
                              <button className="px-4 py-2 text-sm font-medium text-mocha-600 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors">Vazgeç</button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <button onClick={() => handleDeleteCustomer(customer)} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Sil</button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </div>
                </div>
              );
            })}

          {allCustomers.length === 0 && (
            <AdminEmptyState icon={Users} title="Henüz kayıtlı müşteri yok" />
          )}
        </div>
      </AdminCard>

      {/* Customer Edit Modal */}
      {isCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-[140] flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-mocha-900">Müşteri Düzenle</h2>
              <button onClick={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors">
                <X size={20} className="text-mocha-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mocha-600 mb-1.5">İsim Soyisim</label>
                <input
                  type="text"
                  value={editingCustomer.displayName || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-mustard/20 outline-none text-mocha-900"
                  placeholder="Müşteri adı..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-mocha-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingCustomer.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-cream-100 border border-cream-200 rounded-lg text-sm text-mocha-400 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} className="px-4 py-2 text-sm font-medium text-mocha-600 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors">İptal</button>
              <button onClick={handleCustomerUpdate} className="px-4 py-2 text-sm font-medium text-white bg-brand-mustard rounded-lg hover:bg-brand-mustard/90 transition-colors">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
