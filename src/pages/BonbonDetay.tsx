// pages/BonbonDetay.tsx
// Tek bonbon detay sayfası

import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import { useBonbonDetail, BonbonCard } from '../features/bonbon';
import { CuratedBoxModal } from '../components/CuratedBoxModal';

// Accordion bileşeni - Grid-based smooth animasyon
const Accordion: React.FC<{ title: string; content?: string; defaultOpen?: boolean }> = ({ title, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!content || content.trim() === "" || content.includes("undefined")) return null;

  return (
    <div className="border-b border-cream-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group transition-all"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-mocha-500 group-hover:text-mocha-800 transition-colors">{title}</span>
        <div className={`p-1.5 rounded-full transition-all duration-500 ${isOpen ? 'bg-gold/10 rotate-90' : 'group-hover:bg-cream-100'}`}>
          <ChevronRight className={`transition-colors duration-500 ${isOpen ? 'text-gold' : 'text-mocha-300'}`} size={14} />
        </div>
      </button>

      {/* Grid-based smooth animasyon - titreme yapmaz */}
      <div className={`grid transition-all duration-500 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-mocha-600 whitespace-pre-line">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function BonbonDetay() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { bonbon, relatedBonbons, loading, error } = useBonbonDetail(slug);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);

  // 🔙 Kutudan gelindiyse geri dönüş bilgisi
  const fromBox = (location.state as any)?.fromBox as { id: string; title: string } | undefined;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 pt-40">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              {/* Görsel skeleton */}
              <div className="aspect-square max-w-md mx-auto bg-cream-200 rounded-2xl mb-8" />
              {/* İçerik skeleton */}
              <div className="space-y-4">
                <div className="h-8 bg-cream-200 rounded w-1/2 mx-auto" />
                <div className="h-4 bg-cream-100 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-cream-100 rounded w-2/3 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hata state
  if (error || !bonbon) {
    return (
      <div className="min-h-screen bg-cream-50 pt-40">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-mocha-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-serif text-mocha-900 mb-2">
              Bonbon Bulunamadı
            </h1>
            <p className="text-mocha-600 mb-6">
              Aradığınız bonbon mevcut değil veya kaldırılmış olabilir.
            </p>
            <Link
              to="/bonbonlar"
              className="inline-flex items-center text-gold-600 hover:text-gold-700 font-medium"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Koleksiyona Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { title, description, detailedDescription, image, images, attributes, tastingNotes, ingredients, allergens, nutritionalValues, origin } = bonbon;
  const displayImage = image || images?.[0];

  return (
    <div className="min-h-screen bg-cream-50 pt-40">
      <div className="container mx-auto px-4 py-8">
        {/* 🔙 Geri Dön Butonu */}
        <div className="max-w-4xl mx-auto mb-6">
          <Link
            to={fromBox ? `/product/${fromBox.id}` : '/bonbonlar'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cream-200/50 hover:bg-cream-200 text-mocha-600 rounded-full text-xs font-bold uppercase tracking-wider transition-all group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>{fromBox ? `${fromBox.title} Kutusuna Dön` : 'Bonbon Koleksiyonu'}</span>
          </Link>
        </div>

        {/* Ana içerik */}
        <div className="max-w-4xl mx-auto">
          {/* Hero Görsel */}
          <div className="mb-8">
            <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-2xl bg-white shadow-lg">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-mocha-300 bg-cream-100">
                  <svg
                    className="w-24 h-24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Bilgi Kartı */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center">
            {/* Başlık */}
            <h1 className="font-serif text-3xl md:text-4xl text-mocha-900 mb-4">
              {title}
            </h1>

            {/* Tat Profili Badge'leri */}
            {attributes && attributes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {attributes.map((attr) => (
                  <span
                    key={attr}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium bg-cream-100 text-mocha-700 rounded-full"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            )}

            {/* Açıklama */}
            <div className="max-w-2xl mx-auto">
              {detailedDescription ? (
                <p className="text-mocha-700 leading-relaxed">
                  {detailedDescription}
                </p>
              ) : description ? (
                <p className="text-mocha-700 leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>

            {/* Tadım Notları */}
            {tastingNotes && (
              <div className="mt-8 pt-8 border-t border-cream-100">
                <h2 className="font-serif text-xl text-mocha-800 mb-3">
                  Tadım Notları
                </h2>
                <p className="text-mocha-600 italic max-w-xl mx-auto">
                  "{tastingNotes}"
                </p>
              </div>
            )}

            {/* Kutuya Ekle Butonu - Sadece kutudan gelmediğinde göster */}
            {!fromBox && bonbon.isBoxContent !== false && (
              <div className="mt-8 pt-8 border-t border-cream-100">
                <button
                  onClick={() => setIsBoxModalOpen(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold/90 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:from-gold/90 hover:to-gold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Package size={20} />
                  Kutuya Ekle
                </button>
                <p className="text-xs text-mocha-400 mt-3">
                  Bu bonbonu kendi kutuna ekleyebilirsin
                </p>
              </div>
            )}

            {/* 📋 Ürün Bilgileri Accordion'ları */}
            {(ingredients || allergens || nutritionalValues || origin) && (
              <div className="mt-8 pt-8 border-t border-cream-100 text-left">
                <Accordion
                  title="İçindekiler & Alerjen"
                  content={ingredients + (allergens ? `\n\nAlerjen: ${allergens}` : '')}
                  defaultOpen={false}
                />
                <Accordion
                  title="Besin Değerleri"
                  content={nutritionalValues}
                />
                <Accordion
                  title="Üretim & Menşei"
                  content={origin}
                />
              </div>
            )}
          </div>

          {/* İlgili Bonbonlar */}
          {relatedBonbons.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-2xl text-mocha-900 mb-6 text-center">
                Benzer Bonbonlar
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedBonbons.map((related) => (
                  <BonbonCard key={related.id} bonbon={related} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Kutu Oluşturucu Modal */}
      <CuratedBoxModal
        isOpen={isBoxModalOpen}
        onClose={() => setIsBoxModalOpen(false)}
        initialProduct={bonbon}
      />
    </div>
  );
}
