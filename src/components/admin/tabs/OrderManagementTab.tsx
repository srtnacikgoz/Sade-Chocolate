import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  AlertTriangle,
  Gift,
  Thermometer,
  CheckCircle2,
  CheckCircle,
  Package,
  ChevronRight,
  Search,
  X,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  FileText,
  Printer,
  Download,
  ChevronDown,
  Send,
  Truck,
  Tag,
  Edit,
  RefreshCw,
  XCircle,
  Landmark,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useOrderStore } from '../../../stores/orderStore';
import type { Order } from '../../../types/order';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { ToastContainer } from '../../ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { cleanupInvalidOrders } from '../../../services/cleanupOrders';
import { seedMockOrders } from '../../../services/seedOrders';
import { TierBadge } from '../../ui/TierBadge';
import type { LoyaltyTier } from '../../../types/loyalty';
import { CreateShipmentModal } from '../CreateShipmentModal';
import { sendDeliveryConfirmationEmail, sendShippingNotificationEmail, sendPaymentSupportEmail, generatePaymentSupportEmailHtml, checkEmailDeliveryStatus } from '../../../services/emailService';
import type { PaymentSupportEmailData } from '../../../services/emailService';
import { checkSingleShipmentStatus, checkAllShipmentStatus } from '../../../services/shippingService';
import { useCompanyInfo } from '../../../hooks/useCompanyInfo';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// --- EFT COUNTDOWN TIMER ---
const EftCountdown = ({ deadline, compact = false }: { deadline: string; compact?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; expired: boolean } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadlineTime = new Date(deadline).getTime();
      const now = Date.now();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  if (timeLeft.expired) {
    return (
      <span className={`flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-xs'} text-red-600 font-bold`}>
        <XCircle size={compact ? 10 : 12} />
        Süre Doldu
      </span>
    );
  }

  const isUrgent = timeLeft.hours < 2;

  if (compact) {
    return (
      <span className={`flex items-center gap-1 text-[8px] font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
        <Clock size={10} />
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <Clock size={14} className={isUrgent ? 'text-red-500' : 'text-amber-500'} />
      <span className={`font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
      <span className={`text-xs ${isUrgent ? 'text-red-500' : 'text-amber-500'}`}>kaldı</span>
    </div>
  );
};

// --- STATUS BADGE ---
const StatusBadge = ({ status }: { status: Order['status'] | string }) => {
  const styles: Record<string, string> = {
    'Pending Payment': 'bg-amber-100 text-amber-700 border-amber-300',
    'pending': 'bg-amber-100 text-amber-700 border-amber-300',
    'Awaiting Prep': 'bg-brand-peach/30 text-brand-orange border-brand-peach',
    'processing': 'bg-brand-peach/30 text-brand-orange border-brand-peach',
    'In Production': 'bg-brand-yellow/30 text-brand-mustard border-brand-yellow',
    'Ready for Packing': 'bg-brand-blue/30 text-blue-700 border-brand-blue',
    'Heat Hold': 'bg-orange-100 text-orange-700 border-orange-300',
    'Shipped': 'bg-brand-green/30 text-green-700 border-brand-green',
    'Cancelled': 'bg-red-50 text-red-600 border-red-200',
    'Refunded': 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const labels: Record<string, string> = {
    'Pending Payment': 'Ödeme Bekleniyor',
    'pending': 'Ödeme Bekleniyor',
    'Awaiting Prep': 'Hazırlık Bekliyor',
    'processing': 'Hazırlanıyor',
    'In Production': 'Üretimde',
    'Ready for Packing': 'Paketlemeye Hazır',
    'Heat Hold': 'Isı Beklemesi',
    'Shipped': 'Kargoya Verildi',
    'Cancelled': 'İptal Edildi',
    'Refunded': 'İade Edildi'
  };

  const style = styles[status] || 'bg-cream-100 text-mocha-700 border-cream-200';
  const label = labels[status] || status;

  return (
    <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded-full border font-bold ${style}`}>
      {label}
    </span>
  );
};

// --- EMAIL CONFIRMATION MODAL ---
const EmailConfirmationModal = ({ order, onClose, onSend }: { order: Order; onClose: () => void; onSend: () => void }) => {
  const { companyInfo, city } = useCompanyInfo();
  const handleSend = () => {
    onSend();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">Sipariş Onayı Gönder</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">Müşteriye sipariş onay e-postası gönderilecek</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] space-y-6">
          {/* Recipient */}
          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200">
            <p className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-2">Alıcı</p>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-brand-blue" />
              <div>
                <p className="text-sm font-medium text-mocha-900">{order.customer?.name || 'İsimsiz Müşteri'}</p>
                <p className="text-xs text-mocha-500">{order.customer?.email || 'Email Yok'}</p>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Email Header */}
            <div className="bg-gradient-to-r from-brand-mustard to-brand-orange p-6 text-center">
              <h4 className="text-xl font-semibold text-white mb-1">Sade Chocolate</h4>
              <p className="text-xs text-white/80 uppercase tracking-wider">{companyInfo.slogan || 'El Yapımı Artisan Çikolata'}</p>
            </div>

            {/* Email Body */}
            <div className="p-6 bg-white space-y-5">
              {/* Greeting */}
              <div>
                <p className="text-base font-medium text-mocha-900 mb-2">Merhaba {(order.customer?.name || '').split(' ')[0] || 'Değerli Müşterimiz'},</p>
                <p className="text-sm text-mocha-600 leading-relaxed">
                  Siparişiniz başarıyla alındı ve işleme başlandı! Özenle hazırlayacağımız çikolatalarınız kısa süre içinde kapınıza ulaşacak.
                </p>
              </div>

              {/* Order Summary */}
              <div className="p-5 bg-gradient-to-br from-cream-100 to-brand-peach/10 rounded-2xl border border-brand-peach/30">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-wider text-brand-mustard font-bold">Sipariş Detayları</p>
                  <p className="text-xs font-mono font-bold text-mocha-900">#{order.orderNumber || order.id}</p>
                </div>

                <div className="space-y-3 mb-4">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : '🍫'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-mocha-900">{item.name}</p>
                        <p className="text-xs text-mocha-500">Adet: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-mocha-900">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-brand-peach/50 space-y-1">
                  <div className="flex justify-between text-xs text-mocha-600">
                    <span>Ara Toplam</span>
                    <span>₺{(order.payment?.subtotal || 0).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-mocha-600">
                    <span>Kargo</span>
                    <span>₺{(order.payment?.shipping || 0).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-mocha-900 pt-2 border-t border-brand-peach/50">
                    <span>Toplam</span>
                    <span className="text-brand-mustard">₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/30">
                <div className="flex items-start gap-3">
                  <Truck size={20} className="text-brand-blue shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-mocha-900 mb-1">Teslimat Bilgileri</p>
                    <p className="text-xs text-mocha-600 mb-1">{order.shipping?.address || 'Adres yok'}, {order.shipping?.city || 'Şehir yok'}</p>
                    <p className="text-xs text-brand-blue font-medium">
                      Tahmini Teslimat: {order.shipping?.estimatedDate || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logistics Info */}
              {(order.logistics?.coldPackage || order.tempAlert) && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-start gap-3">
                    <Thermometer size={20} className="text-orange-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-orange-600 mb-1">Özel Lojistik Uyarısı</p>
                      {order.logistics?.coldPackage && (
                        <p className="text-xs text-mocha-600 mb-1">
                          ❄️ Çikolatalarınız soğuk paket ile korunarak gönderilecektir.
                        </p>
                      )}
                      <p className="text-xs text-mocha-600">
                        🕐 Kargo Penceresi: {order.logistics?.shippingWindow || 'N/A'}
                      </p>
                      <p className="text-xs text-mocha-500 mt-2 italic">
                        Ürünleriniz kalitesini korumak için özel paketleme uygulanmaktadır.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gift Note */}
              {order.gift && order.giftNote && (
                <div className="p-4 bg-brand-peach/20 rounded-xl border border-brand-peach">
                  <div className="flex items-start gap-3">
                    <Gift size={20} className="text-brand-orange shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-brand-orange mb-1">Hediye Notu</p>
                      <p className="text-xs text-mocha-700 italic">"{order.giftNote}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Notes */}
              {order.specialNotes && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FileText size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-blue-600 mb-1">Özel Not / Talimat</p>
                      <p className="text-xs text-mocha-700">{order.specialNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Track Order Button */}
              <div className="pt-4 border-t border-cream-200">
                <a
                  href="#"
                  className="block w-full py-3 bg-brand-mustard hover:bg-brand-orange text-white text-center text-sm font-medium rounded-xl transition-colors"
                >
                  🔍 Siparişimi Takip Et
                </a>
              </div>

              {/* Customer Service */}
              <div className="pt-4 border-t border-cream-200 space-y-3">
                <p className="text-xs text-mocha-600">
                  Sorularınız için bize ulaşabilirsiniz:
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 text-mocha-600">
                    <Mail size={14} className="text-brand-blue" />
                    <a href={`mailto:${companyInfo.generalEmail}`} className="hover:text-brand-mustard">{companyInfo.generalEmail}</a>
                  </div>
                  <div className="flex items-center gap-2 text-mocha-600">
                    <Phone size={14} className="text-brand-green" />
                    <a href={`tel:${companyInfo.generalPhone.replace(/\s/g, '')}`} className="hover:text-brand-mustard">{companyInfo.generalPhone}</a>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="pt-4 border-t border-cream-200">
                <p className="text-xs text-mocha-500 italic mb-3">
                  Güzel tatlar dileriz,<br />
                  <span className="font-medium text-mocha-900">Sade Chocolate Ekibi</span>
                </p>
                {/* Social Media */}
                <div className="flex items-center gap-3">
                  <p className="text-xs text-mocha-400 uppercase tracking-wider">Bizi Takip Edin:</p>
                  <div className="flex gap-2">
                    <a href="#" className="w-6 h-6 bg-brand-peach rounded-full flex items-center justify-center hover:bg-brand-orange transition-colors">
                      <span className="text-xs">📷</span>
                    </a>
                    <a href="#" className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center hover:bg-brand-mustard transition-colors">
                      <span className="text-xs">𝕏</span>
                    </a>
                    <a href="#" className="w-6 h-6 bg-brand-green rounded-full flex items-center justify-center hover:bg-brand-mustard transition-colors">
                      <span className="text-xs">💼</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Footer */}
            <div className="bg-cream-50 p-4 text-center border-t border-cream-200">
              <p className="text-xs text-mocha-400 uppercase tracking-wider mb-1">{companyInfo.slogan || 'El Yapımı Artisan Çikolata'}</p>
              <p className="text-xs text-mocha-400">© {new Date().getFullYear()} {companyInfo.brandName} • {city}, Türkiye</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSend}
            className="px-6 py-3 rounded-2xl bg-brand-mustard hover:bg-brand-orange text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            E-posta Gönder
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CANCEL ORDER MODAL ---
const CancelOrderModal = ({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (cancelData: any) => void }) => {
  const [cancelReason, setCancelReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [refundPayment, setRefundPayment] = useState(true);
  const [notes, setNotes] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [showError, setShowError] = useState(false);

  const cancelReasons = [
    'Stok Yetersizliği',
    'Üretim Sorunu',
    'Müşteri Talebi',
    'Ödeme Alınamadı',
    'Teslimat İmkansız',
    'Sistem Hatası',
    'Diğer'
  ];

  const handleCancel = () => {
    if (!cancelReason) {
      setShowError(true);
      return;
    }

    const cancelData = {
      reason: cancelReason,
      notifyCustomer,
      refundPayment,
      notes
    };

    onConfirm(cancelData);
    onClose();
  };

  const isConfirmValid = confirmChecked && cancelReason;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-sm border-2 border-red-500">
        {/* Header */}
        <div className="p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <XCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl text-red-900 italic">Siparişi İptal Et</h3>
                <p className="text-xs text-red-600">Bu işlem geri alınamaz!</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors">
              <X size={20} className="text-red-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)] space-y-6">
          {/* Warning */}
          <div className="p-4 bg-red-50 border-2 border-red-500 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-2">DİKKAT: KRİTİK İŞLEM</p>
                <p className="text-xs text-red-700 leading-relaxed">
                  Sipariş #{order.id} kalıcı olarak iptal edilecektir. Bu işlem geri alınamaz.
                  Müşteri bilgilendirilecek ve ödeme iadesi işlemi başlatılacaktır.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200">
            <p className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">İptal Edilecek Sipariş</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
  <span className="text-mocha-600">Müşteri:</span>
  <span className="font-medium text-mocha-900">{order.customer?.name || 'İsimsiz'}</span>
</div>
<div className="flex justify-between">
  <span className="text-mocha-600">Tutar:</span>
  <span className="font-bold text-mocha-900">₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</span>
</div>
              <div className="flex justify-between">
                <span className="text-mocha-600">Durum:</span>
                <span className="text-mocha-900">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Cancel Reason */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              İptal Nedeni *
            </label>
            <select
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                setShowError(false);
              }}
              className={`w-full px-4 py-3 bg-cream-50 border rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                showError && !cancelReason
                  ? 'border-red-500'
                  : 'border-cream-200'
              }`}
            >
              <option value="">Neden seçin...</option>
              {cancelReasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            {showError && !cancelReason && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                Lütfen iptal nedeni seçin
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 cursor-pointer hover:border-brand-mustard transition-colors">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-5 h-5 rounded border-cream-200 text-brand-mustard focus:ring-brand-mustard"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-mocha-900">Müşteriyi Bilgilendir</p>
                <p className="text-xs text-mocha-500">İptal e-postası gönder</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 cursor-pointer hover:border-brand-mustard transition-colors">
              <input
                type="checkbox"
                checked={refundPayment}
                onChange={(e) => setRefundPayment(e.target.checked)}
                className="w-5 h-5 rounded border-cream-200 text-brand-mustard focus:ring-brand-mustard"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-mocha-900">Otomatik İade Başlat</p>
                <p className="text-xs text-mocha-500">₺{(order.payment?.total || 0).toLocaleString('tr-TR')} iade edilecek</p>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              İç Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="İptal nedeni hakkında ek bilgiler (sadece personel görecek)..."
              rows={3}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-brand-mustard resize-none"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div>
            <label className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border-2 border-red-500 cursor-pointer hover:bg-red-100 transition-colors">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">
                  Evet, bu siparişi iptal etmek istiyorum
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Bu işlemin geri alınamayacağını anlıyorum
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 bg-cream-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-700 hover:bg-cream-100 transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={handleCancel}
            disabled={!isConfirmValid}
            className={`px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all flex items-center gap-2 ${
              isConfirmValid
                ? 'bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-xl'
                : 'bg-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            <XCircle size={16} />
            Siparişi İptal Et
          </button>
        </div>
      </div>
    </div>
  );
};

// --- STATUS CHANGE MODAL ---
const StatusChangeModal = ({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (newStatus: Order['status']) => void }) => {
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);

  const statuses: Array<{ value: Order['status']; label: string; color: string; icon: any }> = [
    { value: 'Pending Payment', label: 'Ödeme Bekleniyor', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
    { value: 'Awaiting Prep', label: 'Hazırlık Bekliyor', color: 'bg-brand-peach/30 text-brand-orange border-brand-peach', icon: Clock },
    { value: 'In Production', label: 'Üretimde', color: 'bg-brand-yellow/30 text-brand-mustard border-brand-yellow', icon: Package },
    { value: 'Ready for Packing', label: 'Paketlemeye Hazır', color: 'bg-brand-blue/30 text-blue-700 border-brand-blue', icon: Package },
    { value: 'Heat Hold', label: 'Isı Beklemesi', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Thermometer },
    { value: 'Shipped', label: 'Kargoya Verildi', color: 'bg-brand-green/30 text-green-700 border-brand-green', icon: Truck },
    { value: 'Delivered', label: 'Teslim Edildi', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle },
    { value: 'Cancelled', label: 'İptal Edildi', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
    { value: 'Refunded', label: 'İade Edildi', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: RefreshCw }
  ];

  const handleSave = () => {
    if (selectedStatus !== order.status) {
      onSave(selectedStatus);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">Sipariş Durumunu Değiştir</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">Sipariş #{order.id}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] space-y-4">
          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200">
            <p className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-2">Mevcut Durum</p>
            <div className="flex items-center gap-3">
              {React.createElement(statuses.find(s => s.value === order.status)?.icon || Clock, { size: 20, className: 'text-mocha-500' })}
              <span className="font-medium text-mocha-900">
                {statuses.find(s => s.value === order.status)?.label || order.status}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Yeni Durum Seçin
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {statuses.map((status) => {
                const Icon = status.icon;
                const isSelected = selectedStatus === status.value;
                const isCurrent = order.status === status.value;

                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    disabled={isCurrent}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      isCurrent
                        ? 'bg-cream-100 border-cream-200 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-brand-mustard/10 border-brand-mustard shadow-sm'
                        : 'border-cream-200 hover:border-brand-mustard hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-brand-mustard text-white' : 'bg-cream-100 text-mocha-500'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-mocha-900">{status.label}</p>
                        {isCurrent && <p className="text-xs text-mocha-500 mt-1">Mevcut Durum</p>}
                      </div>
                      {isSelected && !isCurrent && (
                        <CheckCircle2 size={20} className="text-brand-mustard shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStatus !== order.status && (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Not:</strong> Sipariş durumu "{statuses.find(s => s.value === order.status)?.label}" → "{statuses.find(s => s.value === selectedStatus)?.label}" olarak değiştirilecektir.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 bg-cream-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-100 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={selectedStatus === order.status}
            className={`px-6 py-3 rounded-2xl text-white text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedStatus === order.status
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-mustard hover:bg-brand-orange'
            }`}
          >
            <CheckCircle2 size={16} />
            Durumu Güncelle
          </button>
        </div>
      </div>
    </div>
  );
};

// --- REFUND MODAL ---
const RefundModal = ({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (refundData: any) => void }) => {
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(order.payment?.total || 0);
  const [refundMethod, setRefundMethod] = useState('original');
  const [notes, setNotes] = useState('');

  const refundReasons = [
    'Ürün Hasarlı/Kusurlu',
    'Yanlış Ürün Gönderildi',
    'Müşteri Vazgeçti',
    'Kalite Sorunu',
    'Teslimat Gecikmesi',
    'Diğer'
  ];

  const refundMethods = [
    { value: 'original', label: 'Orijinal Ödeme Yöntemine İade', icon: '💳' },
    { value: 'credit', label: 'Hesap Kredisi', icon: '💰' },
    { value: 'coupon', label: 'İndirim Kuponu', icon: '🎟️' }
  ];

  const handleSave = () => {
    const orderTotal = order.payment?.total || 0;

    if (!refundReason) {
      alert('⚠️ Lütfen iade nedeni seçin');
      return;
    }
    if (refundAmount <= 0 || refundAmount > orderTotal) {
      alert('⚠️ Geçersiz iade tutarı');
      return;
    }

    const refundData = {
      reason: refundReason,
      amount: refundAmount,
      method: refundMethod,
      notes,
      percentage: orderTotal > 0 ? ((refundAmount / orderTotal) * 100).toFixed(0) : '0'
    };

    onSave(refundData);
    onClose();
  };

  const isPartialRefund = refundAmount < (order.payment?.total || 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">İade Başlat</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">Sipariş #{order.id} • Toplam: ₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Refund Reason */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              İade Nedeni *
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
            >
              <option value="">Neden seçin...</option>
              {refundReasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              İade Tutarı *
            </label>
            <div className="relative">
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                min="0"
                max={order.payment?.total || 0}
                step="0.01"
                className="w-full px-4 py-3 pr-12 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-mocha-400">₺</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setRefundAmount((order.payment?.total || 0) / 2)}
                className="px-3 py-1.5 text-xs bg-cream-100 text-mocha-600 rounded-lg hover:bg-cream-200 transition-colors"
              >
                50%
              </button>
              <button
                onClick={() => setRefundAmount(order.payment?.total || 0)}
                className="px-3 py-1.5 text-xs bg-brand-mustard/20 text-brand-mustard rounded-lg hover:bg-brand-mustard/30 transition-colors"
              >
                Tam İade
              </button>
            </div>
            {isPartialRefund && (
              <p className="mt-2 text-xs text-orange-600">
                ⚠️ Kısmi iade: %{(order.payment?.total || 0) > 0 ? ((refundAmount / (order.payment?.total || 1)) * 100).toFixed(0) : '0'}
              </p>
            )}
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              İade Yöntemi
            </label>
            <div className="space-y-2">
              {refundMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setRefundMethod(method.value)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                    refundMethod === method.value
                      ? 'border-brand-mustard bg-brand-mustard/10'
                      : 'border-cream-200 hover:border-brand-mustard/50'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="text-sm font-medium text-mocha-900">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Açıklama / Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="İade ile ilgili ek bilgiler, müşteri ile yapılan görüşme notları..."
              rows={4}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-brand-mustard resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <RefreshCw size={20} className="text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-600 mb-2">İade Özeti</p>
                <div className="space-y-1 text-xs text-mocha-600">
                  <div className="flex justify-between">
                    <span>İade Tutarı:</span>
                    <span className="font-bold text-mocha-900">₺{refundAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>İade Yöntemi:</span>
                    <span className="font-medium text-mocha-900">
                      {refundMethods.find(m => m.value === refundMethod)?.label}
                    </span>
                  </div>
                  {isPartialRefund && (
                    <div className="pt-2 border-t border-orange-200 flex justify-between">
                      <span>Kalan Bakiye:</span>
                      <span className="font-bold text-green-600">₺{((order.payment?.total || 0) - refundAmount).toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            İadeyi Başlat
          </button>
        </div>
      </div>
    </div>
  );
};

// --- EDIT ORDER MODAL ---
const EditOrderModal = ({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (updates: any) => void }) => {
  const [shippingAddress, setShippingAddress] = useState(order.shipping?.address || '');
  const [shippingCity, setShippingCity] = useState(order.shipping?.city || '');
  const [customerPhone, setCustomerPhone] = useState(order.customer?.phone || '');
  const [giftNote, setGiftNote] = useState(order.giftNote || '');
  const [specialNotes, setSpecialNotes] = useState(order.specialNotes || '');

  const handleSave = () => {
    const updates: any = {};

    // Build shipping object with only defined values
    if (shippingAddress || shippingCity) {
      const shippingUpdate: any = {};
      if (order.shipping?.method) shippingUpdate.method = order.shipping.method;
      if (shippingAddress) shippingUpdate.address = shippingAddress;
      if (shippingCity) shippingUpdate.city = shippingCity;
      if (order.shipping?.estimatedDate) shippingUpdate.estimatedDate = order.shipping.estimatedDate;
      updates.shipping = shippingUpdate;
    }

    // Build customer object with only defined values
    if (customerPhone) {
      const customerUpdate: any = {};
      if (order.customer?.name) customerUpdate.name = order.customer.name;
      if (order.customer?.email) customerUpdate.email = order.customer.email;
      if (customerPhone) customerUpdate.phone = customerPhone;
      updates.customer = customerUpdate;
    }

    if (giftNote !== undefined) {
      updates.giftNote = giftNote || null;
    }

    if (specialNotes !== undefined) {
      updates.specialNotes = specialNotes || null;
    }

    onSave(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">Siparişi Düzenle</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">Sipariş #{order.id}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Customer Info */}
          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200">
            <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-brand-mustard text-white rounded-full flex items-center justify-center font-bold text-sm">
  {(order.customer?.name || '?')[0]}
</div>
              <div>
                <p className="text-sm font-medium text-mocha-900">{order.customer?.name || 'İsimsiz Müşteri'}</p>
                <p className="text-xs text-mocha-500">{order.customer?.email || 'Email Yok'}</p>
              </div>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-2">
              Telefon Numarası
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream-200 rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
            />
          </div>

          {/* Shipping Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Teslimat Adresi
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-brand-mustard resize-none"
            />
          </div>

          {/* Shipping City */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Şehir
            </label>
            <input
              type="text"
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
            />
          </div>

          {/* Gift Note */}
          {order.gift && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3 flex items-center gap-2">
                <Gift size={14} className="text-brand-orange" />
                Hediye Notu
              </label>
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Hediye mesajınızı buraya yazın..."
                rows={3}
                className="w-full px-4 py-3 bg-brand-peach/10 border border-brand-peach rounded-2xl text-sm text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
              />
            </div>
          )}

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Özel Notlar / Talimatlar
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Paketleme, teslimat veya diğer özel talimatlar..."
              rows={4}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-brand-mustard resize-none"
            />
          </div>

          {/* Warning */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-600 mb-1">Dikkat</p>
                <p className="text-xs text-mocha-600">
                  Sipariş üretim aşamasında ise, bazı değişiklikler uygulanamayabilir. Lütfen üretim ekibiyle koordine olun.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-brand-mustard hover:bg-brand-orange text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// --- TAG MODAL ---
const TagModal = ({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (tag: string, color: string) => void }) => {
  const [selectedTag, setSelectedTag] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const predefinedTags = [
    { label: 'VIP Müşteri', value: 'vip', color: 'yellow' },
    { label: 'Acil', value: 'urgent', color: 'orange' },
    { label: 'Hediye Paketi', value: 'gift', color: 'peach' },
    { label: 'Kurumsal', value: 'corporate', color: 'blue' },
    { label: 'İlk Sipariş', value: 'first-order', color: 'green' },
    { label: 'Tekrar Eden', value: 'returning', color: 'mustard' },
  ];

  const colors = [
    { name: 'blue', bg: 'bg-brand-blue', text: 'text-blue-900' },
    { name: 'yellow', bg: 'bg-brand-yellow', text: 'text-yellow-900' },
    { name: 'mustard', bg: 'bg-brand-mustard', text: 'text-white' },
    { name: 'green', bg: 'bg-brand-green', text: 'text-green-900' },
    { name: 'peach', bg: 'bg-brand-peach', text: 'text-orange-900' },
    { name: 'orange', bg: 'bg-brand-orange', text: 'text-white' },
  ];

  const handleSave = () => {
    const tagToSave = selectedTag || customTag;
    if (!tagToSave.trim()) {
      alert('⚠️ Lütfen bir etiket seçin veya oluşturun');
      return;
    }
    onSave(tagToSave, selectedColor);
    onClose();
  };

  const handlePredefinedSelect = (value: string, color: string) => {
    setSelectedTag(value);
    setCustomTag('');
    setSelectedColor(color);
  };

  const activeTag = selectedTag || customTag;
  const activeColor = colors.find(c => c.name === selectedColor) || colors[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">Etiket Ekle</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">Sipariş #{order.id}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Predefined Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Hazır Etiketler
            </label>
            <div className="grid grid-cols-2 gap-3">
              {predefinedTags.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => handlePredefinedSelect(tag.value, tag.color)}
                  className={`px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                    selectedTag === tag.value
                      ? 'border-brand-mustard bg-brand-mustard/10 text-mocha-900'
                      : 'border-cream-200 text-mocha-600 hover:border-brand-mustard/50'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tag */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Özel Etiket Oluştur
            </label>
            <input
              type="text"
              value={customTag}
              onChange={(e) => {
                setCustomTag(e.target.value);
                setSelectedTag('');
              }}
              placeholder="Örn: Özel İstek"
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Renk Seçin
            </label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-10 h-10 rounded-full ${color.bg} border-4 transition-all ${
                    selectedColor === color.name
                      ? 'border-brown-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {activeTag && (
            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
              <p className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">Önizleme</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${activeColor.bg} ${activeColor.text}`}>
                  <Tag size={12} />
                  {activeTag}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-brand-mustard hover:bg-brand-orange text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Tag size={16} />
            Etiketi Ekle
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SHIPPING LABEL MODAL ---
const ShippingLabelModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'geliver' | 'packing'>('geliver');

  const hasGeliverLabel = order.tracking?.labelUrl;
  const trackingUrl = `https://sadechocolate.com/hesabim?view=orders&track=${order.orderNumber || order.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}`;

  const handleOpenGeliverLabel = () => {
    if (order.tracking?.labelUrl) {
      window.open(order.tracking.labelUrl, '_blank');
    }
  };

  const handlePrintPackingSlip = () => {
    const content = document.getElementById('packing-slip-content')?.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow && content) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Paketleme Fişi - ${order.orderNumber || order.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', sans-serif; padding: 15mm; background: white; }
              .slip { max-width: 100mm; margin: 0 auto; }
              .logo { text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin-bottom: 5mm; color: #4a3728; }
              .divider { border-top: 1px dashed #ccc; margin: 4mm 0; }
              .section-title { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 2mm; }
              .order-info { text-align: center; margin-bottom: 4mm; }
              .order-number { font-size: 14px; font-weight: bold; }
              .order-date { font-size: 10px; color: #666; }
              .customer-name { font-size: 12px; font-weight: 600; margin-bottom: 2mm; }
              .items { margin: 4mm 0; }
              .item { display: flex; justify-content: space-between; font-size: 10px; padding: 1mm 0; }
              .item-name { flex: 1; }
              .item-qty { width: 20mm; text-align: right; }
              .thank-you { text-align: center; margin-top: 6mm; padding: 4mm; background: #f9f5f0; border-radius: 3mm; }
              .thank-you-text { font-size: 11px; font-style: italic; color: #4a3728; }
              .thank-you-sub { font-size: 9px; color: #888; margin-top: 2mm; }
              .qr-section { text-align: center; margin-top: 5mm; }
              .qr-section img { width: 20mm; height: 20mm; }
              .qr-text { font-size: 8px; color: #888; margin-top: 1mm; }
              .tracking { text-align: center; margin-top: 3mm; }
              .tracking-label { font-size: 8px; color: #888; }
              .tracking-number { font-size: 11px; font-weight: bold; font-family: monospace; letter-spacing: 1px; }
              @media print {
                @page { size: 100mm auto; margin: 5mm; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-sm max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl text-mocha-900 italic">Paketleme & Etiket</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('geliver')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'geliver'
                  ? 'bg-brown-900 text-white'
                  : 'bg-cream-100 text-mocha-600 hover:bg-cream-200'
              }`}
            >
              <Truck size={14} className="inline mr-2" />
              Kargo Etiketi
            </button>
            <button
              onClick={() => setActiveTab('packing')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'packing'
                  ? 'bg-brown-900 text-white'
                  : 'bg-cream-100 text-mocha-600 hover:bg-cream-200'
              }`}
            >
              <Package size={14} className="inline mr-2" />
              Paketleme Fişi
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-cream-50">
          {activeTab === 'geliver' ? (
            <div className="space-y-4">
              {/* Geliver Label Info */}
              {hasGeliverLabel ? (
                <div className="bg-white rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-mocha-900">Kargo Etiketi Hazır</p>
                    <p className="text-sm text-mocha-500 mt-1">
                      {order.tracking?.carrier || 'Geliver'} tarafından oluşturuldu
                    </p>
                  </div>

                  {/* Tracking Info */}
                  <div className="bg-cream-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-mocha-500">Barkod:</span>
                      <span className="font-mono font-bold">{order.tracking?.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-mocha-500">Kargo Firması:</span>
                      <span className="font-bold">{order.tracking?.carrier}</span>
                    </div>
                    {order.tracking?.price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-mocha-500">Ücret:</span>
                        <span className="font-bold">{order.tracking.price.toFixed(2)}₺</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleOpenGeliverLabel}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-brown-900 to-brown-700 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={18} />
                    Kargo Etiketini Aç (PDF)
                  </button>
                  <p className="text-xs text-mocha-400">Yeni sekmede açılır, yazdırabilirsiniz</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle size={32} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-mocha-900">Kargo Henüz Oluşturulmadı</p>
                    <p className="text-sm text-mocha-500 mt-1">
                      Önce "Kargo Oluştur" ile Geliver üzerinden kargo oluşturun
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Packing Slip Preview */}
              <div className="bg-white rounded-2xl p-4 mx-auto" style={{ maxWidth: '300px' }}>
                <div id="packing-slip-content">
                  <div className="slip">
                    <div className="logo">SADE CHOCOLATE</div>
                    <div className="divider"></div>

                    <div className="order-info">
                      <div className="order-number">#{order.orderNumber || order.id}</div>
                      <div className="order-date">
                        {new Date((order.createdAt as any)?.toDate?.() || order.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="section-title">Alıcı</div>
                    <div className="customer-name">{order.customer?.name || 'Değerli Müşterimiz'}</div>

                    <div className="divider"></div>

                    <div className="section-title">Ürünler</div>
                    <div className="items">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="divider"></div>

                    <div className="thank-you">
                      <div className="thank-you-text">Bizi tercih ettiğiniz için teşekkür ederiz!</div>
                      <div className="thank-you-sub">El yapımı çikolatalarımızı severek yemeniz dileğiyle...</div>
                    </div>

                    {order.tracking?.trackingNumber && (
                      <>
                        <div className="tracking">
                          <div className="tracking-label">Kargo Takip</div>
                          <div className="tracking-number">{order.tracking.trackingNumber}</div>
                        </div>
                        <div className="qr-section">
                          <img src={qrCodeUrl} alt="QR Code" />
                          <div className="qr-text">Kargo takibi için tarayın</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            Kapat
          </button>
          {activeTab === 'packing' && (
            <button
              onClick={handlePrintPackingSlip}
              className="px-6 py-3 rounded-2xl bg-brand-mustard hover:bg-brand-orange text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Printer size={16} />
              Paketleme Fişini Yazdır
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- TRACKING NUMBER MODAL ---
const TrackingNumberModal = ({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (carrier: string, trackingNumber: string) => void }) => {
  const [carrier, setCarrier] = useState('Aras Kargo');
  const [trackingNumber, setTrackingNumber] = useState('');

  const carriers = ['Aras Kargo', 'Yurtiçi Kargo', 'MNG Kargo', 'UPS', 'DHL', 'Sürat Kargo'];

  const handleSave = () => {
    if (!trackingNumber.trim()) {
      alert('⚠️ Lütfen takip numarası girin');
      return;
    }
    onSave(carrier, trackingNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">Takip Numarası Ekle</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">Sipariş #{order.id}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Carrier Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Kargo Firması
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
            >
              {carriers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tracking Number Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">
              Takip Numarası
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Örn: 1234567890123"
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-mocha-900 placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-brand-mustard"
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/30">
            <div className="flex items-start gap-3">
              <Package size={20} className="text-brand-blue shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-mocha-900 mb-1">Kargo Bilgisi</p>
                <p className="text-xs text-mocha-600">
                  {carrier} {trackingNumber && `• ${trackingNumber}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-brand-mustard hover:bg-brand-orange text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Package size={16} />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PRINT ORDER MODAL ---
const PrintOrderModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const { companyInfo, city } = useCompanyInfo();
  const handlePrint = () => {
    // Create print content HTML
    const printContent = document.getElementById('print-document-content')?.innerHTML;

    // Open new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow && printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Sipariş #${order.id}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 40px;
                background: white;
                color: #1a0f0a;
              }
              .print-doc {
                max-width: 210mm;
                margin: 0 auto;
              }
              h1 {
                font-family: 'Georgia', serif;
                font-style: italic;
                font-size: 28px;
                margin-bottom: 4px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th {
                text-align: left;
                padding: 12px 8px;
                border-bottom: 2px solid #e5e5e5;
                font-size: 11px;
                text-transform: uppercase;
                font-weight: 600;
                color: #666;
              }
              td {
                padding: 12px 8px;
                border-bottom: 1px solid #f5f5f5;
                font-size: 14px;
              }
              .section {
                margin: 30px 0;
              }
              .section-title {
                font-size: 11px;
                text-transform: uppercase;
                font-weight: 600;
                color: #666;
                margin-bottom: 12px;
                letter-spacing: 1px;
              }
              .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 20px 0;
              }
              .info-line {
                margin: 8px 0;
                font-size: 14px;
              }
              .total-box {
                float: right;
                width: 300px;
                margin-top: 20px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
              }
              .total-line.grand {
                border-top: 2px solid #e5e5e5;
                font-weight: bold;
                font-size: 16px;
                padding-top: 12px;
                margin-top: 8px;
              }
              .logistics-box {
                background: #f9f9f9;
                padding: 20px;
                border: 1px solid #e5e5e5;
                margin: 20px 0;
              }
              .logistics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 60px;
                padding-top: 20px;
                border-top: 2px solid #e5e5e5;
                font-size: 11px;
                color: #999;
              }
              @media print {
                @page {
                  size: A4;
                  margin: 15mm;
                }
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-doc">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div id="print-order-modal" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm print:hidden" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-sm print:max-w-full print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
        {/* Header - Print Hidden Buttons */}
        <div className="p-6 border-b border-cream-200 print:hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl text-mocha-900 italic">Sipariş Yazdır</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
              <X size={20} className="text-mocha-400" />
            </button>
          </div>
          <p className="text-xs text-mocha-500">A4 formatında yazdırılabilir sipariş belgesi</p>
        </div>

        {/* Print Content - Hidden Structure for New Window */}
        <div id="print-document-content" style={{ display: 'none' }}>
          {/* Document Header */}
          <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '2px solid #e5e5e5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h1>Sade Chocolate</h1>
                <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '2px' }}>{companyInfo.slogan || 'El Yapımı Artisan Çikolata'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Sipariş Belgesi</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>#{order.id}</p>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                  {order.createdAt || new Date().toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: '24px' }}>
            <strong>Durum:</strong> {order.status}
            {order.priority === 'High' && <span style={{ marginLeft: '16px', color: '#dc2626' }}>⚠️ Acil Sipariş</span>}
          </div>

          {/* Two Column Info */}
          <div className="grid-2">
            <div>
              <div className="section-title">Müşteri Bilgileri</div>
              <div className="info-line"><strong>{order.customer?.name || 'N/A'}</strong></div>
              <div className="info-line">📧 {order.customer?.email || 'N/A'}</div>
              <div className="info-line">📞 {order.customer?.phone || '-'}</div>
            </div>
            <div>
              <div className="section-title">Teslimat Adresi</div>
              <div className="info-line"><strong>{order.shipping?.method || 'Belirtilmemiş'}</strong></div>
              <div className="info-line">{order.shipping?.address || 'Adres yok'}</div>
              <div className="info-line">{order.shipping?.city || 'Şehir yok'}</div>
              <div className="info-line" style={{ marginTop: '8px', color: '#d4a945' }}>Tahmini: {order.shipping?.estimatedDate || 'Belirtilmemiş'}</div>
            </div>
          </div>

          {/* Products Table */}
          <div className="section">
            <div className="section-title">Sipariş Kalemleri</div>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style={{ textAlign: 'center' }}>Adet</th>
                  <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                  <th style={{ textAlign: 'right' }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₺{item.price.toLocaleString('tr-TR')}</td>
                    <td style={{ textAlign: 'right' }}><strong>₺{(item.price * item.quantity).toLocaleString('tr-TR')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="total-box">
            <div className="total-line">
              <span>Ara Toplam:</span>
              <span>₺{(order.payment?.subtotal || 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="total-line">
              <span>Kargo:</span>
              <span>₺{(order.payment?.shipping || 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="total-line grand">
              <span>Genel Toplam:</span>
              <span style={{ color: '#d4a945' }}>₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div style={{ clear: 'both' }}></div>

          {/* Logistics */}
          <div className="logistics-box">
            <div className="section-title">Lojistik Bilgileri</div>
            <div className="logistics-grid">
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Lot Numarası</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{order.logistics?.lotNumber || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Soğuk Paket</div>
                <div>{order.logistics?.coldPackage ? '✓ Eklendi' : '✗ Gerek yok'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Kargo Penceresi</div>
                <div>{order.logistics?.shippingWindow || 'N/A'}</div>
              </div>
            </div>
            {order.logistics?.weatherAlert && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e5e5', color: '#ea580c' }}>
                🌡️ {order.logistics?.weatherAlert}
              </div>
            )}
          </div>

          {/* Gift Note */}
          {order.gift && order.giftNote && (
            <div style={{ background: '#fef3f0', padding: '16px', border: '1px solid #f3d1c8', marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e59a77', marginBottom: '8px' }}>🎁 HEDİYE NOTU</div>
              <div style={{ fontStyle: 'italic' }}>"{order.giftNote}"</div>
            </div>
          )}

          {/* Special Notes */}
          {order.specialNotes && (
            <div style={{ background: '#eff6ff', padding: '16px', border: '1px solid #bfdbfe', marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>📝 ÖZEL NOT / TALİMAT</div>
              <div>{order.specialNotes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div style={{ marginBottom: '4px' }}>{companyInfo.brandName} • {companyInfo.slogan || 'El Yapımı Artisan Çikolata'}</div>
            <div>{city}, Türkiye • {companyInfo.generalEmail} • {companyInfo.generalPhone}</div>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Document Header */}
          <div className="mb-8 pb-6 border-b-2 border-cream-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-mocha-900 mb-1">Sade Chocolate</h1>
                <p className="text-xs text-mocha-500 uppercase tracking-wider">{companyInfo.slogan || 'El Yapımı Artisan Çikolata'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-mocha-500 mb-1">Sipariş Belgesi</p>
                <p className="text-2xl font-bold text-mocha-900">#{order.id}</p>
                <p className="text-xs text-mocha-500 mt-1">
                  {order.createdAt || new Date().toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status & Priority */}
          <div className="mb-6 flex gap-3 print:mb-4">
            <div className="px-4 py-2 bg-cream-100 rounded-lg">
              <span className="text-xs font-bold text-mocha-600 uppercase tracking-wider">Durum: </span>
              <span className="text-xs font-bold text-mocha-900">{order.status}</span>
            </div>
            {order.priority === 'High' && (
              <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                <span className="text-xs font-bold text-red-600 uppercase">⚠️ Acil Sipariş</span>
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Customer Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">Müşteri Bilgileri</h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-mocha-900">{order.customer?.name || 'İsimsiz Müşteri'}</p>
                <p className="text-mocha-600 flex items-center gap-2">
                  <Mail size={14} className="text-mocha-400" />
                  {order.customer?.email || 'Email Yok'}
                </p>
                <p className="text-mocha-600 flex items-center gap-2">
                  <Phone size={14} className="text-mocha-400" />
                  {order.customer?.phone || 'Telefon Yok'}
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">Teslimat Adresi</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-mocha-900">{order.shipping?.method || 'Standart Teslimat'}</p>
                <p className="text-mocha-600">{order.shipping?.address || 'Adres Yok'}</p>
                <p className="text-mocha-600">{order.shipping?.city || ''}</p>
                <p className="text-brand-mustard font-medium mt-2">Tahmini: {order.shipping?.estimatedDate || 'Belirtilmemiş'}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">Sipariş Kalemleri</h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-cream-200">
                  <th className="text-left py-3 text-xs font-bold uppercase tracking-wider text-mocha-600">Ürün</th>
                  <th className="text-center py-3 text-xs font-bold uppercase tracking-wider text-mocha-600">Adet</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-mocha-600">Birim Fiyat</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-mocha-600">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => (
                  <tr key={item.id} className="border-b border-cream-200">
                    <td className="py-3 text-sm text-mocha-900">
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 text-sm text-center text-mocha-600">{item.quantity}</td>
                    <td className="py-3 text-sm text-right text-mocha-600">₺{item.price.toLocaleString('tr-TR')}</td>
                    <td className="py-3 text-sm text-right font-medium text-mocha-900">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="mb-6 flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-mocha-600">Ara Toplam:</span>
                <span className="text-mocha-900">₺{(order.payment?.subtotal || 0).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-mocha-600">Kargo:</span>
                <span className="text-mocha-900">₺{(order.payment?.shipping || 0).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-cream-200">
                <span className="text-mocha-900">Genel Toplam:</span>
                <span className="text-brand-mustard">₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>

          {/* Logistics Information */}
          <div className="mb-6 p-4 bg-cream-50 rounded-lg border border-cream-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-mocha-500 mb-3">Lojistik Bilgileri</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-mocha-500 text-xs mb-1">Lot Numarası</p>
                <p className="font-mono font-bold text-mocha-900">{order.logistics?.lotNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-mocha-500 text-xs mb-1">Soğuk Paket</p>
                <p className="font-medium text-mocha-900">{order.logistics?.coldPackage ? '✓ Eklendi' : '✗ Gerek yok'}</p>
              </div>
              <div>
                <p className="text-mocha-500 text-xs mb-1">Kargo Penceresi</p>
                <p className="font-medium text-mocha-900">{order.logistics?.shippingWindow || 'N/A'}</p>
              </div>
            </div>
            {order.logistics?.weatherAlert && (
              <div className="mt-3 pt-3 border-t border-cream-200">
                <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                  <Thermometer size={14} />
                  {order.logistics?.weatherAlert}
                </p>
              </div>
            )}
          </div>

          {/* Gift Note */}
          {order.gift && order.giftNote && (
            <div className="mb-6 p-4 bg-brand-peach/10 rounded-lg border border-brand-peach">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-2 flex items-center gap-2">
                <Gift size={14} />
                Hediye Notu
              </h4>
              <p className="text-sm text-mocha-700 italic">"{order.giftNote}"</p>
            </div>
          )}

          {/* Special Notes */}
          {order.specialNotes && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-2">
                <FileText size={14} />
                Özel Not / Talimat
              </h4>
              <p className="text-sm text-mocha-700">{order.specialNotes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t-2 border-cream-200 text-center">
            <p className="text-xs text-mocha-500 mb-1">{companyInfo.brandName} • {companyInfo.slogan || 'El Yapımı Artisan Çikolata'}</p>
            <p className="text-xs text-mocha-400">{city}, Türkiye • {companyInfo.generalEmail} • {companyInfo.generalPhone}</p>
          </div>
        </div>

        {/* Footer Buttons - Print Hidden */}
        <div className="p-6 border-t border-cream-200 flex gap-3 justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-cream-200 text-sm font-medium text-mocha-600 hover:bg-cream-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-2xl bg-brand-mustard hover:bg-brand-orange text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Printer size={16} />
            Yazdır
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ORDER DETAIL MODAL (Portal ile body'ye render edilir) ---
const OrderDetailModal = ({ order: initialOrder, onClose }: { order: Order; onClose: () => void }) => {
  // Store'dan güncel order'ı al - Firestore real-time güncellemeleri yansıtsın
  const orders = useOrderStore((state) => state.orders);
  const order = orders.find(o => o.id === initialOrder.id || o.firestoreId === initialOrder.firestoreId) || initialOrder;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isShippingLabelModalOpen, setIsShippingLabelModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [isCreateShipmentModalOpen, setIsCreateShipmentModalOpen] = useState(false);
  const [isCalculatingMNG, setIsCalculatingMNG] = useState(false);
  const [isCheckingShipment, setIsCheckingShipment] = useState(false);
  const [isSendingPaymentEmail, setIsSendingPaymentEmail] = useState(false);
  const [paymentEmailSent, setPaymentEmailSent] = useState(false);
  const [showPaymentEmailPreview, setShowPaymentEmailPreview] = useState(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'idle' | 'queued' | 'checking' | 'delivered' | 'error'>('idle');
  const [emailDeliveryError, setEmailDeliveryError] = useState<string | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  } | null>(null);

  // Toast System
  const { toasts, removeToast, success, error, info } = useToast();

  // Get store actions
  const sendEmail = useOrderStore((state) => state.sendEmail);
  const addTracking = useOrderStore((state) => state.addTracking);
  const addTag = useOrderStore((state) => state.addTag);
  const removeTag = useOrderStore((state) => state.removeTag);
  const editOrder = useOrderStore((state) => state.editOrder);
  const startRefund = useOrderStore((state) => state.startRefund);
  const cancelOrder = useOrderStore((state) => state.cancelOrder);
  const deleteOrder = useOrderStore((state) => state.deleteOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  // MNG Maliyet Hesaplama
  const handleCalculateMNGCost = async (order: Order) => {
    setIsCalculatingMNG(true);
    try {
      // Şehir kodunu bul
      const cityName = order.shipping?.city?.split('/')[0]?.trim() || order.shipping?.city;
      const TURKEY_CITIES: { [key: string]: string } = {
        'Adana': '01', 'Adıyaman': '02', 'Afyonkarahisar': '03', 'Ağrı': '04', 'Amasya': '05',
        'Ankara': '06', 'Antalya': '07', 'Artvin': '08', 'Aydın': '09', 'Balıkesir': '10',
        'Bilecik': '11', 'Bingöl': '12', 'Bitlis': '13', 'Bolu': '14', 'Burdur': '15',
        'Bursa': '16', 'Çanakkale': '17', 'Çankırı': '18', 'Çorum': '19', 'Denizli': '20',
        'Diyarbakır': '21', 'Edirne': '22', 'Elazığ': '23', 'Erzincan': '24', 'Erzurum': '25',
        'Eskişehir': '26', 'Gaziantep': '27', 'Giresun': '28', 'Gümüşhane': '29', 'Hakkari': '30',
        'Hatay': '31', 'Isparta': '32', 'Mersin': '33', 'İstanbul': '34', 'İzmir': '35',
        'Kars': '36', 'Kastamonu': '37', 'Kayseri': '38', 'Kırklareli': '39', 'Kırşehir': '40',
        'Kocaeli': '41', 'Konya': '42', 'Kütahya': '43', 'Malatya': '44', 'Manisa': '45',
        'Kahramanmaraş': '46', 'Mardin': '47', 'Muğla': '48', 'Muş': '49', 'Nevşehir': '50',
        'Niğde': '51', 'Ordu': '52', 'Rize': '53', 'Sakarya': '54', 'Samsun': '55',
        'Siirt': '56', 'Sinop': '57', 'Sivas': '58', 'Tekirdağ': '59', 'Tokat': '60',
        'Trabzon': '61', 'Tunceli': '62', 'Şanlıurfa': '63', 'Uşak': '64', 'Van': '65',
        'Yozgat': '66', 'Zonguldak': '67', 'Aksaray': '68', 'Bayburt': '69', 'Karaman': '70',
        'Kırıkkale': '71', 'Batman': '72', 'Şırnak': '73', 'Bartın': '74', 'Ardahan': '75',
        'Iğdır': '76', 'Yalova': '77', 'Karabük': '78', 'Kilis': '79', 'Osmaniye': '80', 'Düzce': '81'
      };
      const cityCode = TURKEY_CITIES[cityName || ''] || '07'; // Default: Antalya
      const districtName = order.shipping?.district || 'Muratpaşa';

      // Ürünlerden ağırlık ve desi hesapla
      const totalWeightGram = (order.items || []).reduce((sum, item: any) => {
        const itemWeight = item.weight || 200; // gram
        return sum + ((item.quantity || 1) * itemWeight);
      }, 0);
      const totalWeight = totalWeightGram / 1000;

      const totalDesiFromDimensions = (order.items || []).reduce((sum, item: any) => {
        const dims = item.dimensions;
        if (dims?.length && dims?.width && dims?.height) {
          const itemDesi = (dims.length * dims.width * dims.height) / 3000;
          return sum + ((item.quantity || 1) * itemDesi);
        }
        return sum + ((item.quantity || 1) * 1);
      }, 0);
      const totalDesi = Math.max(1, Math.ceil(Math.max(totalWeight, totalDesiFromDimensions)));

      // MNG API çağır
      const { calculateShipping, findMNGDistrictCode } = await import('../../../services/shippingService');
      const districtCode = await findMNGDistrictCode(cityCode, districtName);

      const mngCost = await calculateShipping({
        cityCode,
        districtCode: districtCode || '0',
        address: order.shipping?.address || '',
        weight: totalWeight,
        desi: totalDesi
      });

      if (mngCost) {
        // Firestore'da güncelle
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../../../lib/firebase');
        const docId = order.firestoreId || order.id;
        const customerPaid = order.payment?.shipping || 0;

        await updateDoc(doc(db, 'orders', docId), {
          'costAnalysis.mngEstimate': mngCost.total,
          'costAnalysis.mngDistrictCode': districtCode,
          'costAnalysis.customerPaid': customerPaid,
          'costAnalysis.calculatedAt': new Date().toISOString(),
          'costAnalysis.profit': customerPaid - mngCost.total
        });

        success(`✅ MNG tahmini: ₺${mngCost.total} | Kâr: ₺${(customerPaid - mngCost.total).toFixed(0)}`);
      } else {
        error('❌ MNG maliyeti hesaplanamadı. API yanıt vermedi.');
      }
    } catch (err: any) {
      console.error('MNG hesaplama hatası:', err);
      error(`❌ Hesaplama hatası: ${err.message}`);
    } finally {
      setIsCalculatingMNG(false);
    }
  };

  // Tek sipariş kargo durumu kontrolü
  const handleCheckSingleShipment = async () => {
    const docId = order.firestoreId || order.id;
    setIsCheckingShipment(true);
    info('Kargo durumu kontrol ediliyor...');

    try {
      const result = await checkSingleShipmentStatus(docId);
      if (result.success) {
        if (result.status === 'in_transit') {
          success('✅ Kargo harekete geçti! Müşteriye bildirim gönderildi.');
        } else {
          info(result.message || 'Kargo durumu güncellendi.');
        }
      } else {
        error(`❌ ${result.message}`);
      }
    } catch (err: any) {
      error(`❌ Kontrol hatası: ${err.message}`);
    } finally {
      setIsCheckingShipment(false);
    }
  };

  const handleAction = (action: string) => {
    if (action === 'E-posta Gönder') {
      setIsEmailModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Yazdır') {
      setIsPrintModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Takip Numarası Ekle') {
      setIsTrackingModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Kargo Etiketi Oluştur') {
      setIsShippingLabelModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Kargo Oluştur') {
      setIsCreateShipmentModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Kargo Kontrol') {
      handleCheckSingleShipment();
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Etiket Ekle') {
      setIsTagModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Siparişi Düzenle') {
      setIsEditModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'İade Başlat') {
      setIsRefundModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Siparişi İptal Et') {
      setIsCancelModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Ödeme Alınamadı - İptal') {
      // Ödeme alınamadı için özel iptal işlemi
      setConfirmDialog({
        isOpen: true,
        title: 'Ödeme Alınamadı - Sipariş İptali',
        message: `Sipariş #${order.id} için ödeme süresi doldu ve ödeme alınamadı. Siparişi iptal etmek ve müşteriye bilgilendirme emaili göndermek istiyor musunuz?`,
        variant: 'danger',
        onConfirm: async () => {
          try {
            await cancelOrder(order.firestoreId || order.id, {
              reason: 'Ödeme Alınamadı',
              notifyCustomer: true,
              refundPayment: false,
              notes: 'Havale/EFT ödemesi süresinde yapılmadığı için otomatik iptal.'
            });
            success('Sipariş iptal edildi ve müşteriye bilgilendirme emaili gönderildi.');
          } catch (err: any) {
            error(`İptal hatası: ${err.message}`);
          }
        }
      });
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Durumu Değiştir') {
      setIsStatusChangeModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Siparişi Sil') {
      setConfirmDialog({
        isOpen: true,
        title: 'Siparişi Kalıcı Olarak Sil',
        message: `⚠️ DİKKAT: #${order.id} numaralı sipariş veritabanından kalıcı olarak silinecek!\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
        variant: 'danger',
        onConfirm: async () => {
          try {
            await deleteOrder(order.firestoreId || order.id);
            success(`✅ Sipariş #${order.id} başarıyla silindi.`);
            onClose(); // Paneli kapat
          } catch (err: any) {
            error(`❌ Silme hatası: ${err.message}`);
          }
        }
      });
      setIsDropdownOpen(false);
      return;
    }
    if (action === 'Ödeme Onayla') {
      setConfirmDialog({
        isOpen: true,
        title: 'Ödemeyi Onayla',
        message: `Sipariş #${order.id} için havale/EFT ödemesini onaylamak istediğinize emin misiniz? Onayladığınızda sipariş "Hazırlık Bekliyor" durumuna geçecektir.`,
        variant: 'success',
        onConfirm: async () => {
          try {
            await editOrder(order.firestoreId || order.id, {
              status: 'Awaiting Prep',
              paymentConfirmedAt: new Date().toISOString(),
              paymentConfirmedBy: 'admin'
            });
            success('Ödeme onaylandı! Sipariş hazırlık sürecine alındı.');
          } catch (err: any) {
            error(`Ödeme onaylanamadı: ${err.message}`);
          }
        }
      });
      setIsDropdownOpen(false);
      return;
    }
    alert(`Eylem: ${action}\nSipariş #${order.id}`);
    setIsDropdownOpen(false);
  };

  const handleEmailSent = async () => {
    try {
      await sendEmail(order.firestoreId || order.id);
      success(`Sipariş onay e-postası ${order.customer?.email || 'müşteri'} adresine gönderildi`);
    } catch (err: any) {
      error(`E-posta gönderilemedi: ${err.message}`);
    }
  };

  const handleTrackingSaved = async (carrier: string, trackingNumber: string) => {
    try {
      await addTracking(order.firestoreId || order.id, carrier, trackingNumber);
      success(`Kargo takip numarası eklendi: ${carrier} - ${trackingNumber}`);
    } catch (err: any) {
      error(`Takip numarası eklenemedi: ${err.message}`);
    }
  };

  const handleTagSaved = async (tag: string, color: string) => {
    try {
      await addTag(order.firestoreId || order.id, tag, color);
      success(`"${tag}" etiketi eklendi`);
    } catch (err: any) {
      error(`Etiket eklenemedi: ${err.message}`);
    }
  };

  const handleOrderEdit = async (updates: any) => {
    try {
      await editOrder(order.firestoreId || order.id, updates);
      success('Sipariş bilgileri başarıyla güncellendi');
    } catch (err: any) {
      error(`Sipariş güncellenemedi: ${err.message}`);
    }
  };

  const handleRefund = async (refundData: any) => {
    try {
      await startRefund(order.firestoreId || order.id, refundData);
      success(`İade işlemi başlatıldı: ₺${refundData.amount.toLocaleString('tr-TR')}`);
    } catch (err: any) {
      error(`İade başlatılamadı: ${err.message}`);
    }
  };

  const handleCancel = async (cancelData: any) => {
    try {
      await cancelOrder(order.firestoreId || order.id, cancelData);
      success('Sipariş başarıyla iptal edildi');
    } catch (err: any) {
      error(`Sipariş iptal edilemedi: ${err.message}`);
    }
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    try {
      await updateOrderStatus(order.firestoreId || order.id, newStatus);
      success(`Sipariş durumu güncellendi: ${newStatus}`);

      // Teslim edildi durumunda müşteriye email gönder
      if (newStatus === 'Delivered' && order.customer?.email) {
        const items = order.items?.map(item => ({
          name: item.name || 'Ürün',
          quantity: item.quantity || 1
        })) || [];

        // Review token üret ve Firestore'a kaydet
        const reviewToken = crypto.randomUUID();
        const reviewRef = doc(collection(db, 'reviews'));
        setDoc(reviewRef, {
          id: reviewRef.id,
          orderId: order.id,
          customerName: order.customer.name || 'Değerli Müşterimiz',
          customerEmail: order.customer.email,
          rating: 0,
          comment: '',
          token: reviewToken,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).catch(err => console.error('Review dokümanı oluşturulamadı:', err));

        const reviewUrl = `https://sadechocolate.com/yorum-yaz?token=${reviewToken}`;

        sendDeliveryConfirmationEmail(order.customer.email, {
          customerName: order.customer.name || 'Değerli Müşterimiz',
          orderId: order.id,
          deliveryDate: new Date().toISOString(),
          items,
          reviewUrl,
        }).catch(err => console.error('Teslimat emaili gönderilemedi:', err));
      }
    } catch (err: any) {
      error(`Durum güncellenemedi: ${err.message}`);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-sm flex">

        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-cream-200">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl text-mocha-900 italic">Sipariş #{order.id}</h2>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
                <X size={20} className="text-mocha-400" />
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={order.status} />
              {order.payment?.method === 'eft' && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-300 font-bold uppercase">
                  <Landmark size={10} /> Havale/EFT
                </span>
              )}
              {order.payment?.method === 'card' && (
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-bold uppercase ${
                  order.payment?.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : order.payment?.status === 'failed'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-blue-100 text-blue-700 border-blue-300'
                }`}>
                  💳 {order.payment?.cardAssociation || 'Kart'} {order.payment?.lastFourDigits ? `**** ${order.payment.lastFourDigits}` : ''}
                </span>
              )}
              {order.priority === 'High' && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-bold uppercase">
                  <AlertTriangle size={12} /> Acil
                </span>
              )}
              <span className="text-xs text-mocha-400">
                {order.createdAt ? new Date(order.createdAt).toLocaleString('tr-TR') : '-'}
              </span>
            </div>

            {/* Pending Payment Alert with Countdown */}
            {(order.status === 'Pending Payment' || order.status === 'pending' || order.payment?.status === 'pending') && order.paymentDeadline && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800 mb-1">Ödeme Bekleniyor</p>
                    <p className="text-xs text-amber-600">
                      Son ödeme: {new Date(order.paymentDeadline).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <EftCountdown deadline={order.paymentDeadline} />
                  {order.bankTransferDiscount && order.bankTransferDiscount > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-bold">
                      -₺{order.bankTransferDiscount.toFixed(2)} indirim
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Hediye Çantası ve Mesaj Uyarıları */}
            {(order.hasGiftBag || order.isGift) && (
              <div className="mt-4 space-y-3">
                {order.hasGiftBag && (
                  <div className="p-4 bg-pink-50 rounded-2xl border-2 border-pink-300 animate-pulse">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛍️</span>
                      <div>
                        <p className="text-sm font-bold text-pink-700">Hediye Çantası İsteniyor!</p>
                        <p className="text-xs text-pink-600">Bu siparişe hediye çantası eklemeyi unutmayın.</p>
                      </div>
                    </div>
                  </div>
                )}
                {order.isGift && (
                  <div className="p-4 bg-gradient-to-r from-gold/10 to-amber-50 rounded-2xl border-2 border-gold animate-pulse">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎁</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800">Bu Bir Hediye Siparişi!</p>
                        <p className="text-xs text-amber-600 mb-2">Fiyat bilgisi içermeyen fatura düzenleyin.</p>
                        {order.giftMessage && (
                          <div className="mt-2 p-3 bg-white rounded-xl border border-gold/30">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Hediye Mesajı:</p>
                            <p className="text-sm text-mocha-900 italic">"{order.giftMessage}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-4">Öğeler ({order.items?.length || 0})</h3>
            <div className="space-y-3">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-cream-50 rounded-2xl">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍫</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-mocha-900">{item.name}</p>
                    <p className="text-xs text-mocha-400">₺{item.price.toLocaleString('tr-TR')} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-mocha-900">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="mb-8 p-6 bg-cream-100 rounded-2xl border border-cream-200">
            <h3 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-4">Ödeme Bilgileri</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-mocha-600">Öğeler</span>
                <span className="text-mocha-900">₺{(order.payment?.subtotal || 0).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mocha-600">Gönderim</span>
                <span className="text-mocha-900">₺{(order.payment?.shipping || 0).toLocaleString('tr-TR')}</span>
              </div>
              {(order.payment?.discount || 0) < 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Para İadesi Yapıldı</span>
                  <span>₺{(order.payment?.discount || 0).toLocaleString('tr-TR')}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-cream-200 font-bold text-base">
                <span className="text-mocha-900">Toplam</span>
                <span className="text-mocha-900">₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</span>
              </div>

              {/* İyzico Ödeme Detayları */}
              {order.payment?.method === 'card' && (
                <div className="mt-4 pt-4 border-t border-cream-200">
                  <h4 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-3">Kart Ödeme Detayları</h4>
                  <div className="space-y-2 text-xs">
                    {order.payment.cardAssociation && (
                      <div className="flex justify-between">
                        <span className="text-mocha-500">Kart</span>
                        <span className="text-mocha-900 font-medium">
                          {order.payment.cardAssociation} {order.payment.cardFamily && `(${order.payment.cardFamily})`}
                        </span>
                      </div>
                    )}
                    {order.payment.lastFourDigits && (
                      <div className="flex justify-between">
                        <span className="text-mocha-500">Kart No</span>
                        <span className="text-mocha-900 font-mono">**** **** **** {order.payment.lastFourDigits}</span>
                      </div>
                    )}
                    {order.payment.iyzicoPaymentId && (
                      <div className="flex justify-between">
                        <span className="text-mocha-500">İyzico ID</span>
                        <span className="text-mocha-900 font-mono text-xs">{order.payment.iyzicoPaymentId}</span>
                      </div>
                    )}
                    {order.payment.paidPrice !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-mocha-500">Ödenen</span>
                        <span className="text-emerald-600 font-bold">₺{order.payment.paidPrice.toLocaleString('tr-TR')}</span>
                      </div>
                    )}
                    {order.payment.iyzicoCommissionFee !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-mocha-500">İyzico Komisyon</span>
                        <span className="text-orange-600">₺{order.payment.iyzicoCommissionFee.toLocaleString('tr-TR')}</span>
                      </div>
                    )}
                    {order.payment.status === 'failed' && order.payment.failureReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-600 font-medium">
                          ❌ Hata: {order.payment.failureReason}
                        </p>
                      </div>
                    )}
                    {order.payment.retryCount !== undefined && order.payment.retryCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-mocha-500">Deneme Sayısı</span>
                        <span className="text-amber-600">{order.payment.retryCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kargo Maliyet Analizi - Geliver Entegrasyonu */}
          {(order.tracking?.price || order.payment?.shipping !== undefined) && (
            <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <h3 className="text-xs uppercase tracking-wider text-blue-700 font-bold mb-4 flex items-center gap-2">
                <Truck size={14} />
                Kargo Maliyet Analizi
                {order.tracking?.carrier && (
                  <span className="text-xs font-normal text-blue-500">({order.tracking.carrier})</span>
                )}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white rounded-xl border border-blue-100">
                  <p className="text-xs text-mocha-500 mb-1">Müşteri Ödedi</p>
                  <p className="text-lg font-bold text-mocha-900">
                    ₺{(order.payment?.shipping ?? 0).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-blue-100">
                  <p className="text-xs text-mocha-500 mb-1">Gerçek Maliyet</p>
                  <p className="text-lg font-bold text-mocha-900">
                    {order.tracking?.price
                      ? `₺${order.tracking.price.toFixed(2)}`
                      : <span className="text-xs text-mocha-400">Kargo oluşturulmadı</span>
                    }
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-blue-100">
                  <p className="text-xs text-mocha-500 mb-1">Kâr/Zarar</p>
                  {(() => {
                    const customerPaid = order.payment?.shipping ?? 0;
                    const actualCost = order.tracking?.price;
                    if (!actualCost) return <p className="text-lg font-bold text-mocha-400">-</p>;
                    const profit = customerPaid - actualCost;
                    return (
                      <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}₺{profit.toFixed(0)}
                      </p>
                    );
                  })()}
                </div>
              </div>
              {order.tracking?.createdAt && (
                <p className="text-xs text-mocha-400 mt-3 text-right">
                  Kargo: {typeof order.tracking.createdAt === 'string'
                    ? order.tracking.createdAt
                    : new Date(order.tracking.createdAt).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-4">Sipariş Hareketleri</h3>
            <div className="space-y-4">
              {(order.timeline || []).map((event, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-mustard mt-1.5 shrink-0"></div>
                  <div className="flex-1 pb-4 border-b border-cream-200 last:border-0">
                    <p className="text-sm text-mocha-900 font-medium">{event.action}</p>
                    <p className="text-xs text-mocha-400 mt-1">{event.time}</p>
                    {event.note && <p className="text-xs text-mocha-500 italic mt-2">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 overflow-y-auto p-6 bg-cream-50 space-y-6">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-white border border-cream-200 rounded-2xl text-sm font-medium text-mocha-900 hover:bg-cream-50 transition-colors flex items-center justify-between"
            >
              <span>Diğer Eylemler</span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden z-10 animate-fade-in">
                {/* Sık Kullanılan */}
                <div className="p-2 border-b border-cream-200">
                  <p className="text-xs uppercase tracking-wider text-mocha-400 font-bold px-3 py-2">Sık Kullanılan</p>
                  <button
                    onClick={() => handleAction('E-posta Gönder')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Send size={16} className="text-brand-blue" />
                    <span className="text-sm text-mocha-900">Sipariş Onayı Gönder</span>
                  </button>
                  <button
                    onClick={() => handleAction('Yazdır')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Printer size={16} className="text-brand-mustard" />
                    <span className="text-sm text-mocha-900">Siparişi Yazdır</span>
                  </button>
                  <button
                    onClick={() => handleAction('Fatura İndir')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Download size={16} className="text-brand-green" />
                    <span className="text-sm text-mocha-900">Faturayı İndir</span>
                  </button>
                </div>

                {/* Ödeme Onayı - Sadece Pending Payment durumunda */}
                {order.status === 'Pending Payment' && (
                  <div className="p-2 border-b border-cream-200">
                    <p className="text-xs uppercase tracking-wider text-amber-600 font-bold px-3 py-2">Ödeme İşlemleri</p>
                    <button
                      onClick={() => handleAction('Ödeme Onayla')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left"
                    >
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-sm text-mocha-900 font-medium">Ödemeyi Onayla</span>
                      <span className="ml-auto text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Havale/EFT</span>
                    </button>
                    <button
                      onClick={() => handleAction('Ödeme Alınamadı - İptal')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left"
                    >
                      <XCircle size={16} className="text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Ödeme Alınamadı - İptal</span>
                    </button>
                  </div>
                )}

                {/* Lojistik */}
                <div className="p-2 border-b border-cream-200">
                  <p className="text-xs uppercase tracking-wider text-mocha-400 font-bold px-3 py-2">Lojistik</p>
                  <button
                    onClick={() => handleAction('Takip Numarası Ekle')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Package size={16} className="text-brand-blue" />
                    <span className="text-sm text-mocha-900">Takip Numarası Ekle</span>
                  </button>
                  <button
                    onClick={() => handleAction('Kargo Etiketi Oluştur')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Truck size={16} className="text-brand-mustard" />
                    <span className="text-sm text-mocha-900">Kargo Etiketi Oluştur</span>
                  </button>
                  <button
                    onClick={() => handleAction('Kargo Oluştur')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Package size={16} className="text-green-600" />
                    <span className="text-sm text-mocha-900">Kargo Oluştur</span>
                  </button>
                  {(order.status === 'shipped' || order.status === 'in_transit') && (
                    <button
                      onClick={() => handleAction('Kargo Kontrol')}
                      disabled={isCheckingShipment}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={`text-blue-600 ${isCheckingShipment ? 'animate-spin' : ''}`} />
                      <span className="text-sm text-mocha-900">
                        {isCheckingShipment ? 'Kontrol Ediliyor...' : 'Kargo Durumunu Kontrol Et'}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('Etiket Ekle')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Tag size={16} className="text-brand-peach" />
                    <span className="text-sm text-mocha-900">Etiket Ekle</span>
                  </button>
                  <button
                    onClick={() => handleAction('Durumu Değiştir')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <RefreshCw size={16} className="text-purple-600" />
                    <span className="text-sm text-mocha-900">Durumu Değiştir</span>
                  </button>
                </div>

                {/* Kritik */}
                <div className="p-2">
                  <p className="text-xs uppercase tracking-wider text-mocha-400 font-bold px-3 py-2">Kritik</p>
                  <button
                    onClick={() => handleAction('Siparişi Düzenle')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <Edit size={16} className="text-blue-600" />
                    <span className="text-sm text-mocha-900">Siparişi Düzenle</span>
                  </button>
                  <button
                    onClick={() => handleAction('İade Başlat')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 rounded-xl transition-colors text-left"
                  >
                    <RefreshCw size={16} className="text-orange-600" />
                    <span className="text-sm text-mocha-900">İade Başlat</span>
                  </button>
                  <button
                    onClick={() => handleAction('Siparişi İptal Et')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-left"
                  >
                    <XCircle size={16} className="text-red-600" />
                    <span className="text-sm text-red-600">Siparişi İptal Et</span>
                  </button>
                  <button
                    onClick={() => handleAction('Siparişi Sil')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-100 rounded-xl transition-colors text-left border-t border-red-100 mt-2 pt-2"
                  >
                    <Trash2 size={16} className="text-red-700" />
                    <span className="text-sm text-red-700 font-bold">Siparişi Sil</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="p-4 bg-white rounded-2xl border border-cream-200">
            <h4 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-3">Müşteri Bilgileri</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-mustard text-white rounded-full flex items-center justify-center font-bold">
                  {order.customer?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mocha-900 truncate">{order.customer?.name || 'İsimsiz Müşteri'}</p>
                  {order.customerTier && (
                    <div className="mt-1">
                      <TierBadge tier={order.customerTier as LoyaltyTier} size="sm" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-mocha-600">
                <Mail size={14} />
                <span className="truncate">{order.customer?.email || 'Email yok'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-mocha-600">
                <Phone size={14} />
                <span>{order.customer?.phone || 'Telefon yok'}</span>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="p-4 bg-white rounded-2xl border border-cream-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-mocha-400 font-bold">Etiketler</h4>
              <button
                onClick={() => handleAction('Etiket Ekle')}
                className="text-xs uppercase tracking-wider text-brand-mustard hover:text-brand-orange font-bold transition-colors"
              >
                + Ekle
              </button>
            </div>

            {order.tags && order.tags.length > 0 ? (
              <div className="space-y-2">
                {order.tags.map((tag, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl border group hover:shadow-md transition-all ${
                      tag.color === 'yellow' ? 'bg-brand-yellow/20 border-brand-yellow' :
                      tag.color === 'orange' ? 'bg-brand-orange/20 border-brand-orange' :
                      tag.color === 'peach' ? 'bg-brand-peach/20 border-brand-peach' :
                      tag.color === 'blue' ? 'bg-brand-blue/20 border-brand-blue' :
                      tag.color === 'green' ? 'bg-brand-green/20 border-brand-green' :
                      'bg-brand-mustard/20 border-brand-mustard'
                    }`}
                  >
                    <span className="text-xs font-medium text-mocha-900 uppercase tracking-wider">
                      {tag.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          tag.color === 'yellow' ? 'bg-brand-yellow' :
                          tag.color === 'orange' ? 'bg-brand-orange' :
                          tag.color === 'peach' ? 'bg-brand-peach' :
                          tag.color === 'blue' ? 'bg-brand-blue' :
                          tag.color === 'green' ? 'bg-brand-green' :
                          'bg-brand-mustard'
                        }`}
                      ></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Etiketi Kaldır',
                            message: `"${tag.label}" etiketini kaldırmak istediğinize emin misiniz?`,
                            variant: 'warning',
                            onConfirm: async () => {
                              try {
                                await removeTag(order.firestoreId || order.id, idx);
                                success(`"${tag.label}" etiketi kaldırıldı`);
                              } catch (err: any) {
                                error(`Etiket kaldırılamadı: ${err.message}`);
                              }
                            }
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white text-mocha-400"
                        title="Etiketi Kaldır"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-[8px] text-mocha-400 italic mt-2">
                  {order.tags.length} etiket
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-mocha-400 italic">Henüz etiket eklenmemiş</p>
                <button
                  onClick={() => handleAction('Etiket Ekle')}
                  className="mt-2 text-xs text-brand-mustard hover:text-brand-orange font-bold uppercase tracking-wider transition-colors"
                >
                  İlk Etiketi Ekle
                </button>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="p-4 bg-white rounded-2xl border border-cream-200">
            <h4 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-3">Teslimat Adresi</h4>
            <div className="space-y-2">
              <p className="text-xs font-medium text-mocha-900">{order.shipping?.method || 'Belirtilmemiş'}</p>
              <p className="text-xs text-mocha-600 leading-relaxed">
                {order.shipping?.address || 'Adres yok'}<br />
                {order.shipping?.city || 'Şehir yok'}
              </p>
              <p className="text-xs text-brand-mustard font-medium">
                Tahmini: {order.shipping?.estimatedDate || 'Belirtilmemiş'}
              </p>
            </div>
          </div>

          {/* Billing/Invoice Info */}
          <div className="p-4 bg-white rounded-2xl border border-cream-200">
            <h4 className="text-xs uppercase tracking-wider text-mocha-400 font-bold mb-3">Fatura Bilgileri</h4>
            {order.invoice ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-mocha-800">
                  {order.invoice.type === 'corporate' ? (
                    <>
                      {order.invoice.companyName || 'Kurumsal Fatura'}
                      {order.invoice.taxOffice && (
                        <span className="block text-xs font-normal text-mocha-500 mt-1">
                          {order.invoice.taxOffice} - {order.invoice.taxNo}
                        </span>
                      )}
                    </>
                  ) : (
                    'Bireysel Fatura'
                  )}
                </p>
                {order.invoice.address && (
                  <p className="text-xs text-mocha-600">
                    {order.invoice.address}
                    {order.invoice.city && <>, {order.invoice.city}</>}
                  </p>
                )}
              </div>
            ) : order.billing ? (
              <p className="text-xs text-mocha-600 leading-relaxed">
                {order.billing.address || 'Adres yok'}<br />
                {order.billing.city || 'Şehir yok'}
              </p>
            ) : (
              <p className="text-xs text-mocha-500 italic">Bireysel Fatura</p>
            )}
          </div>

          {/* Gift Note */}
          {order.gift && order.giftNote && (
            <div className="p-4 bg-brand-peach/20 rounded-2xl border border-brand-peach">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={14} className="text-brand-orange" />
                <h4 className="text-xs uppercase tracking-wider text-brand-orange font-bold">Hediye Notu</h4>
              </div>
              <p className="text-xs text-mocha-600 italic">"{order.giftNote}"</p>
            </div>
          )}

          {/* Special Notes */}
          {order.specialNotes && (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-blue-600" />
                <h4 className="text-xs uppercase tracking-wider text-blue-600 font-bold">Özel Not / Talimat</h4>
              </div>
              <p className="text-xs text-mocha-600">{order.specialNotes}</p>
            </div>
          )}

          {/* Loyalty Points Earned */}
          {order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0 && (
            <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div className="flex-1">
                  <h4 className="text-xs uppercase tracking-wider text-green-600 font-bold mb-1">Kazanılan Sadakat Puanı</h4>
                  <p className="text-lg font-bold text-green-700">{order.loyaltyPointsEarned} Puan</p>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {order.tempAlert && (
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
              <div className="flex items-center gap-2">
                <Thermometer size={14} className="text-orange-600" />
                <p className="text-xs text-orange-600 font-medium">Isı Hassasiyeti Var</p>
              </div>
            </div>
          )}

          {/* Ödeme Sorunu Destek Maili */}
          {(order.payment?.status === 'failed' || order.status === 'cancelled' || order.status === 'Cancelled' || (order.status === 'pending' && order.payment?.method === 'card')) && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <h4 className="text-[10px] uppercase tracking-widest text-amber-800 font-bold">Ödeme Sorunu Tespit Edildi</h4>
              </div>
              <p className="text-xs text-amber-600 mb-3">
                {order.payment?.failureReason || 'Ödeme başarısız veya tamamlanmamış'}
                {order.payment?.retryCount ? ` · ${order.payment.retryCount} deneme` : ''}
              </p>
              <button
                onClick={() => setShowPaymentEmailPreview(true)}
                disabled={paymentEmailSent}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  paymentEmailSent
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                }`}
              >
                {paymentEmailSent ? (
                  <><CheckCircle size={14} /> Mail Gönderildi</>
                ) : (
                  <><Mail size={14} /> Ödeme Destek Maili Önizle</>
                )}
              </button>
            </div>
          )}

          {/* Ödeme Destek Maili Önizleme Modalı - Gerçek Template */}
          {showPaymentEmailPreview && (() => {
            // İsim capitalize: "emre bey" → "Emre Bey"
            const rawName = order.customer?.name || 'Değerli Müşterimiz';
            const capitalizedName = rawName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            const emailData: PaymentSupportEmailData = {
              customerName: capitalizedName,
              orderId: order.id || '',
              orderTotal: `₺${(order.payment?.total || 0).toLocaleString('tr-TR')}`,
              attemptCount: order.payment?.retryCount || 1
            };
            const previewHtml = generatePaymentSupportEmailHtml(emailData);

            return createPortal(
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" onClick={() => setShowPaymentEmailPreview(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Mail Önizleme</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Müşteriye gidecek mailin birebir görünümü</p>
                    </div>
                    <button onClick={() => setShowPaymentEmailPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <X size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Mail Meta Bilgileri */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 space-y-1.5 shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-16 shrink-0">Kime:</span>
                      <span className="font-medium text-gray-800">{order.customer?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-16 shrink-0">Konu:</span>
                      <span className="font-medium text-gray-800">Sade Chocolate - Siparişiniz Hakkında Yardımcı Olmak İstiyoruz</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-16 shrink-0">Gönderen:</span>
                      <span className="font-medium text-gray-800">Sade Chocolate &lt;bilgi@sadechocolate.com&gt;</span>
                    </div>
                  </div>

                  {/* Gerçek Mail HTML Önizleme - iframe */}
                  <div className="flex-1 overflow-auto bg-gray-100 min-h-0">
                    <iframe
                      srcDoc={previewHtml}
                      title="Email Önizleme"
                      className="w-full border-0"
                      style={{ minHeight: '600px', height: '100%', width: '100%' }}
                      sandbox="allow-same-origin"
                    />
                  </div>

                  {/* Footer Aksiyonlar */}
                  <div className="p-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowPaymentEmailPreview(false)}
                      className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={async () => {
                        const email = order.customer?.email;
                        if (!email) { error('Müşteri email adresi bulunamadı'); return; }
                        setIsSendingPaymentEmail(true);
                        setEmailDeliveryStatus('checking');
                        setEmailDeliveryError(null);
                        try {
                          const mailDocId = await sendPaymentSupportEmail(email, emailData);
                          if (!mailDocId) throw new Error('Mail kuyruğa eklenemedi');

                          setEmailDeliveryStatus('queued');

                          // Durumu takip et - 3 saniye aralıkla 5 kez kontrol
                          let attempts = 0;
                          const maxAttempts = 8;
                          const checkInterval = setInterval(async () => {
                            attempts++;
                            const result = await checkEmailDeliveryStatus(mailDocId);

                            if (result.status === 'delivered') {
                              clearInterval(checkInterval);
                              setEmailDeliveryStatus('delivered');
                              setPaymentEmailSent(true);
                              success('Mail teslim edildi!');
                            } else if (result.status === 'error') {
                              clearInterval(checkInterval);
                              setEmailDeliveryStatus('error');
                              setEmailDeliveryError(result.error || 'Bilinmeyen hata');
                              error(`Mail gönderilemedi: ${result.error}`);
                            } else if (attempts >= maxAttempts) {
                              clearInterval(checkInterval);
                              // Hala pending ise bile kuyruğa girmiş demektir
                              setEmailDeliveryStatus('delivered');
                              setPaymentEmailSent(true);
                              success('Mail kuyruğa alındı, kısa sürede teslim edilecek');
                            }
                          }, 3000);
                        } catch (err) {
                          console.error('Email gönderilemedi:', err);
                          setEmailDeliveryStatus('error');
                          setEmailDeliveryError('Firestore yazma hatası');
                          error('Email gönderilemedi');
                        } finally {
                          setIsSendingPaymentEmail(false);
                        }
                      }}
                      disabled={isSendingPaymentEmail || emailDeliveryStatus === 'queued' || emailDeliveryStatus === 'checking'}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                        isSendingPaymentEmail || emailDeliveryStatus === 'queued'
                          ? 'bg-amber-100 text-amber-600'
                          : emailDeliveryStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : emailDeliveryStatus === 'error'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                      }`}
                    >
                      {isSendingPaymentEmail ? (
                        <><RefreshCw size={14} className="animate-spin" /> Kuyruğa ekleniyor...</>
                      ) : emailDeliveryStatus === 'queued' || emailDeliveryStatus === 'checking' ? (
                        <><RefreshCw size={14} className="animate-spin" /> Teslim durumu kontrol ediliyor...</>
                      ) : emailDeliveryStatus === 'delivered' ? (
                        <><CheckCircle size={14} /> Teslim Edildi</>
                      ) : emailDeliveryStatus === 'error' ? (
                        <><AlertTriangle size={14} /> Hata: {emailDeliveryError}</>
                      ) : (
                        <><Send size={14} /> Onayla ve Gönder</>
                      )}
                    </button>
                  </div>

                  {/* Teslim Durumu Bilgi Notu */}
                  {emailDeliveryStatus !== 'idle' && (
                    <div className={`mx-4 mb-4 p-3 rounded-lg text-xs ${
                      emailDeliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      emailDeliveryStatus === 'error' ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {emailDeliveryStatus === 'queued' || emailDeliveryStatus === 'checking' ? (
                        <p>SendGrid ile teslim durumu kontrol ediliyor... Bu birkaç saniye sürebilir.</p>
                      ) : emailDeliveryStatus === 'delivered' ? (
                        <p>Mail SendGrid tarafından başarıyla işlendi ve müşteriye teslim edildi.</p>
                      ) : emailDeliveryStatus === 'error' ? (
                        <p>Mail gönderilemedi. Hata: {emailDeliveryError}. Lütfen tekrar deneyin veya Firebase Console'dan kontrol edin.</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>,
              document.body
            );
          })()}

          {/* Logistics Info - Geliver Entegrasyonu */}
          <div className="p-4 bg-white rounded-2xl border border-cream-200">
            <h4 className="text-xs uppercase tracking-wider text-brand-mustard font-bold mb-3">Lojistik Bilgileri</h4>
            <div className="space-y-3 text-xs">
              {/* Kargo Takip Bilgileri - Geliver */}
              {order.tracking?.trackingNumber && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-mocha-500">Kargo Firması:</span>
                    <span className="font-bold text-blue-600">{order.tracking.carrier || 'Geliver'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-mocha-500">Takip No:</span>
                    <span className="font-mono font-bold text-mocha-900">{order.tracking.trackingNumber}</span>
                  </div>
                  <div className="border-t border-cream-200 pt-3"></div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-mocha-500">Lot Numarası:</span>
                <span className="font-mono font-bold text-mocha-900">{order.logistics?.lotNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mocha-500">Soğuk Paket:</span>
                <span className={`font-medium ${order.logistics?.coldPackage ? 'text-blue-600' : 'text-mocha-400'}`}>
                  {order.logistics?.coldPackage ? '✓ Eklendi' : '✗ Gerek yok'}
                </span>
              </div>
              <div className="border-t border-cream-200 pt-3">
                <p className="text-mocha-500 mb-1">Kargo Penceresi:</p>
                <p className="font-medium text-mocha-900">{order.logistics?.shippingWindow || 'N/A'}</p>
              </div>
              {order.logistics?.weatherAlert && (
                <div className="border-t border-cream-200 pt-3">
                  <p className="text-brand-orange font-medium flex items-center gap-1">
                    <Thermometer size={12} />
                    {order.logistics?.weatherAlert}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {isEmailModalOpen && (
        <EmailConfirmationModal
          order={order}
          onClose={() => setIsEmailModalOpen(false)}
          onSend={handleEmailSent}
        />
      )}

      {/* Print Order Modal */}
      {isPrintModalOpen && (
        <PrintOrderModal
          order={order}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Tracking Number Modal */}
      {isTrackingModalOpen && (
        <TrackingNumberModal
          order={order}
          onClose={() => setIsTrackingModalOpen(false)}
          onSave={handleTrackingSaved}
        />
      )}

      {/* Shipping Label Modal */}
      {isShippingLabelModalOpen && (
        <ShippingLabelModal
          order={order}
          onClose={() => setIsShippingLabelModalOpen(false)}
        />
      )}

      {/* Create Shipment Modal (MNG Kargo) */}
      {isCreateShipmentModalOpen && (
        <CreateShipmentModal
          order={order}
          onClose={() => setIsCreateShipmentModalOpen(false)}
          onSuccess={(trackingNumber) => {
            success(`Kargo başarıyla oluşturuldu: ${trackingNumber}`);
          }}
          onError={(message) => {
            error(message);
          }}
        />
      )}

      {/* Tag Modal */}
      {isTagModalOpen && (
        <TagModal
          order={order}
          onClose={() => setIsTagModalOpen(false)}
          onSave={handleTagSaved}
        />
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && (
        <EditOrderModal
          order={order}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleOrderEdit}
        />
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <RefundModal
          order={order}
          onClose={() => setIsRefundModalOpen(false)}
          onSave={handleRefund}
        />
      )}

      {/* Status Change Modal */}
      {isStatusChangeModalOpen && (
        <StatusChangeModal
          order={order}
          onClose={() => setIsStatusChangeModalOpen(false)}
          onSave={handleStatusChange}
        />
      )}

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <CancelOrderModal
          order={order}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancel}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>,
    document.body
  );
};

// --- LOGISTICS RULES PANEL ---
const LogisticsRulesPanel: React.FC = () => {
  const [shippingDays, setShippingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });

  const [tempThreshold, setTempThreshold] = useState(20);
  const [noMeltEnabled, setNoMeltEnabled] = useState(true);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl text-mocha-900 italic mb-2">Lojistik Kuralları</h2>
        <p className="text-sm text-mocha-500">Dandelion Chocolate modeliyle ısı hassasiyetli kargo yönetimi</p>
      </div>

      {/* No-Melt Guarantee */}
      <div className="p-6 bg-white rounded-xl border border-cream-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-mocha-900 mb-1">No-Melt Guarantee</h3>
            <p className="text-xs text-mocha-500">Ürünlerin erimeden teslimatı için otomatik koruma</p>
          </div>
          <button
            onClick={() => setNoMeltEnabled(!noMeltEnabled)}
            className={`w-14 h-8 rounded-full transition-all ${noMeltEnabled ? 'bg-brand-mustard' : 'bg-cream-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${noMeltEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        </div>
        {noMeltEnabled && (
          <div className="p-4 bg-brand-peach/20 rounded-2xl border border-brand-peach">
            <p className="text-xs text-mocha-600">
              ✓ Hava sıcaklığı {tempThreshold}°C üzerinde otomatik buz aküsü eklenir<br/>
              ✓ Hafta sonu kargo beklemesini önlemek için gönderim günleri sınırlandırılır
            </p>
          </div>
        )}
      </div>

      {/* Shipping Days */}
      <div className="p-6 bg-white rounded-xl border border-cream-200">
        <h3 className="text-lg font-bold text-mocha-900 mb-4">Kargo Günleri</h3>
        <p className="text-xs text-mocha-500 mb-4">Siparişlerin hangi günler kargoya verilebileceğini belirleyin</p>
        <div className="grid grid-cols-7 gap-3">
          {Object.entries(shippingDays).map(([day, enabled]) => (
            <button
              key={day}
              onClick={() => setShippingDays({ ...shippingDays, [day]: !enabled })}
              className={`p-4 rounded-2xl text-xs font-bold uppercase transition-all ${
                enabled
                  ? 'bg-brand-mustard text-white shadow-sm'
                  : 'bg-cream-100 text-mocha-400'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature Threshold */}
      <div className="p-6 bg-white rounded-xl border border-cream-200">
        <h3 className="text-lg font-bold text-mocha-900 mb-4">Sıcaklık Eşiği</h3>
        <p className="text-xs text-mocha-500 mb-4">Bu sıcaklığın üzerinde buz aküsü otomatik eklenir</p>
        <div className="flex items-center gap-6">
          <input
            type="range"
            min="15"
            max="30"
            value={tempThreshold}
            onChange={(e) => setTempThreshold(Number(e.target.value))}
            className="flex-1 h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="w-24 text-center">
            <span className="text-3xl text-mocha-900">{tempThreshold}</span>
            <span className="text-sm text-mocha-400">°C</span>
          </div>
        </div>
      </div>

      {/* City Delivery Times */}
      <div className="p-6 bg-white rounded-xl border border-cream-200">
        <h3 className="text-lg font-bold text-mocha-900 mb-4">Şehir Bazlı Teslimat Süreleri</h3>
        <div className="space-y-3">
          {[
            { city: 'İstanbul', hours: 24 },
            { city: 'Ankara', hours: 24 },
            { city: 'İzmir', hours: 48 },
            { city: 'Antalya', hours: 48 },
            { city: 'Van', hours: 72 }
          ].map((item) => (
            <div key={item.city} className="flex items-center justify-between p-4 bg-cream-50 rounded-2xl">
              <span className="text-sm font-medium text-mocha-900">{item.city}</span>
              <span className="text-xs text-mocha-500">{item.hours} saat</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- SLA FORMAT HELPER ---
const formatSLA = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} dakika`;
  } else if (minutes < 1440) {
    // 60-1440 dakika arası (1-24 saat)
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')} saat`;
  } else {
    // 24 saatten fazla
    const days = Math.floor(minutes / 1440);
    const remainingMinutes = minutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    return `${days} gün ${hours}:${mins.toString().padStart(2, '0')} saat`;
  }
};

// --- MAIN COMPONENT ---
export const OrderManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'logistics'>('orders');
  const [filter, setFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'card' | 'eft' | 'paid' | 'failed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isSeedingOrders, setIsSeedingOrders] = useState(false);
  const [isCheckingShipments, setIsCheckingShipments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Toast system
  const { toasts, removeToast, success, error: toastError, info } = useToast();

  // Get data from Zustand store
  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const initialize = useOrderStore((state) => state.initialize);
  const isInitialized = useOrderStore((state) => state.isInitialized);
  const cancelOrder = useOrderStore((state) => state.cancelOrder);

  // 🔥 Initialize Firestore connection on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // 🧹 Cleanup invalid orders
  const handleCleanup = async () => {
    if (!window.confirm('⚠️ Geçersiz siparişler silinecek. Devam etmek istiyor musunuz?')) {
      return;
    }

    setIsCleaningUp(true);
    info('Boş siparişler taranıyor...');

    try {
      const result = await cleanupInvalidOrders();
      success(`✅ Temizlik tamamlandı! ${result.deleted} geçersiz sipariş silindi.`);

      // Firestore listener otomatik güncellenir
      if (result.deleted > 0) {
        setTimeout(() => {
          info(`${result.total - result.deleted} geçerli sipariş kaldı.`);
        }, 2000);
      }
    } catch (err: any) {
      toastError(`❌ Temizlik başarısız: ${err.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  // 🌱 Seed mock orders for testing
  const handleSeedOrders = async () => {
    setIsSeedingOrders(true);
    info('Mock siparişler ekleniyor...');

    try {
      const added = await seedMockOrders();
      success(`✅ ${added} örnek sipariş eklendi!`);
    } catch (err: any) {
      toastError(`❌ Sipariş eklenemedi: ${err.message}`);
    } finally {
      setIsSeedingOrders(false);
    }
  };

  // 📦 Tüm kargoları kontrol et
  const handleCheckAllShipments = async () => {
    setIsCheckingShipments(true);
    info('Kargo durumları kontrol ediliyor...');

    try {
      const result = await checkAllShipmentStatus();
      if (result.success) {
        success(`✅ ${result.message}`);
        if (result.results && result.results.updated > 0) {
          info(`${result.results.updated} kargo harekete geçti, müşterilere bildirim gönderildi.`);
        }
      } else {
        toastError(`❌ Kontrol başarısız: ${result.message}`);
      }
    } catch (err: any) {
      toastError(`❌ Kontrol hatası: ${err.message}`);
    } finally {
      setIsCheckingShipments(false);
    }
  };

  const stats = {
    total: orders.length,
    urgent: orders.filter(o => o.priority === 'High').length,
    inProduction: orders.filter(o => o.status === 'In Production').length
  };

  // EFT bekleyen siparişleri filtrele (iptal edilenler hariç)
  const pendingEftOrders = orders.filter(o =>
    o.payment?.method === 'eft' &&
    o.status !== 'Cancelled' &&
    (o.status === 'Pending Payment' || o.status === 'pending' || o.payment?.status === 'pending')
  );

  // Ödeme onaylama fonksiyonu
  const confirmPayment = async (order: Order) => {
    try {
      const { doc, updateDoc, arrayUnion, Timestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const orderRef = doc(db, 'orders', order.firestoreId || order.id);
      await updateDoc(orderRef, {
        status: 'Awaiting Prep',
        'payment.status': 'paid',
        paymentConfirmedAt: new Date().toISOString(),
        timeline: arrayUnion({
          action: 'Ödeme onaylandı',
          time: new Date().toLocaleString('tr-TR'),
          note: 'Havale/EFT ödemesi manuel olarak onaylandı'
        })
      });

      success(`✅ ${order.id} ödemesi onaylandı!`);
    } catch (err: any) {
      toastError(`❌ Ödeme onaylanamadı: ${err.message}`);
    }
  };

  // Hızlı iptal fonksiyonu - Ödeme alınamadı
  const cancelOrderQuick = async (order: Order) => {
    try {
      await cancelOrder(order.firestoreId || order.id, {
        reason: 'Ödeme Alınamadı',
        notifyCustomer: true,
        refundPayment: false,
        notes: 'Havale/EFT ödemesi süresinde yapılmadığı için iptal edildi.'
      });
      success(`✅ ${order.id} iptal edildi ve müşteriye email gönderildi.`);
    } catch (err: any) {
      toastError(`❌ Sipariş iptal edilemedi: ${err.message}`);
    }
  };

  // Tutarları panoya kopyala
  const copyAmountsToClipboard = () => {
    const text = pendingEftOrders
      .map(o => `${o.id}: ₺${(o.payment?.total || 0).toLocaleString('tr-TR')}`)
      .join('\n');

    navigator.clipboard.writeText(text);
    success('📋 Tutarlar panoya kopyalandı!');
  };

  // Loading state
  if (isLoading && !isInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-mustard/30 border-t-brand-mustard rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-mocha-500">Siparişler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <h3 className="text-xl text-mocha-900">Bağlantı Hatası</h3>
          <p className="text-sm text-mocha-500">{error}</p>
          <button
            onClick={() => initialize()}
            className="px-6 py-3 bg-brand-mustard text-white rounded-2xl hover:bg-brand-mustard/90 transition-colors"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Tab Navigation */}
      <div className="mb-8 border-b border-cream-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'orders'
                ? 'text-mocha-900 border-b-2 border-brand-mustard'
                : 'text-mocha-400 hover:text-mocha-600'
            }`}
          >
            Siparişler
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'logistics'
                ? 'text-mocha-900 border-b-2 border-brand-mustard'
                : 'text-mocha-400 hover:text-mocha-600'
            }`}
          >
            Lojistik Kuralları
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'logistics' ? (
        <LogisticsRulesPanel />
      ) : (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-brand-mustard text-xs font-medium uppercase tracking-[0.5em] mb-3 block">
              Operasyonel Orkestrasyon
            </span>
            <h1 className="text-4xl font-light tracking-tight text-mocha-900 italic">
              Sipariş Yönetim Paneli
            </h1>
          </div>

          <div className="flex gap-8 text-right">
            <div>
              <p className="text-3xl text-mocha-900">{stats.total}</p>
              <p className="text-xs uppercase tracking-wider text-mocha-400 font-bold">Aktif Sipariş</p>
            </div>
            <div>
              <p className="text-3xl text-red-600">{stats.urgent}</p>
              <p className="text-xs uppercase tracking-wider text-mocha-400 font-bold">Kritik SLA</p>
            </div>
            <div className="bg-brand-mustard text-black p-4 rounded-2xl shadow-xl">
              <p className="text-2xl font-semibold">{stats.inProduction}</p>
              <p className="text-xs uppercase tracking-wider opacity-60 font-bold">Şu An Mutfakta</p>
            </div>
          </div>
        </div>
      </header>

      {/* EFT Ödeme Onay Paneli */}
      {pendingEftOrders.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200 overflow-hidden">
          <div className="p-4 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Landmark className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Bekleyen EFT Ödemeleri</h3>
                <p className="text-xs text-amber-600">{pendingEftOrders.length} sipariş ödeme bekliyor</p>
              </div>
            </div>
            <button
              onClick={copyAmountsToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <FileText size={14} />
              Tutarları Kopyala
            </button>
          </div>

          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {pendingEftOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center gap-4 p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
              >
                {/* Sipariş Bilgisi */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-mocha-900">{order.id}</span>
                    <span className="text-xs text-mocha-400">{order.customer?.name}</span>
                  </div>
                  <p className="text-xs text-mocha-500 truncate">{order.customer?.email}</p>
                </div>

                {/* Tutar */}
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600">₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</p>
                  {order.bankTransferDiscount && order.bankTransferDiscount > 0 && (
                    <p className="text-xs text-emerald-600">-₺{order.bankTransferDiscount.toFixed(0)} indirim</p>
                  )}
                </div>

                {/* Geri Sayım */}
                <div className="w-28">
                  {order.paymentDeadline ? (
                    <EftCountdown deadline={order.paymentDeadline} compact />
                  ) : (
                    <span className="text-xs text-mocha-400">Süre yok</span>
                  )}
                </div>

                {/* Onay Butonu */}
                <button
                  onClick={() => {
                    if (window.confirm(`${order.id} siparişinin ödemesini onaylamak istediğinize emin misiniz?\n\nTutar: ₺${(order.payment?.total || 0).toLocaleString('tr-TR')}`)) {
                      confirmPayment(order);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 size={14} />
                  Onayla
                </button>

                {/* İptal Butonu - Süre dolmuşsa göster */}
                {order.paymentDeadline && new Date(order.paymentDeadline).getTime() < Date.now() && (
                  <button
                    onClick={() => {
                      if (window.confirm(`${order.id} siparişini ödeme alınamadığı için iptal etmek istediğinize emin misiniz?\n\nMüşteriye bilgilendirme emaili gönderilecektir.`)) {
                        cancelOrderQuick(order);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                  >
                    <XCircle size={14} />
                    İptal
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Toplam */}
          <div className="p-4 bg-amber-100 border-t border-amber-200 flex items-center justify-between">
            <span className="text-sm font-bold text-amber-800">Toplam Beklenen</span>
            <span className="text-xl font-bold text-amber-600">
              ₺{pendingEftOrders.reduce((sum, o) => sum + (o.payment?.total || 0), 0).toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Durum Filtreleri */}
          {['All', 'Pending Payment', 'Awaiting Prep', 'In Production', 'Ready for Packing'].map(f => {
            const labels: Record<string, string> = {
              'All': 'Tümü',
              'Pending Payment': 'Ödeme Bekleniyor',
              'Awaiting Prep': 'Hazırlık Bekliyor',
              'In Production': 'Üretimde',
              'Ready for Packing': 'Paketlemeye Hazır'
            };
            const isPendingPayment = f === 'Pending Payment';
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all font-bold ${
                  filter === f
                    ? isPendingPayment
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-brown-900 text-white shadow-sm'
                    : isPendingPayment
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : 'bg-cream-100 text-mocha-500 hover:bg-cream-200'
                }`}
              >
                {labels[f] || f}
              </button>
            );
          })}

          {/* Ayırıcı */}
          <div className="w-px h-6 bg-cream-200 mx-1" />

          {/* Ödeme Filtreleri */}
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'Tüm Ödemeler', icon: '📊' },
              { key: 'card', label: 'Kart', icon: '💳' },
              { key: 'eft', label: 'EFT', icon: '🏦' },
              { key: 'paid', label: 'Ödendi', icon: '✓' },
              { key: 'failed', label: 'Başarısız', icon: '✗' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setPaymentFilter(key as typeof paymentFilter)}
                className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1 ${
                  paymentFilter === key
                    ? key === 'paid'
                      ? 'bg-emerald-500 text-white shadow'
                      : key === 'failed'
                        ? 'bg-red-500 text-white shadow'
                        : key === 'card'
                          ? 'bg-blue-500 text-white shadow'
                          : key === 'eft'
                            ? 'bg-amber-500 text-white shadow'
                            : 'bg-gray-700 text-white shadow'
                    : 'bg-cream-50 text-mocha-500 hover:bg-cream-100 border border-cream-200'
                }`}
                title={label}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedOrders}
            disabled={isSeedingOrders}
            className="px-4 py-2 bg-brand-mustard hover:bg-brand-mustard/80 disabled:bg-brand-mustard/50 text-mocha-900 text-xs uppercase tracking-wider font-bold rounded-2xl transition-colors flex items-center gap-2"
            title="Test için örnek siparişler ekle"
          >
            <Package size={14} />
            {isSeedingOrders ? 'Ekleniyor...' : '3 Örnek Sipariş Ekle'}
          </button>
          <button
            onClick={handleCleanup}
            disabled={isCleaningUp}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs uppercase tracking-wider font-bold rounded-2xl transition-colors flex items-center gap-2"
            title="Geçersiz siparişleri temizle"
          >
            <XCircle size={14} />
            {isCleaningUp ? 'Temizleniyor...' : 'Boş Siparişleri Temizle'}
          </button>
          <button
            onClick={handleCheckAllShipments}
            disabled={isCheckingShipments}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs uppercase tracking-wider font-bold rounded-2xl transition-colors flex items-center gap-2"
            title="Tüm shipped siparişlerin kargo durumunu kontrol et"
          >
            <RefreshCw size={14} className={isCheckingShipments ? 'animate-spin' : ''} />
            {isCheckingShipments ? 'Kontrol Ediliyor...' : 'Kargoları Kontrol Et'}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha-400" size={16} />
            <input
              type="text"
              placeholder="Sipariş No, Ad, Email, Telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-cream-50 border border-cream-200 rounded-2xl focus:border-brand-mustard outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Orders Table/List */}
      <div className="bg-white rounded-xl border border-cream-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-mocha-400 font-bold">Sipariş No</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-mocha-400 font-bold">Müşteri</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-mocha-400 font-bold">Ürünler</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-mocha-400 font-bold">Durum</th>
              <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-mocha-400 font-bold">Toplam</th>
              <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-mocha-400 font-bold">SLA</th>
            </tr>
          </thead>
          <tbody>
            {orders
              .filter(o => filter === 'All' || o.status === filter)
              .filter(o => {
                if (paymentFilter === 'all') return true;
                if (paymentFilter === 'card') return o.payment?.method === 'card';
                if (paymentFilter === 'eft') return o.payment?.method === 'eft';
                if (paymentFilter === 'paid') return o.payment?.status === 'paid';
                if (paymentFilter === 'failed') return o.payment?.status === 'failed';
                return true;
              })
              .filter(o => {
                if (!searchTerm.trim()) return true;
                const term = searchTerm.toLowerCase();
                return (
                  o.id?.toLowerCase().includes(term) ||
                  o.customer?.name?.toLowerCase().includes(term) ||
                  o.customer?.email?.toLowerCase().includes(term) ||
                  o.customer?.phone?.toLowerCase().includes(term)
                );
              })
              .map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="border-b border-cream-200 hover:bg-cream-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm text-mocha-900 italic">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-mocha-900 font-medium">{order.customer?.name || 'İsimsiz Müşteri'}</p>
                        <p className="text-xs text-mocha-400">{order.customer?.email || 'Email yok'}</p>
                      </div>
                      {order.customerTier && (
                        <TierBadge tier={order.customerTier} size="sm" showLabel={false} />
                      )}
                    </div>
                    {/* Tags */}
                    {order.tags && order.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {order.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                              tag.color === 'yellow' ? 'bg-brand-yellow/30 text-yellow-800 border border-brand-yellow' :
                              tag.color === 'orange' ? 'bg-brand-orange/30 text-orange-800 border border-brand-orange' :
                              tag.color === 'peach' ? 'bg-brand-peach/30 text-red-800 border border-brand-peach' :
                              tag.color === 'blue' ? 'bg-brand-blue/30 text-blue-800 border border-brand-blue' :
                              tag.color === 'green' ? 'bg-brand-green/30 text-green-800 border border-brand-green' :
                              'bg-brand-mustard/30 text-yellow-900 border border-brand-mustard'
                            }`}
                          >
                            {tag.label}
                          </span>
                        ))}
                        {order.tags.length > 3 && (
                          <span className="text-[8px] text-mocha-400 font-bold">+{order.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-mocha-600">{order.items?.length || 0} ürün</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={order.status || 'Awaiting Prep'} />
                        {order.payment?.method === 'eft' && (
                          <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                            EFT
                          </span>
                        )}
                        {order.payment?.method === 'card' && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                            order.payment?.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-600'
                              : order.payment?.status === 'failed'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-blue-100 text-blue-600'
                          }`}>
                            💳 {order.payment?.lastFourDigits ? `*${order.payment.lastFourDigits}` : 'Kart'}
                          </span>
                        )}
                        {/* Hediye Çantası Uyarısı */}
                        {order.hasGiftBag && (
                          <span className="text-[8px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-bold animate-pulse flex items-center gap-1">
                            🛍️ Çanta
                          </span>
                        )}
                        {/* Hediye Mesajı Uyarısı */}
                        {order.isGift && (
                          <span className="text-[8px] bg-gold/20 text-amber-700 px-1.5 py-0.5 rounded font-bold animate-pulse flex items-center gap-1">
                            🎁 Hediye
                          </span>
                        )}
                      </div>
                      {/* EFT Countdown - sadece ödeme bekleyen siparişlerde */}
                      {order.payment?.method === 'eft' && (order.status === 'Pending Payment' || order.status === 'pending' || order.payment?.status === 'pending') && order.paymentDeadline && (
                        <EftCountdown deadline={order.paymentDeadline} compact />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-mocha-900">₺{(order.payment?.total || 0).toLocaleString('tr-TR')}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-medium ${(order.sla || 0) < 15 ? 'text-red-600' : (order.sla || 0) > 1440 ? 'text-orange-500' : 'text-mocha-500'}`}>
                      {formatSLA(order.sla || 0)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
      )}
    </div>
  );
};
