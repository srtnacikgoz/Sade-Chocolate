import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { CompanyInfo } from '../types';
import { sendNewsletterWelcomeEmail } from '../services/emailService';

interface FooterProps {
  onLogoClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLogoClick }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  // Load company info from Firebase
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'company_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompanyInfo(docSnap.data() as CompanyInfo);
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };
    loadCompanyInfo();
  }, []);

  // Get primary branch for location link
  const primaryBranch = companyInfo?.branches?.find(b => b.isPrimary) || companyInfo?.branches?.[0];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!agreedToMarketing) {
      toast.error('Lütfen ticari ileti iznini onaylayın.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        subscribedAt: serverTimestamp(),
        source: 'footer',
        marketingConsent: true,
        marketingConsentDate: new Date().toISOString()
      });

      // Hoş geldin emaili gönder (arka planda)
      console.log('🔔 Newsletter email gönderiliyor:', email);
      sendNewsletterWelcomeEmail(email)
        .then(() => console.log('✅ Newsletter email kuyruğa eklendi'))
        .catch(err => console.error('❌ Newsletter welcome email error:', err));

      toast.success('Bültenimize abone oldunuz! 🎉');
      setEmail('');
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Newsletter error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full py-24 text-center border-t border-gray-100 dark:border-gray-800 mt-20 bg-white/50 dark:bg-dark-900/50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
        <div
          onClick={onLogoClick}
          className={`flex items-center justify-center gap-4 mb-10 ${onLogoClick ? 'cursor-pointer select-none' : ''}`}
        >
          <img
            src="/kakaologo.png"
            alt="Sade Chocolate"
            className="w-14 h-14 opacity-70 dark:invert"
          />
          <div className="text-4xl tracking-tight">
            <span className="font-santana font-bold text-brown-900 dark:text-white">Sade</span>{' '}
            <span className="font-santana font-normal text-gold">Chocolate</span>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="max-w-md mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="text-gold" size={20} />
            <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white italic">Bültenimize Katılın</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Yeni ürünler, özel kampanyalar ve lezzetli haberler için abone olun
          </p>
          <form onSubmit={handleNewsletterSubmit} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="flex-1 px-6 py-3 rounded-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-gold dark:text-white placeholder:text-gray-400 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !agreedToMarketing}
                className="px-6 py-3 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-full hover:bg-gold dark:hover:bg-gold/90 transition-colors flex items-center gap-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {isSubmitting ? 'Kaydediliyor...' : 'Abone Ol'}
              </button>
            </div>
            {/* Ticari ileti izni */}
            <div
              className="flex items-start gap-2 cursor-pointer mx-auto max-w-sm"
              onClick={() => setAgreedToMarketing(!agreedToMarketing)}
            >
              <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all mt-0.5 ${agreedToMarketing ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-300 dark:border-gray-600'}`}>
                {agreedToMarketing && <span className="material-icons-outlined text-white text-[12px]">check</span>}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed text-left">
                Ticari elektronik ileti gönderilmesini kabul ediyorum.
              </p>
            </div>
          </form>
        </div>

        <div className="flex justify-center gap-6 mb-12">
          <a
            href={primaryBranch?.mapLink || "https://www.google.com/maps/search/?api=1&query=Antalya"}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold transition-all duration-300 hover:scale-110 hover:shadow-lg"
          >
            <i className="material-icons-outlined text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300">place</i>
          </a>
          {companyInfo?.socialMedia?.instagram && (
            <a
              href={`https://instagram.com/${companyInfo.socialMedia.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold transition-all duration-300 hover:scale-110 hover:shadow-lg"
            >
              <i className="material-icons-outlined text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300">camera_alt</i>
            </a>
          )}
          {!companyInfo?.socialMedia?.instagram && (
            <a
              href="https://instagram.com/sade.chocolate"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold transition-all duration-300 hover:scale-110 hover:shadow-lg"
            >
              <i className="material-icons-outlined text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300">camera_alt</i>
            </a>
          )}
          <a
            href={`mailto:${companyInfo?.generalEmail || 'bilgi@sadechocolate.com'}`}
            className="group relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-800 dark:to-dark-900 border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold transition-all duration-300 hover:scale-110 hover:shadow-lg"
          >
            <i className="material-icons-outlined text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors duration-300">alternate_email</i>
          </a>
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 text-sm">
          <Link to="/legal/pre-info" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            Ön Bilgilendirme
          </Link>
          <Link to="/legal/distance-sales" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            Mesafeli Satış Sözleşmesi
          </Link>
          <Link to="/legal/kvkk" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            KVKK
          </Link>
          <Link to="/legal/privacy" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            Gizlilik Politikası
          </Link>
          <Link to="/legal/cookies" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            Çerez Politikası
          </Link>
          <Link to="/legal/refund" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            İptal & İade
          </Link>
          <Link to="/legal/shipping" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            Teslimat
          </Link>
          <button
            onClick={() => {
              // Cookie consent modal'ı yeniden göster
              localStorage.removeItem('cookie_consent');
              window.dispatchEvent(new Event('cookie_consent_changed'));
              window.location.reload();
            }}
            className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
          >
            Çerez Ayarları
          </button>
        </div>

        {/* Veri Sorumlusu Bilgisi */}
        <div className="text-[9px] text-gray-400 dark:text-gray-500 mb-4 space-y-0.5">
          <p>Veri Sorumlusu: Sade Unlu Mamülleri San ve Tic Ltd Şti</p>
          <p>Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya • bilgi@sadechocolate.com</p>
        </div>

        {/* Güvenli Ödeme & ETBİS Rozeti */}
        <div className="flex items-center justify-center gap-4 mb-8 py-4 flex-wrap">
          <img
            src="/payment/iyzico/iyzico-logo-pack/footer_iyzico_ile_ode/Colored/logo_band_colored.svg"
            alt="iyzico ile güvenli ödeme"
            className="h-8 opacity-60 hover:opacity-80 transition-opacity dark:hidden"
          />
          <img
            src="/payment/iyzico/iyzico-logo-pack/footer_iyzico_ile_ode/White/logo_band_white.svg"
            alt="iyzico ile güvenli ödeme"
            className="h-8 opacity-60 hover:opacity-80 transition-opacity hidden dark:block"
          />
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <i className="material-icons-outlined text-sm">lock</i>
            <span>256-bit SSL</span>
          </div>
        </div>

        {/* ETBİS Güven Rozeti */}
        <div className="flex justify-center mb-8">
          <a
            href="https://etbis.ticaret.gov.tr/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 hover:border-gold dark:hover:border-gold transition-all duration-300 hover:shadow-md"
            title="ETBİS - E-Ticaret Bilgi Sistemi Kayıtlı Site"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <i className="material-icons-outlined text-emerald-600 text-lg">verified</i>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-emerald-700 transition-colors">ETBİS Kayıtlı Site</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">T.C. Ticaret Bakanlığı</p>
            </div>
          </a>
        </div>

        <p className="font-sans text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Powered by Sade Patisserie • Antalya <span className="mx-2">•</span> {t('footer_rights')}
        </p>
      </div>

    </footer>
  );
};
