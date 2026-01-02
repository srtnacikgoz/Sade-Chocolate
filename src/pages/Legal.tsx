import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Legal: React.FC = () => {
  const { t, language } = useLanguage();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [legalData, setLegalData] = useState<any>(null);

  // Firebase'den yasal metinleri çek
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'legal'), (doc) => {
      if (doc.exists()) setLegalData(doc.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const renderContent = () => {
    const getContent = (contentKey: string) => {
      return legalData?.[language]?.[contentKey] || 'İçerik yükleniyor...';
    };

    switch (type) {
      case 'privacy':
        return (
          <section className="animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              GERİ DÖN
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">Gizlilik Politikası</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('privacy_content')}
            </div>
          </section>
        );
      case 'shipping':
        return (
          <section className="animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              GERİ DÖN
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">Teslimat Koşulları</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('shipping_content')}
            </div>
          </section>
        );
      case 'pre-info':
        return (
          <section className="animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              GERİ DÖN
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_pre_info')}</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('preinfo_content')}
            </div>
          </section>
        );
      case 'distance-sales':
        return (
          <section className="animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              GERİ DÖN
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_distance_sales')}</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('distance_sales_content')}
            </div>
          </section>
        );
      case 'kvkk':
        return (
          <section className="animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              GERİ DÖN
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_kvkk')}</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('kvkk_content')}
            </div>
          </section>
        );
      case 'refund':
        return (
          <section className="animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              GERİ DÖN
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_refund')}</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('refund_content')}
            </div>
          </section>
        );
      default:
        return <div className="text-center py-20 text-gray-500">Belge bulunamadı.</div>;
    }
  };

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-44 pb-24 px-4 sm:px-6 lg:px-12 bg-cream-100 dark:bg-dark-900 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {renderContent()}
      </div>

      <Footer />
    </main>
  );
};