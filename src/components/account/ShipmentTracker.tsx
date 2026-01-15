// src/components/account/ShipmentTracker.tsx
// Kargo Takip Komponenti - MNG Kargo entegrasyonu

import React, { useState, useEffect } from 'react';
import { Package, Truck, MapPin, CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { trackShipment, ShipmentStatus, ShipmentMovement } from '../../services/shippingService';

interface ShipmentTrackerProps {
  orderId: string;
  trackingNumber?: string;  // MNG takip numarası (varsa)
  onClose?: () => void;
}

// Durum ikonları ve renkleri
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800'
  },
  in_transit: {
    icon: Truck,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
  },
  out_for_delivery: {
    icon: MapPin,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800'
  },
  delivered: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  returned: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800'
  }
};

export const ShipmentTracker: React.FC<ShipmentTrackerProps> = ({ orderId, trackingNumber, onClose }) => {
  const [shipmentData, setShipmentData] = useState<ShipmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Önce MNG takip numarası varsa onu kullan, yoksa sipariş numarasını kullan
      const referenceId = trackingNumber || orderId;
      const data = await trackShipment(referenceId);
      if (data) {
        setShipmentData(data);
      } else {
        // Takip bilgisi bulunamadıysa, henüz kargoya verilmemiş olabilir
        setError(trackingNumber
          ? 'Kargo bilgisi henüz MNG sisteminde görünmüyor. Biraz sonra tekrar deneyin.'
          : 'Kargo henüz oluşturulmamış veya takip bilgisi bulunamadı.');
      }
    } catch (err) {
      setError('Kargo takip bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [orderId, trackingNumber]);

  // Loading State
  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-800 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-100 dark:bg-dark-800 rounded w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-dark-800 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-3 h-3 bg-gray-100 dark:bg-dark-800 rounded-full mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-dark-800 rounded w-2/3" />
                <div className="h-2 bg-gray-100 dark:bg-dark-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-dark-800 rounded-2xl flex items-center justify-center">
          <Package className="text-gray-400" size={28} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchTrackingData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-800 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gold hover:text-white transition-all"
          >
            <RefreshCw size={14} />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!shipmentData) return null;

  const statusConfig = STATUS_CONFIG[shipmentData.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header - Durum Özeti */}
      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${statusConfig.bg} ${statusConfig.border}`}>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
          <StatusIcon className={statusConfig.color} size={28} />
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${statusConfig.color}`}>
            {shipmentData.statusText}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
            Sipariş: {orderId}
          </p>
          {shipmentData.estimatedDelivery && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tahmini Teslimat: {shipmentData.estimatedDelivery}
            </p>
          )}
        </div>
        <button
          onClick={fetchTrackingData}
          className="p-2 hover:bg-white dark:hover:bg-dark-800 rounded-xl transition-colors"
          title="Yenile"
        >
          <RefreshCw size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Timeline */}
      {shipmentData.movements.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
            Gönderi Hareketleri
          </h4>
          <div className="space-y-0">
            {shipmentData.movements.map((movement, index) => (
              <TimelineItem
                key={index}
                movement={movement}
                isFirst={index === 0}
                isLast={index === shipmentData.movements.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Yardım */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-400 text-center">
          Sorularınız için: <span className="font-bold text-gold">destek@sadechocolate.com</span>
        </p>
      </div>
    </div>
  );
};

// Timeline Item Komponenti
const TimelineItem: React.FC<{
  movement: ShipmentMovement;
  isFirst: boolean;
  isLast: boolean;
}> = ({ movement, isFirst, isLast }) => {
  return (
    <div className="flex gap-4">
      {/* Timeline Line & Dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            isFirst
              ? 'bg-gold border-gold'
              : 'bg-white dark:bg-dark-900 border-gray-300 dark:border-gray-600'
          }`}
        />
        {!isLast && (
          <div className="w-0.5 h-full min-h-[40px] bg-gray-200 dark:bg-gray-700" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 ${isFirst ? '' : 'opacity-60'}`}>
        <p className={`text-sm font-medium ${isFirst ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
          {movement.description || movement.status}
        </p>
        {movement.location && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
            <MapPin size={10} />
            {movement.location}
          </p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          {movement.date} {movement.time}
        </p>
      </div>
    </div>
  );
};

export default ShipmentTracker;
