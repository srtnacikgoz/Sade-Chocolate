import React, { useState, useMemo } from 'react';
import { ShoppingCart, Package, Clock, CheckCircle, XCircle, Search, ChevronDown, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { UnifiedOrderModal } from '../UnifiedOrderModal';

export interface Order {
  id: string;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: any;
  updatedAt?: any;
  giftDetails?: {
    isGift: boolean;
    note: string;
    fontFamily: string;
    recipientName: string;
  };
  weatherAlert?: {
    temp: number;
    requiresIce: boolean;
  };
  logistics?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    shippedAt?: Date;
  };
}

interface OrdersTabProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, updateOrderStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statusConfig = {
    pending: { label: 'Beklemede', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
    processing: { label: 'İşleniyor', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Package },
    shipped: { label: 'Kargoda', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: ShoppingCart },
    delivered: { label: 'Teslim Edildi', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle },
    cancelled: { label: 'İptal', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  };

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, order) => acc + order.total, 0),
  }), [orders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Toplam Sipariş', val: stats.total, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: 'Bekleyen', val: stats.pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600', critical: stats.pending > 0 },
          { label: 'İşleniyor', val: stats.processing, icon: Package, color: 'bg-purple-50 text-purple-600' },
          { label: 'Toplam Gelir', val: `₺${stats.totalRevenue.toLocaleString()}`, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-dark-800 p-7 rounded-[32px] border border-gray-200 shadow-sm relative overflow-hidden group">
            {item.critical && <div className="absolute top-3 right-3 bg-yellow-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse z-10">YENİ</div>}
            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <div className="text-3xl font-display font-bold leading-none text-gray-900 dark:text-white">{item.val}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setStatusFilter('all')} className={`px-7 py-2.5 text-[10px] font-black rounded-xl transition-all ${statusFilter === 'all' ? 'bg-white shadow-md text-brown-900' : 'text-gray-400 hover:text-slate-600'}`}>
              TÜMÜ
            </button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as Order['status'])}
                className={`px-7 py-2.5 text-[10px] font-black rounded-xl transition-all ${statusFilter === status ? 'bg-white shadow-md text-brown-900' : 'text-gray-400 hover:text-slate-600'}`}
              >
                {config.label.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş veya Müşteri Ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-brown-900/10 outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 font-medium">Sipariş bulunamadı</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
              const isExpanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className="transition-all">
                  {/* Order Row */}
                  <div
                    className="p-6 hover:bg-slate-50/50 cursor-pointer transition-all"
                    onClick={() => toggleOrderDetails(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className="font-mono text-sm font-bold text-gray-400 hover:text-brown-900 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                            >
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${config.color}`}>
                              {config.label.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span
                              className="flex items-center gap-1 hover:text-brown-900 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                            >
                              <User size={14} />
                              {order.customerInfo.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {format(orderDate, 'dd MMM yyyy, HH:mm', { locale: tr })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-400 font-medium">{order.items.length} ürün</div>
                          <div className="text-xl font-display font-bold text-brown-900">₺{order.total.toFixed(2)}</div>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-slate-50/30 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Customer Info */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200">
                          <h4 className="font-display font-bold text-sm mb-4 text-gray-900">Müşteri Bilgileri</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <User size={16} className="text-gray-400" />
                              <span>{order.customerInfo.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail size={16} className="text-gray-400" />
                              <span>{order.customerInfo.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone size={16} className="text-gray-400" />
                              <span>{order.customerInfo.phone}</span>
                            </div>
                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin size={16} className="text-gray-400 mt-0.5" />
                              <span className="flex-1">{order.customerInfo.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200">
                          <h4 className="font-display font-bold text-sm mb-4 text-gray-900">Sipariş Detayları</h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                    {item.image ? (
                                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package size={16} className="text-gray-300" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{item.title}</div>
                                    <div className="text-xs text-gray-500">x{item.quantity}</div>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-gray-700">₺{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                              <span className="font-bold text-gray-900">Toplam</span>
                              <span className="font-display font-bold text-lg text-brown-900">₺{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="mt-4 bg-white p-4 rounded-2xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-700">Sipariş Durumunu Güncelle:</span>
                          <div className="flex gap-2">
                            {Object.entries(statusConfig).map(([status, config]) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, status as Order['status']);
                                }}
                                disabled={order.status === status}
                                className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${
                                  order.status === status
                                    ? config.color + ' border'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                } disabled:cursor-not-allowed`}
                              >
                                {config.label.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Unified Order & Customer Modal */}
      {selectedOrder && (
        <UnifiedOrderModal
          order={selectedOrder}
          allOrders={orders}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
        />
      )}
    </div>
  );
};
