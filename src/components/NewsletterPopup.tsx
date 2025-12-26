import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Mail, Send, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NewsletterPopup: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has already seen/dismissed the popup
    const hasSeenPopup = localStorage.getItem('newsletter_popup_seen');
    const hasSubscribed = localStorage.getItem('newsletter_subscribed');

    if (!hasSeenPopup && !hasSubscribed) {
      // Show popup after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter_popup_seen', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        subscribedAt: serverTimestamp(),
        source: 'popup'
      });
      toast.success('Bültenimize abone oldunuz! 🎉');
      localStorage.setItem('newsletter_subscribed', 'true');
      setEmail('');
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Newsletter error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-dark-800 rounded-[40px] shadow-2xl max-w-md w-full p-8 lg:p-12 relative pointer-events-auto animate-scale-in border-4 border-gold/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="text-white" size={28} />
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4 italic tracking-tight">
            Özel Teklifler ve Haberler
          </h2>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Yeni ürünler, özel kampanyalar ve lezzetli haberler için bültenimize abone olun. İlk siparişinizde <strong className="text-gold">%10 indirim</strong> kazanın!
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="w-full px-6 py-4 rounded-full bg-gray-50 dark:bg-dark-700 border-2 border-gray-200 dark:border-gray-600 text-base outline-none focus:border-gold dark:text-white placeholder:text-gray-400 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-4 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-full hover:bg-gold dark:hover:bg-gold/90 transition-all flex items-center justify-center gap-3 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <Send size={20} />
              {isSubmitting ? 'Kaydediliyor...' : 'Abone Ol'}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6">
            Bültenimizden istediğiniz zaman çıkabilirsiniz. Gizliliğinize saygı duyuyoruz.
          </p>
        </div>
      </div>
    </>
  );
};
