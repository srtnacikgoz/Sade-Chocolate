import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { CompanyInfo } from '../types';

interface FooterProps {
  onLogoClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLogoClick }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        subscribedAt: serverTimestamp(),
        source: 'footer'
      });
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
            src="/kakaoLogo.svg"
            alt="Sade Chocolate"
            className="w-14 h-14 opacity-70 dark:invert"
          />
          <span className="font-display font-bold text-4xl tracking-tight text-brown-900 dark:text-white italic">
            Sade <span className="text-gold">Chocolate</span>
          </span>
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
          <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
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
              disabled={isSubmitting}
              className="px-6 py-3 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-full hover:bg-gold dark:hover:bg-gold/90 transition-colors flex items-center gap-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {isSubmitting ? 'Kaydediliyor...' : 'Abone Ol'}
            </button>
          </form>
        </div>

        <div className="flex justify-center space-x-8 mb-12">
          <a
            href={primaryBranch?.mapLink || "https://www.google.com/maps/search/?api=1&query=Antalya"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm"
          >
            <i className="material-icons-outlined">place</i>
          </a>
          {companyInfo?.socialMedia?.instagram && (
            <a
              href={`https://instagram.com/${companyInfo.socialMedia.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm"
            >
              <i className="material-icons-outlined">camera_alt</i>
            </a>
          )}
          {!companyInfo?.socialMedia?.instagram && (
            <a
              href="https://instagram.com/sadepatisserie"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm"
            >
              <i className="material-icons-outlined">camera_alt</i>
            </a>
          )}
          <a
            href={`mailto:${companyInfo?.generalEmail || 'bilgi@sadepatisserie.com'}`}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-gold transition-all shadow-sm"
          >
            <i className="material-icons-outlined">alternate_email</i>
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
          <Link to="/legal/refund" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            İptal & İade
          </Link>
          <Link to="/legal/shipping" className="text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors">
            Teslimat
          </Link>
        </div>

        <p className="font-sans text-[10px] text-gray-300 dark:text-gray-600 uppercase tracking-[0.4em] mb-4">
          Powered by Sade Patisserie • Antalya
        </p>
        <p className="font-sans text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
          {t('footer_rights')}
        </p>
      </div>
    </footer>
  );
};
