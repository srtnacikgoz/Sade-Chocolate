import React, { useState } from 'react';
import { Order } from '../../types/order';
import { X, Truck, Package, AlertCircle, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import { createGeliverShipment } from '../../services/shippingService';
import { sendShippingNotificationEmail } from '../../services/emailService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CreateShipmentModalProps {
  order: Order;
  onClose: () => void;
  onSuccess?: (trackingNumber: string) => void;
  onError?: (message: string) => void;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({
  order,
  onClose,
  onSuccess,
  onError
}) => {
  // Ürünlerden otomatik hesapla
  const calculateFromItems = () => {
    let totalWeightGram = 0;
    let totalDesi = 0;

    (order.items || []).forEach((item: any) => {
      const qty = item.quantity || 1;
      // Ağırlık (gram cinsinden)
      const itemWeight = item.weight || item.weightGram || 200; // varsayılan 200g
      totalWeightGram += itemWeight * qty;

      // Desi hesapla
      if (item.dimensions?.length && item.dimensions?.width && item.dimensions?.height) {
        const itemDesi = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 3000;
        totalDesi += itemDesi * qty;
      } else if (item.desi) {
        totalDesi += item.desi * qty;
      } else {
        totalDesi += 1 * qty; // varsayılan 1 desi
      }
    });

    return {
      weightGram: Math.max(totalWeightGram, 100), // minimum 100g
      desi: Math.max(Math.ceil(totalDesi), 1) // minimum 1 desi
    };
  };

  const calculated = calculateFromItems();

  const [isCreating, setIsCreating] = useState(false);
  const [weightGram, setWeightGram] = useState<number>(calculated.weightGram);
  const [desi, setDesi] = useState<number>(calculated.desi);
  const [coldPackage, setColdPackage] = useState<boolean>(false);
  const [contentDescription, setContentDescription] = useState<string>('Çikolata Ürünleri');

  const handleCreateShipment = async () => {
    // Adres bilgilerini shipping veya customer'dan al
    const shippingAddress = order.shipping?.address || order.customer?.address;
    const shippingCity = order.shipping?.city || order.customer?.city;
    const shippingDistrict = order.shipping?.district || order.customer?.district;
    const customerPhone = order.customer?.phone || order.shipping?.phone;

    if (!order.customer?.name || !customerPhone || !shippingAddress) {
      onError?.('Müşteri bilgileri eksik (isim, telefon veya adres)');
      return;
    }

    if (!shippingCity || !shippingDistrict) {
      onError?.('Şehir ve ilçe bilgisi gerekli');
      return;
    }

    setIsCreating(true);

    try {
      // Geliver API ile kargo oluştur
      const result = await createGeliverShipment({
        orderId: order.orderNumber || order.id,
        customerName: order.customer.name,
        customerPhone: customerPhone,
        customerEmail: order.customer.email,
        shippingAddress: shippingAddress,
        shippingCity: shippingCity,
        shippingDistrict: shippingDistrict,
        weight: weightGram / 1000, // gram'dan kg'a çevir
        desi,
        contentDescription,
        autoAccept: true // En ucuz teklifi otomatik kabul et
      });

      if (result) {
        // Siparişi güncelle - Kargo bilgilerini ekle ve durumu "Shipped" yap
        const docId = order.firestoreId || order.id;
        const orderRef = doc(db, 'orders', docId);

        await updateDoc(orderRef, {
          status: 'shipped',
          'shipping.trackingNumber': result.trackingNumber,
          'shipping.carrier': result.carrier,
          'shipping.labelUrl': result.labelUrl,
          tracking: {
            carrier: result.carrier,
            trackingNumber: result.trackingNumber,
            labelUrl: result.labelUrl,
            shipmentId: result.shipmentId,
            price: result.price,
            createdAt: new Date(),
            referenceId: order.orderNumber || order.id,
            provider: 'geliver'
          }
        });

        // Müşteriye kargo bildirimi gönder
        if (order.customer?.email) {
          const trackingUrl = `https://sadechocolate.com/hesabim?view=orders&track=${order.orderNumber || order.id}`;
          try {
            await sendShippingNotificationEmail(order.customer.email, {
              customerName: order.customer.name || 'Değerli Müşterimiz',
              orderId: order.orderNumber || order.id,
              trackingNumber: result.trackingNumber,
              carrierName: result.carrier || 'Kargo',
              trackingUrl
            });
          } catch (emailError) {
            console.error('Kargo bildirimi email hatası:', emailError);
            // Email hatası kargo işlemini engellemez
          }
        }

        onSuccess?.(result.trackingNumber);
        onClose();
      } else {
        onError?.('Kargo oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } catch (error: any) {
      console.error('Kargo oluşturma hatası:', error);
      onError?.(error.message || 'Kargo oluşturulurken bir hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-sm max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-mocha-900 to-mocha-400 text-white p-6 rounded-t-[32px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck size={28} />
            <div>
              <h2 className="text-2xl font-bold">Kargo Oluştur</h2>
              <p className="text-brown-100 text-sm">Sipariş: {order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Müşteri Bilgileri */}
          <div className="bg-cream-50 rounded-2xl p-5">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package size={20} className="text-brown-600" />
              Alıcı Bilgileri
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Ad Soyad:</span> {order.customer?.name}</p>
              <p><span className="font-medium">Telefon:</span> {order.customer?.phone || order.shipping?.phone || 'Belirtilmemiş'}</p>
              <p><span className="font-medium">E-posta:</span> {order.customer?.email || 'Belirtilmemiş'}</p>
              <p><span className="font-medium">Adres:</span> {order.shipping?.address || order.customer?.address || 'Belirtilmemiş'}</p>
              <p><span className="font-medium">Şehir/İlçe:</span> {order.shipping?.city || order.customer?.city || '-'} / {order.shipping?.district || order.customer?.district || '-'}</p>
            </div>
          </div>

          {/* Paket Bilgileri */}
          <div className="bg-cream-50 rounded-2xl p-5">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Package size={20} className="text-brown-600" />
              Paket Bilgileri
            </h3>
            <p className="text-xs text-mocha-500 mb-4">Ürün bilgilerinden otomatik hesaplandı, gerekirse düzenleyebilirsiniz.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Ağırlık (gram)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={weightGram}
                    onChange={(e) => setWeightGram(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-cream-200 rounded-xl focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  />
                  <p className="text-xs text-mocha-400 mt-1">{(weightGram / 1000).toFixed(2)} kg</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Desi
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={desi}
                    onChange={(e) => setDesi(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-cream-200 rounded-xl focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-mocha-600 mb-2">
                  İçerik Açıklaması
                </label>
                <input
                  type="text"
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-cream-200 rounded-xl focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  placeholder="Çikolata Ürünleri"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="coldPackage"
                  checked={coldPackage}
                  onChange={(e) => setColdPackage(e.target.checked)}
                  className="w-5 h-5 text-brown-600 border-cream-200 rounded focus:ring-brown-500"
                />
                <label htmlFor="coldPackage" className="text-sm font-medium text-mocha-600 cursor-pointer">
                  Soğuk Paket (Isı Hassas Ürün)
                </label>
              </div>
            </div>
          </div>

          {/* Bilgi */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <Truck className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Geliver ile Kargo</p>
              <p>10+ kargo firmasından (Aras, Yurtiçi, PTT, Sürat, HepsiJet, MNG...) en uygun fiyatlı teklif otomatik seçilecek ve kargo etiketi oluşturulacaktır.</p>
            </div>
          </div>
        </div>

        {/* Actions - Sticky Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-cream-200 bg-white rounded-b-[32px] flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-cream-200 text-mocha-600 rounded-2xl font-medium hover:bg-cream-50 transition-colors"
            disabled={isCreating}
          >
            İptal
          </button>
          <button
            onClick={handleCreateShipment}
            disabled={isCreating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-mocha-900 to-mocha-400 text-white rounded-2xl font-medium hover:from-mocha-900 hover:to-mocha-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader className="animate-spin" size={20} />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Kargo Oluştur
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
