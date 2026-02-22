import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { ArrowLeft, X } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Legal: React.FC = () => {
  const { t, language } = useLanguage();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [legalData, setLegalData] = useState<any>(null);

  // popup=true parametresi varsa yeni sekmede açılmış demektir
  const isPopup = searchParams.get('popup') === 'true';

  const handleGoBack = () => {
    if (isPopup) {
      window.close();
      // Tarayıcı kapatmayı engellediyse checkout'a yönlendir
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 200);
    } else {
      navigate(-1);
    }
  };

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
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
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
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
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
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
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
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
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
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
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
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_refund')}</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {getContent('refund_content')}
            </div>
          </section>
        );
      case 'cookies':
        return (
          <section className="animate-fade-in">
            <button
              onClick={handleGoBack}
              className="mb-8 flex items-center gap-3 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {isPopup ? (
                <X size={16} className="group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
              )}
              {isPopup ? 'KAPAT' : 'GERİ DÖN'}
            </button>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">Çerez Politikası</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400 space-y-6">
              {/* CMS içeriği varsa göster, yoksa statik metin */}
              {legalData?.[language]?.cookies_content ? (
                <div className="whitespace-pre-wrap">{getContent('cookies_content')}</div>
              ) : (
                <>
                  <p>Bu Çerez Politikası, sadechocolate.com web sitemizde kullanılan çerezler hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.</p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8">1. Çerez Nedir?</h3>
                  <p>Çerezler, web sitelerinin cihazınıza yerleştirdiği küçük metin dosyalarıdır. Siteyi kullanırken deneyiminizi iyileştirmek, tercihlerinizi hatırlamak ve site performansını analiz etmek için kullanılır.</p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8">2. Kullandığımız Çerez Türleri</h3>

                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4">a) Zorunlu Çerezler</h4>
                  <p>Sitenin temel işlevleri için gereklidir. Oturum yönetimi, sepet bilgileri ve güvenlik için kullanılır. Bu çerezler kapatılamaz.</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Firebase Auth</strong> - Kullanıcı oturum yönetimi</li>
                    <li><strong>cookie_consent</strong> - Çerez tercihlerinizin saklanması</li>
                    <li><strong>Firestore Cache</strong> - Sayfa performansı için yerel önbellek</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4">b) Analitik Çerezler</h4>
                  <p>Siteyi nasıl kullandığınızı anlamamıza yardımcı olur. Anonim istatistikler toplanır. Onayınız olmadan etkinleştirilmez.</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Google Analytics 4 (GA4)</strong> - Sayfa görüntüleme, ziyaretçi sayısı, dönüşüm analizi</li>
                    <li><strong>Firebase Analytics</strong> - Uygulama performansı ve kullanım istatistikleri</li>
                  </ul>

                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4">c) Pazarlama Çerezleri</h4>
                  <p>Reklam kampanyalarının etkinliğini ölçmek ve size ilgili reklamlar göstermek için kullanılır. Onayınız olmadan etkinleştirilmez.</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Meta Pixel (Facebook/Instagram)</strong> - Reklam dönüşüm takibi, hedefleme</li>
                    <li><strong>Meta Conversions API (CAPI)</strong> - Sunucu tarafı dönüşüm doğrulama</li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8">3. Üçüncü Taraf Hizmetler</h3>
                  <p>Aşağıdaki üçüncü taraf hizmet sağlayıcılarla veri paylaşımı yapılabilir:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Google LLC</strong> - Analytics, reklam hizmetleri (ABD - EU-US Data Privacy Framework)</li>
                    <li><strong>Meta Platforms Inc.</strong> - Reklam ve pazarlama (ABD - EU-US Data Privacy Framework)</li>
                    <li><strong>İyzico / iyzico Ödeme Hizmetleri A.Ş.</strong> - Güvenli ödeme işleme (Türkiye)</li>
                    <li><strong>SendGrid (Twilio)</strong> - E-posta gönderimi (ABD)</li>
                    <li><strong>Geliver</strong> - Kargo ve lojistik hizmetleri (Türkiye)</li>
                    <li><strong>Firebase (Google)</strong> - Altyapı ve veritabanı (ABD/AB)</li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8">4. Çerez Tercihlerinizi Yönetme</h3>
                  <p>Çerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sayfanın altındaki "Çerez Ayarları" bağlantısından</li>
                    <li>Tarayıcı ayarlarınızdan tüm çerezleri silebilir veya engelleyebilirsiniz</li>
                  </ul>
                  <p className="mt-2">Zorunlu çerezleri kapatmanız durumunda site düzgün çalışmayabilir.</p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8">5. Veri Sorumlusu</h3>
                  <p>
                    <strong>Sade Unlu Mamülleri San ve Tic Ltd Şti</strong><br />
                    Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya<br />
                    Vergi Dairesi: Antalya Kurumlar VD / 7361500827<br />
                    E-posta: bilgi@sadechocolate.com
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8">6. KVKK Kapsamında Haklarınız</h3>
                  <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                    <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                    <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                    <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                    <li>Eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</li>
                    <li>Silinmesini veya yok edilmesini isteme</li>
                    <li>İşlenen verilerin aleyhine bir sonuç doğurması durumunda itiraz etme</li>
                  </ul>
                  <p className="mt-2">Başvurularınız için: <strong>bilgi@sadechocolate.com</strong></p>

                  <p className="text-xs text-gray-400 mt-8">Son güncelleme: Şubat 2026</p>
                </>
              )}
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