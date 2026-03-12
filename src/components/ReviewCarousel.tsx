import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Review } from '../types';

export function ReviewCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('status', '==', 'approved'),
          where('rating', '>', 0),
          orderBy('rating', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(8)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Review[];
        setReviews(data);
      } catch (err) {
        console.error('Yorumlar yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const goTo = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prev => {
      if (direction === 'next') return (prev + 1) % reviews.length;
      return (prev - 1 + reviews.length) % reviews.length;
    });
  }, [reviews.length]);

  if (loading || reviews.length === 0) return null;

  const getVisibleReviews = () => {
    const visible: Review[] = [];
    for (let i = 0; i < Math.min(3, reviews.length); i++) {
      visible.push(reviews[(currentIndex + i) % reviews.length]);
    }
    return visible;
  };

  return (
    <section className="py-20 bg-cream-50/50">
      <div className="sade-container">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-mocha-400 mb-3">Müşterilerimizden</p>
          <h2 className="text-3xl md:text-4xl font-serif italic text-mocha-900">Deneyimler</h2>
        </div>

        <div className="relative">
          {reviews.length > 1 && (
            <>
              <button
                onClick={() => goTo('prev')}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-sm items-center justify-center text-mocha-400 hover:text-mocha-900 transition-colors hidden md:flex"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => goTo('next')}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-sm items-center justify-center text-mocha-400 hover:text-mocha-900 transition-colors hidden md:flex"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getVisibleReviews().map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200 transition-all duration-500"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={star <= review.rating ? 'fill-brand-mustard text-brand-mustard' : 'text-cream-300'}
                    />
                  ))}
                </div>

                <p className="text-mocha-700 text-sm leading-relaxed mb-4 line-clamp-4">
                  &ldquo;{review.comment}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-cream-100">
                  <div className="w-8 h-8 bg-mocha-100 rounded-full flex items-center justify-center text-mocha-500 text-xs font-bold">
                    {review.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mocha-900">{review.customerName}</p>
                    <p className="text-xs text-mocha-400">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? 'bg-mocha-900 w-6' : 'bg-cream-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
