import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { Percent, Check, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

type CouponInputProps = {
  onApply: (discount: number) => void;
  guestEmail?: string;
};

export const CouponInput: React.FC<CouponInputProps> = ({ onApply, guestEmail }) => {
  const [code, setCode] = useState('');
  const [isApplied, setIsApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { cartTotal } = useCart();

  // Newsletter kuponu varsa otomatik uygula
  useEffect(() => {
    const newsletterCoupon = localStorage.getItem('newsletter_coupon');
    if (newsletterCoupon && !isApplied) {
      setCode(newsletterCoupon);
      applyCoupon(newsletterCoupon);
    }
  }, []);

  // Kullanıcı kimliğini belirle (login email veya guest email)
  const getUserIdentifier = (): string | null => {
    return auth.currentUser?.email || guestEmail || null;
  };

  const applyCoupon = async (couponCode: string) => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) return;

    setIsChecking(true);
    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', trimmed)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error('Geçersiz kupon kodu');
        onApply(0);
        return;
      }

      const couponDoc = snap.docs[0];
      const couponData = couponDoc.data();

      // Tek kullanımlık kupon kontrolü
      if (!couponData.reusable && couponData.isUsed) {
        toast.error('Bu kupon kodu zaten kullanılmış');
        onApply(0);
        return;
      }

      // Kampanya kuponu kontrolleri
      if (couponData.reusable) {
        // Toplam kullanım limiti
        if (couponData.maxUses) {
          const usedCount = couponData.usedCount || 0;
          if (usedCount >= couponData.maxUses) {
            toast.error('Bu kampanya kuponu kullanım limitine ulaştı');
            onApply(0);
            return;
          }
        }

        // Kişi başı tek kullanım kontrolü
        const userEmail = getUserIdentifier();
        const usedByList: string[] = couponData.usedBy || [];
        if (userEmail && usedByList.includes(userEmail.toLowerCase())) {
          toast.error('Bu kuponu daha önce kullandınız');
          onApply(0);
          return;
        }
      }

      // Son kullanma tarihi kontrolü
      if (couponData.expiresAt) {
        const expiryDate = couponData.expiresAt.toDate
          ? couponData.expiresAt.toDate()
          : new Date(couponData.expiresAt);
        if (expiryDate < new Date()) {
          toast.error('Bu kuponun süresi dolmuş');
          onApply(0);
          return;
        }
      }

      // Minimum sepet tutarı kontrolü
      if (couponData.minCartTotal && cartTotal < couponData.minCartTotal) {
        toast.error(`Bu kupon ₺${couponData.minCartTotal} ve üzeri siparişlerde geçerlidir`);
        onApply(0);
        return;
      }

      // İndirim hesapla
      let discount = 0;
      if (couponData.type === 'percentage') {
        discount = cartTotal * (couponData.value / 100);
        if (couponData.maxDiscount && discount > couponData.maxDiscount) {
          discount = couponData.maxDiscount;
        }
      } else if (couponData.type === 'fixed') {
        discount = couponData.value;
      }

      // Kupon bilgisini kaydet (sipariş tamamlanınca Firestore güncellenir)
      localStorage.setItem('applied_coupon_id', couponDoc.id);
      localStorage.setItem('applied_coupon_reusable', couponData.reusable ? 'true' : 'false');

      onApply(discount);
      setIsApplied(true);
      setAppliedCode(trimmed);
      toast.success(`Kupon uygulandı! ₺${discount.toFixed(2)} indirim`);
    } catch (error) {
      console.error('Kupon kontrol hatası:', error);
      toast.error('Kupon kontrol edilemedi');
    } finally {
      setIsChecking(false);
    }
  };

  const removeCoupon = () => {
    setIsApplied(false);
    setAppliedCode('');
    setCode('');
    onApply(0);
    localStorage.removeItem('applied_coupon_id');
    localStorage.removeItem('applied_coupon_reusable');
    localStorage.removeItem('newsletter_coupon');
  };

  if (isApplied) {
    return (
      <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 mt-4">
        <div className="flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {appliedCode}
          </span>
        </div>
        <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition-colors">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Kupon kodu"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>
        <button
          onClick={() => applyCoupon(code)}
          disabled={isChecking || !code.trim()}
          className="px-4 py-2.5 text-xs font-bold text-white bg-mocha-800 hover:bg-mocha-700 rounded-xl transition-colors disabled:opacity-50"
        >
          {isChecking ? '...' : 'Uygula'}
        </button>
      </div>
    </div>
  );
};
