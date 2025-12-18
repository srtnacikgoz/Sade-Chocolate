import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';

export const Legal: React.FC = () => {
  const { t } = useLanguage();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const renderContent = () => {
    switch (type) {
      case 'pre-info':
        return (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_pre_info')}</h2>
            <div className="prose dark:prose-invert text-xs leading-relaxed text-gray-600 dark:text-gray-400 space-y-6">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Satıcı Bilgileri:</p>
                <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-1">
                  <p><span className="font-medium">Unvan:</span> Sade Unlu Mamülleri San ve Tic Ltd Şti</p>
                  <p><span className="font-medium">Adres:</span> Yeşilbahçe mahallesi Çınarlı cd 47/A Muratpaşa Antalya</p>
                  <p><span className="font-medium">Telefon:</span> 0552 896 30 26</p>
                  <p><span className="font-medium">E-Posta / KEP:</span> sadeunlumamulleri@hs01.kep.tr</p>
                  <p><span className="font-medium">MERSİS No:</span> 0736150082700001</p>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Ürün ve Teslimat:</p>
                <p>Sipariş konusu olan artizan çikolatalarımız, seçtiğiniz özelliklerde hazırlanarak kargo aracılığıyla adresinize ulaştırılacaktır. Ürünlerin fiyatı, tüm vergiler dahil olarak sepet toplamında belirtilen tutardır.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Cayma Hakkı İstisnası:</p>
                <div className="border-l-2 border-red-500 pl-4">
                   <p>29188 sayılı Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesi uyarınca; çabuk bozulabilen veya son kullanma tarihi geçme ihtimali olan gıda maddelerinde cayma hakkı kullanılamaz. Bu nedenle, koruyucu bandı açılmış veya ambalajı hasar görmüş gıda ürünlerinin iadesi sağlık ve hijyen kuralları gereği kabul edilmemektedir.</p>
                </div>
              </div>
            </div>
          </section>
        );
      case 'distance-sales':
        return (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_distance_sales')}</h2>
            <div className="prose dark:prose-invert text-xs leading-relaxed text-gray-600 dark:text-gray-400 space-y-6">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Madde 1: Taraflar</p>
                <p>Satıcı: Sade Unlu Mamülleri San ve Tic Ltd Şti (Antalya Kurumlar V.D. - 7361500827).</p>
                <p>Alıcı: Uygulama üzerinden sipariş oluşturan kullanıcı.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Madde 4: Teslimat ve İfa</p>
                <p>Satıcı, sipariş konusu ürünü sağlam, eksiksiz ve varsa belgeleri ile teslim etmekle yükümlüdür. Kargo teslimatı sırasında paket mutlaka kontrol edilmeli, hasar varsa tutanak tutulmalıdır.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Madde 6: Ödeme Koşulları</p>
                <p>Alıcı, sipariş tutarını kredi kartı veya belirtilen yöntemlerle ödemeyi kabul eder. Ödeme onaylanmadan ürün sevkiyatı yapılmaz.</p>
              </div>
            </div>
          </section>
        );
      case 'kvkk':
        return (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_kvkk')}</h2>
            <div className="prose dark:prose-invert text-xs leading-relaxed text-gray-600 dark:text-gray-400 space-y-6">
              <p>Sade Chocolate olarak kişisel verilerinizin güvenliğine önem veriyoruz.</p>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1">Veri Sorumlusu:</p>
                <p>Sade Unlu Mamülleri San ve Tic Ltd Şti.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1">İşlenen Veriler:</p>
                <p>İsim, adres, telefon ve e-posta bilgileriniz sadece siparişin teslimi ve yasal faturalandırma süreçleri için kullanılır.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1">Haklarınız:</p>
                <p>Verilerinizin silinmesini veya düzeltilmesini her zaman <a href="mailto:sadeunlumamulleri@hs01.kep.tr" className="text-brown-900 dark:text-white font-bold underline">sadeunlumamulleri@hs01.kep.tr</a> adresinden talep edebilirsiniz.</p>
              </div>
            </div>
          </section>
        );
      case 'refund':
        return (
          <section className="animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gold/20 pb-2">{t('legal_refund')}</h2>
            <div className="prose dark:prose-invert text-sm leading-relaxed text-gray-600 dark:text-gray-400">
               <div className="bg-brown-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <p className="font-handwriting text-2xl mb-4 italic">"Sade Chocolate'da her ürün, Belçika çikolatasının en saf haliyle ve gıda boyası içermeden, size özel el yapımı olarak üretilir."</p>
                  <p className="text-xs opacity-90 leading-relaxed">Gıda güvenliği gereği iade kabul edemiyor olsak da, kargo kaynaklı bir hasar veya üretim hatası durumunda yanınızdayız. Lütfen hasarlı paketi teslim alırken tutanak tutturun ve 0552 896 30 26 numaralı hattımızdan bizimle iletişime geçin.</p>
               </div>
            </div>
          </section>
        );
      default:
        return <div className="text-center py-20 text-gray-500">Belge bulunamadı.</div>;
    }
  };

  return (
    <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors group"
      >
        <span className="material-icons-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Geri Dön</span>
      </button>

      {renderContent()}
    </main>
  );
};