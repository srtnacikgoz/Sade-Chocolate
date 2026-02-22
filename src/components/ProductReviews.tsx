import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

type ProductReviewsProps = {
  productId: string;
};

// Yıldız puanlama bileşeni
const StarRating = ({ rating, onRate, interactive = false, size = 18 }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: number;
}) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={size}
            className={
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300'
            }
          />
        </button>
      ))}
    </div>
  );
};

// Ortalama puan gösterici (Catalog'da kullanılabilir)
export const AverageRating = ({ productId }: { productId: string }) => {
  const [avg, setAvg] = useState<number>(0);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('productId', '==', productId)
        );
        const snap = await getDocs(q);
        if (snap.size > 0) {
          const total = snap.docs.reduce((sum, doc) => sum + (doc.data().rating || 0), 0);
          setAvg(total / snap.size);
          setCount(snap.size);
        }
      } catch {
        // Sessiz hata
      }
    };
    fetchRatings();
  }, [productId]);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <StarRating rating={Math.round(avg)} size={14} />
      <span className="text-xs text-mocha-400">({count})</span>
    </div>
  );
};

// Ana yorum bileşeni
export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('productId', '==', productId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Review[];
        setReviews(data);
      } catch (error) {
        console.error('Yorumlar yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }
    if (newRating === 0) {
      toast.error('Lütfen bir puan verin');
      return;
    }
    if (newComment.trim().length < 10) {
      toast.error('Yorum en az 10 karakter olmalı');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonim',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // Listeye ekle (optimistic update)
      setReviews(prev => [{
        id: 'new',
        productId,
        userId: auth.currentUser!.uid,
        userName: auth.currentUser!.displayName || 'Anonim',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date()
      }, ...prev]);

      setNewRating(0);
      setNewComment('');
      setShowForm(false);
      toast.success('Yorumunuz eklendi');
    } catch (error) {
      console.error('Yorum eklenemedi:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="mt-12 pt-8 border-t border-cream-200 dark:border-dark-700">
      {/* Başlık ve Özet */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-mocha-800 dark:text-cream-100">
            Müşteri Yorumları
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(avgRating)} size={16} />
              <span className="text-sm text-mocha-500">
                {avgRating.toFixed(1)} ({reviews.length} yorum)
              </span>
            </div>
          )}
        </div>
        {auth.currentUser && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-xs font-medium text-mocha-700 bg-cream-200 hover:bg-cream-300 dark:bg-dark-700 dark:text-cream-200 dark:hover:bg-dark-600 rounded-xl transition-colors"
          >
            Yorum Yaz
          </button>
        )}
      </div>

      {/* Yorum Formu */}
      {showForm && (
        <div className="mb-8 p-5 bg-cream-50 dark:bg-dark-800 rounded-2xl border border-cream-200 dark:border-dark-700">
          <div className="mb-4">
            <p className="text-sm font-medium text-mocha-700 dark:text-cream-200 mb-2">Puanınız</p>
            <StarRating rating={newRating} onRate={setNewRating} interactive size={24} />
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Bu ürün hakkında düşüncelerinizi paylaşın..."
            className="w-full h-24 px-4 py-3 text-sm bg-white dark:bg-dark-900 border border-cream-200 dark:border-dark-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-mocha-800 hover:bg-mocha-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); }}
              className="px-5 py-2 text-xs font-medium text-mocha-500 hover:text-mocha-700 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Yorum Listesi */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-20 bg-cream-200 dark:bg-dark-800 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-mocha-400 dark:text-gray-500">
            Bu ürün için henüz yorum yapılmamış.
          </p>
          {!auth.currentUser && (
            <p className="text-xs text-mocha-300 mt-1">İlk yorumu siz yapın!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-white dark:bg-dark-800 rounded-xl border border-cream-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-mocha-100 dark:bg-dark-700 rounded-full flex items-center justify-center text-xs font-bold text-mocha-600">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mocha-700 dark:text-cream-200">
                      {review.userName}
                    </p>
                    <StarRating rating={review.rating} size={12} />
                  </div>
                </div>
                <span className="text-[10px] text-mocha-300 dark:text-gray-600">
                  {review.createdAt.toLocaleDateString('tr-TR')}
                </span>
              </div>
              <p className="text-sm text-mocha-600 dark:text-gray-400 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
