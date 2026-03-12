import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star } from 'lucide-react';
import type { Review } from '../types';

export function ReviewWrite() {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setError('Ge\u00e7ersiz link.');
      setLoading(false);
      return;
    }

    const loadReview = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('token', '==', token));
        const snap = await getDocs(q);

        if (snap.empty) {
          setError('Bu link art\u0131k ge\u00e7erli de\u011fil.');
          setLoading(false);
          return;
        }

        const data = { ...snap.docs[0].data(), id: snap.docs[0].id } as Review;

        if (data.rating > 0 && data.comment) {
          setSubmitted(true);
        }

        setReview(data);
        setCustomerName(data.customerName);
      } catch (err) {
        console.error('Yorum y\u00fcklenemedi:', err);
        setError('Bir hata olu\u015ftu.');
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [token]);

  const handleSubmit = async () => {
    if (!review) return;
    if (rating === 0) return;
    if (comment.trim().length < 10) return;

    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        rating,
        comment: comment.trim(),
        customerName: customerName.trim() || review.customerName,
        updatedAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Yorum g\u00f6nderilemedi:', err);
      setError('Yorum g\u00f6nderilirken bir hata olu\u015ftu. L\u00fctfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-mustard border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">\ud83d\ude14</div>
          <h1 className="text-xl font-semibold text-mocha-900 mb-2">Bir Sorun Olu\u015ftu</h1>
          <p className="text-mocha-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">\ud83e\udd0e</div>
          <h1 className="text-xl font-semibold text-mocha-900 mb-2">Te\u015fekk\u00fcr Ederiz!</h1>
          <p className="text-mocha-500">Yorumunuz onayland\u0131ktan sonra sitemizde yay\u0131nlanacakt\u0131r.</p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-mocha-900 text-white rounded-xl hover:bg-brand-mustard transition-colors text-sm font-medium"
          >
            Siteye D\u00f6n
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-mocha-900 italic mb-1">Sade Chocolate</h1>
          <p className="text-mocha-500 text-sm">Deneyiminizi bizimle payla\u015f\u0131n</p>
          <p className="text-mocha-400 text-xs mt-1">Sipari\u015f #{review?.orderId}</p>
        </div>

        {/* \u0130sim */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-mocha-500 uppercase tracking-wider mb-2">Ad\u0131n\u0131z</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-mustard/30"
          />
        </div>

        {/* Y\u0131ld\u0131z Puanlama */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-mocha-500 uppercase tracking-wider mb-3">Puan\u0131n\u0131z</label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={`transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-brand-mustard text-brand-mustard'
                      : 'text-cream-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating === 0 && <p className="text-xs text-red-400 text-center mt-2">L\u00fctfen bir puan se\u00e7in</p>}
        </div>

        {/* Yorum */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-mocha-500 uppercase tracking-wider mb-2">Yorumunuz</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="\u00c7ikolatalar\u0131n tad\u0131, teslimat deneyiminiz..."
            rows={4}
            className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-mustard/30 resize-none"
          />
          {comment.length > 0 && comment.trim().length < 10 && (
            <p className="text-xs text-red-400 mt-1">En az 10 karakter yazmal\u0131s\u0131n\u0131z</p>
          )}
        </div>

        {/* G\u00f6nder */}
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || comment.trim().length < 10}
          className="w-full py-3 bg-mocha-900 text-white rounded-xl font-medium text-sm hover:bg-brand-mustard transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'G\u00f6nderiliyor...' : 'Yorumu G\u00f6nder'}
        </button>
      </div>
    </div>
  );
}