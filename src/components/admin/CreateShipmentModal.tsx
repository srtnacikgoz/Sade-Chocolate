import React, { useState } from 'react';
import { Order } from '../../types/order';
import { X, Truck, Package, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { createShipment } from '../../services/shippingService';
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
  const [isCreating, setIsCreating] = useState(false);
  const [weight, setWeight] = useState<number>(1);
  const [desi, setDesi] = useState<number>(2);
  const [coldPackage, setColdPackage] = useState<boolean>(false);
  const [contentDescription, setContentDescription] = useState<string>('Çikolata Ürünleri');

  const handleCreateShipment = async () => {
    if (!order.customer?.name || !order.customer?.phone || !order.customer?.address) {
      onError?.('Müşteri bilgileri eksik');
      return;
    }

    setIsCreating(true);

    try {
      const result = await createShipment({
        orderId: order.id,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        customerEmail: order.customer.email,
        shippingAddress: order.customer.address,
        shippingCity: order.customer.city,
        shippingDistrict: order.customer.district,
        weight,
        desi,
        contentDescription,
        coldPackage
      });

      if (result) {
        // Siparişi güncelle - Kargo bilgilerini ekle ve durumu "Shipped" yap
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          status: 'shipped',
          tracking: {
            carrier: result.carrier,
            trackingNumber: result.trackingNumber,
            barcode: result.barcode,
            estimatedDelivery: result.estimatedDelivery,
            shipmentId: result.shipmentId,
            createdAt: new Date()
          }
        });

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
      <div className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brown-600 to-mocha-600 text-white p-6 rounded-t-[32px] flex items-center justify-between">
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Müşteri Bilgileri */}
          <div className="bg-cream-50 rounded-2xl p-5">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package size={20} className="text-brown-600" />
              Alıcı Bilgileri
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Ad Soyad:</span> {order.customer?.name}</p>
              <p><span className="font-medium">Telefon:</span> {order.customer?.phone}</p>
              <p><span className="font-medium">E-posta:</span> {order.customer?.email || 'Belirtilmemiş'}</p>
              <p><span className="font-medium">Adres:</span> {order.customer?.address}</p>
              {order.customer?.city && (
                <p><span className="font-medium">Şehir/İlçe:</span> {order.customer.city} / {order.customer?.district || '-'}</p>
              )}
            </div>
          </div>

          {/* Paket Bilgileri */}
          <div className="bg-cream-50 rounded-2xl p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package size={20} className="text-brown-600" />
              Paket Bilgileri
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ağırlık (kg)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desi
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={desi}
                    onChange={(e) => setDesi(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik Açıklaması
                </label>
                <input
                  type="text"
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  placeholder="Çikolata Ürünleri"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="coldPackage"
                  checked={coldPackage}
                  onChange={(e) => setColdPackage(e.target.checked)}
                  className="w-5 h-5 text-brown-600 border-gray-300 rounded focus:ring-brown-500"
                />
                <label htmlFor="coldPackage" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Soğuk Paket (Isı Hassas Ürün)
                </label>
              </div>
            </div>
          </div>

          {/* Uyarı */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Dikkat</p>
              <p>Kargo oluşturulduktan sonra MNG Kargo sistemine otomatik olarak gönderilecek ve takip numarası oluşturulacaktır.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              İptal
            </button>
            <button
              onClick={handleCreateShipment}
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-brown-600 to-mocha-600 text-white rounded-2xl font-medium hover:from-brown-700 hover:to-mocha-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
};
