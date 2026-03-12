import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Star, Check, X, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { Review, ReviewStatus } from '../../../types';

export const ReviewsTab = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ReviewStatus | 'all'>('pending');

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(d => ({ ...d.data(), id: d.id })) as Review[]);
      } catch (err) {
        console.error('Yorumlar yüklenemedi:', err);
        toast.error('Yorumlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const updateStatus = async (reviewId: string, status: ReviewStatus) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
      toast.success(status === 'approved' ? 'Yorum onaylandı' : 'Yorum reddedildi');
    } catch (err) {
      console.error('Yorum güncellenemedi:', err);
      toast.error('Bir hata oluştu');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Yorum silindi');
    } catch (err) {
      console.error('Yorum silinemedi:', err);
      toast.error('Bir hata oluştu');
    }
  };

  const filtered = activeFilter === 'all'
    ? reviews
    : reviews.filter(r => r.status === activeFilter);

  const pendingCount = reviews.filter(r => r.status === 'pending' && r.rating > 0).length;

  const filters: Array<{ value: ReviewStatus | 'all'; label: string }> = [
    { value: 'pending', label: `Bekleyen${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { value: 'approved', label: 'Onaylanan' },
    { value: 'rejected', label: 'Reddedilen' },
    { value: 'all', label: 'Tümü' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-mustard border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-mocha-900 italic">Müşteri Yorumları</h2>
        <p className="text-sm text-mocha-400 mt-1">Yorumları onaylayın veya reddedin</p>
      </div>

      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-mocha-900 text-white'
                : 'bg-cream-100 text-mocha-600 hover:bg-cream-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-mocha-400">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p>Bu kategoride yorum yok</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-cream-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-mocha-100 rounded-full flex items-center justify-center text-mocha-500 font-bold">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-mocha-900">{review.customerName}</p>
                      <p className="text-xs text-mocha-400">
                        Sipariş #{review.orderId} &bull; {review.customerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? 'fill-brand-mustard text-brand-mustard' : 'text-cream-300'}
                      />
                    ))}
                  </div>

                  {review.comment ? (
                    <p className="text-sm text-mocha-700 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                  ) : (
                    <p className="text-sm text-mocha-400 italic">Henüz yorum yazılmamış (link gönderildi)</p>
                  )}

                  <p className="text-xs text-mocha-400 mt-2">
                    {new Date(review.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {review.status === 'pending' && review.rating > 0 && (
                    <>
                      <button
                        onClick={() => updateStatus(review.id, 'approved')}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                        title="Onayla"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => updateStatus(review.id, 'rejected')}
                        className="p-2 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors"
                        title="Reddet"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 bg-cream-100 text-mocha-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-cream-100">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  review.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {review.status === 'approved' ? 'Onaylandı' :
                   review.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
