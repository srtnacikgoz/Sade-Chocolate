import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Footer } from '../components/Footer';
import { CompanyInfo } from '../types';
import { MapPin, Phone, ExternalLink, Snowflake, BadgeCheck, Leaf, Droplets, Clock } from 'lucide-react';

// Hook for scroll-triggered animations
const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Animated counter component
const AnimatedStat: React.FC<{ value: string; label: string; delay?: number }> = ({ value, label, delay = 0 }) => {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="block font-display text-5xl lg:text-6xl text-mocha-900 dark:text-gold tracking-tight mb-2">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-mocha-400">
        {label}
      </span>
    </div>
  );
};

// Store card with hover effects
const StoreCard: React.FC<{
  name: string;
  address: string;
  phone: string;
  mapLink: string;
  index: number;
}> = ({ name, address, phone, mapLink, index }) => {
  const { ref, isVisible } = useScrollReveal(0.2);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`
        relative group transition-all duration-700
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{ transitionDelay: `${index * 150}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        relative bg-cream-50 dark:bg-dark-800 p-10 lg:p-12 rounded-3xl
        border border-mocha-100 dark:border-mocha-900/30
        transition-all duration-500
        ${isHovered ? 'shadow-2xl shadow-mocha-900/10 -translate-y-2' : 'shadow-lg shadow-mocha-900/5'}
      `}>
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden rounded-tr-3xl">
          <div className={`
            absolute top-0 right-0 w-32 h-32
            bg-gradient-to-bl from-gold/20 to-transparent
            transition-all duration-500
            ${isHovered ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}
          `} />
        </div>

        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center mb-8
          transition-all duration-500
          ${isHovered
            ? 'bg-gold text-cream-50 shadow-lg shadow-gold/30 scale-110 rotate-6'
            : 'bg-mocha-900 text-cream-50'
          }
        `}>
          <MapPin className="w-6 h-6" />
        </div>

        {/* Content */}
        <h3 className="font-display text-2xl lg:text-3xl font-semibold text-mocha-900 dark:text-cream-50 mb-4 tracking-tight">
          {name}
        </h3>

        <p className="text-mocha-400 dark:text-mocha-200 leading-relaxed mb-2">
          {address}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mocha-300 dark:text-mocha-400 mb-8">
          Muratpaşa, Antalya
        </p>

        {/* Actions */}
        <div className="pt-6 border-t border-mocha-100 dark:border-mocha-900/30 space-y-4">
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 text-mocha-900 dark:text-gold hover:text-gold dark:hover:text-cream-50 transition-colors group/link"
          >
            <Phone className="w-4 h-4" />
            <span className="font-medium">{phone}</span>
          </a>
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-900 dark:text-gold hover:text-gold dark:hover:text-cream-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Haritada Gör
          </a>
        </div>
      </div>
    </div>
  );
};

// Experience item component
const ExperienceItem: React.FC<{
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}> = ({ number, title, description, icon: Icon, delay }) => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className={`
        flex gap-6 items-start transition-all duration-700
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mocha-900 to-mocha-900/80 text-cream-50 flex items-center justify-center font-display text-lg font-semibold shadow-lg">
          {number}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-gold/20 flex items-center justify-center">
          <Icon className="w-3 h-3 text-gold" />
        </div>
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-display text-lg font-semibold text-mocha-900 dark:text-cream-50 mb-2">
          {title}
        </h4>
        <p className="text-mocha-400 dark:text-mocha-200 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export const About: React.FC = () => {
  const { language } = useLanguage();
  const [aboutData, setAboutData] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Firebase data fetching
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'about'), (doc) => {
      if (doc.exists()) {
        setAboutData(doc.data());
        setImageLoaded(false);
      }
    });
    return () => unsub();
  }, []);

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

  // Scroll reveal hooks for sections
  const heroReveal = useScrollReveal(0.1);
  const philosophyReveal = useScrollReveal(0.2);
  const deliveryReveal = useScrollReveal(0.2);
  const locationsReveal = useScrollReveal(0.1);

  // CMS Data with defaults
  const heroLabel = aboutData?.[language]?.hero_label || 'Hikayemiz';
  const heroTitle = aboutData?.[language]?.hero_title || 'Hile Yok,\nKalite Var.';
  const heroDescription = aboutData?.[language]?.hero_description || 'Sertan Açıkgöz\'ün butik pastanecilik vizyonuyla 2016\'dan bu yana Antalya\'da şekillenen Sade Patisserie, çikolatanın en saf halini modern bir sanat dalı olarak sunuyor.';
  const heroImage = aboutData?.[language]?.hero_image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPsg3jC391kW1kEstLZOiXYJ4jKeH3Ert6-SapPNTbe7UBTW72yhpEVQxRGouZVEwRX-i7uX-GpwZ9neF6MrhK2LhPe6QLacGfceRfOdJ_K37BAQLTzLKt_h8sx6qhFiqVyw5uaRjTbWGfD6oCOVh_xQvZflmUXHakFaeSX4YdxsGfUBIP8_OuhOi-G3sU22UrQfU6LFC8NSCm6Mw9eemRL8gBfnlKax26WRn4jZX4-iYvm7G3kRAGdqFhRT98yXL0F2g2l_aL3cs';
  const signature = aboutData?.[language]?.signature || 'Sertan Açıkgöz';
  const signatureFont = aboutData?.[language]?.signature_font || 'handwriting';
  const signatureColor = aboutData?.[language]?.signature_color || 'mocha-900';
  const signatureVisible = aboutData?.[language]?.signature_visible !== false;

  const heroDescriptionFont = aboutData?.[language]?.hero_description_font || 'sans';
  const heroDescriptionColor = aboutData?.[language]?.hero_description_color || 'mocha-400';
  const heroTitleSize = aboutData?.[language]?.hero_title_size || 'large';
  const heroTitleAlign = aboutData?.[language]?.hero_title_align || 'left';

  // Title size class mapping
  const titleSizeClass = heroTitleSize === 'small'
    ? 'text-3xl sm:text-4xl lg:text-5xl'
    : heroTitleSize === 'medium'
      ? 'text-4xl sm:text-5xl lg:text-6xl'
      : heroTitleSize === 'xlarge'
        ? 'text-6xl sm:text-7xl lg:text-8xl xl:text-9xl'
        : 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl'; // large (default)

  const philosophyTitle = aboutData?.[language]?.philosophy_title || '"Çikolata, Damağınızda Biten Değil, Kalbinizde Başlayan Bir Hikayedir."';
  const philosophyDescription = aboutData?.[language]?.philosophy_description || 'Sade Chocolate olarak inancımız basit: Minimalizm, lezzetin en saf halidir. Endüstriyel işlemlerden, gereksiz katkı maddelerinden ve yapay boyalardan uzak duruyoruz. En kaliteli Belçika çikolatasını sanat eserlerine dönüştürüyoruz.';

  const stat1Value = aboutData?.[language]?.stat1_value || '2016';
  const stat1Label = aboutData?.[language]?.stat1_label || 'Kuruluş';
  const stat2Value = aboutData?.[language]?.stat2_value || '%100';
  const stat2Label = aboutData?.[language]?.stat2_label || 'El Yapımı';
  const stat3Value = aboutData?.[language]?.stat3_value || '0';
  const stat3Label = aboutData?.[language]?.stat3_label || 'Katkı Maddesi';
  const stat4Value = aboutData?.[language]?.stat4_value || 'Belçika';
  const stat4Label = aboutData?.[language]?.stat4_label || 'Hammadde';

  const deliveryTitle = aboutData?.[language]?.delivery_title || 'Güvenli ve Isı Yalıtımlı Teslimat';
  const deliveryDescription = aboutData?.[language]?.delivery_description || 'Çikolatalarımız tüm Türkiye\'ye 1-3 iş günü içinde gönderilir. Yaz aylarında dahi lezzetin bozulmaması için ısı yalıtımlı özel paketler ve buz aküleri kullanıyoruz. Tazelik bizim için bir sözdür.';

  const exp1Title = aboutData?.[language]?.exp1_title || 'Gıda Boyasız';
  const exp1Desc = aboutData?.[language]?.exp1_desc || 'Ürünlerimizi sadece meyve ve sebzelerden elde edilen doğal renklerle süslüyoruz.';
  const exp2Title = aboutData?.[language]?.exp2_title || 'Saf Kakao Yağı';
  const exp2Desc = aboutData?.[language]?.exp2_desc || 'Çikolatalarımızda bitkisel yağ karışımları değil, sadece %100 saf kakao yağı bulunur.';
  const exp3Title = aboutData?.[language]?.exp3_title || 'Taze Üretim';
  const exp3Desc = aboutData?.[language]?.exp3_desc || 'Seri üretim yerine, her gün Antalya\'daki atölyemizde sipariş üzerine butik üretim yapıyoruz.';

  const locationsTitle = aboutData?.[language]?.locations_title || 'Atölyelerimiz & Şubelerimiz';

  // Branch data
  const activeBranches = companyInfo?.branches?.filter(b => b.isActive) || [];
  const store1Name = activeBranches[0]?.name || aboutData?.store1_name || 'Yeşilbahçe Şubesi';
  const store1Address = activeBranches[0]?.address || aboutData?.store1_address || 'Yeşilbahçe Mah. Çınarlı Cad. No:47/A';
  const store1Phone = activeBranches[0]?.phone || aboutData?.store1_phone || '0552 896 30 26';
  const store1Map = activeBranches[0]?.mapLink || aboutData?.store1_map || 'https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Yeşilbahçe';
  const store2Name = activeBranches[1]?.name || aboutData?.store2_name || 'Çağlayan Şubesi';
  const store2Address = activeBranches[1]?.address || aboutData?.store2_address || 'Çağlayan Mah. 2050 Sokak No:19';
  const store2Phone = activeBranches[1]?.phone || aboutData?.store2_phone || '0552 896 30 26';
  const store2Map = activeBranches[1]?.mapLink || aboutData?.store2_map || 'https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Çağlayan';

  return (
    <main className="w-full bg-cream-100 dark:bg-dark-900 min-h-screen overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION - Editorial Magazine Style
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-24 pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-100 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800" />

        {/* Decorative elements */}
        <div
          className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-mocha-200/10 blur-[80px]"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        />

        <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
          <div
            ref={heroReveal.ref}
            className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            {/* Text Content */}
            <div className={`transition-all duration-1000 ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              {/* Label */}
              <span
                className={`
                  inline-block font-sans text-[11px] font-semibold tracking-[0.4em] text-gold uppercase mb-8
                  transition-all duration-700 delay-100
                  ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
              >
                {heroLabel}
              </span>

              {/* Title with staggered animation */}
              <h1 className={`font-display ${titleSizeClass} text-mocha-900 dark:text-cream-50 mb-10 leading-[0.95] tracking-tight ${
                heroTitleAlign === 'center' ? 'text-center' : heroTitleAlign === 'right' ? 'text-right' : 'text-left'
              }`}>
                {heroTitle.split('\n').map((line, i) => (
                  <span
                    key={i}
                    className={`
                      block transition-all duration-700
                      ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                    `}
                    style={{ transitionDelay: `${200 + i * 150}ms` }}
                  >
                    {line}
                  </span>
                ))}
              </h1>

              {/* Description */}
              <p
                className={`
                  text-lg lg:text-xl leading-relaxed mb-12 max-w-xl
                  transition-all duration-700 delay-500
                  ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  ${heroDescriptionFont === 'serif' ? 'font-serif' : heroDescriptionFont === 'display' ? 'font-display' : 'font-sans'}
                  ${heroDescriptionColor === 'mocha-900' ? 'text-mocha-900 dark:text-mocha-100'
                    : heroDescriptionColor === 'gold' ? 'text-gold'
                    : heroDescriptionColor === 'cream-50' ? 'text-cream-50'
                    : 'text-mocha-400 dark:text-mocha-200'}
                `}
              >
                {heroDescription}
              </p>

              {/* Signature */}
              {signatureVisible && (
                <div
                  className={`
                    flex items-center gap-6
                    transition-all duration-700 delay-700
                    ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                >
                  <div className="relative">
                    <span className={`text-4xl lg:text-5xl tracking-wide ${
                      signatureFont === 'handwriting'
                        ? 'font-signature'
                        : signatureFont === 'santana'
                          ? 'font-santana'
                          : signatureFont === 'display'
                            ? 'font-display'
                            : 'font-sans'
                    } ${
                      signatureColor === 'gold'
                        ? 'text-gold'
                        : signatureColor === 'dark-900'
                          ? 'text-dark-900 dark:text-cream-50'
                          : 'text-mocha-900 dark:text-cream-50'
                    }`}>
                      {signature}
                    </span>
                    <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-gold via-gold/50 to-transparent" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-mocha-200 dark:from-mocha-800 to-transparent" />
                </div>
              )}
            </div>

            {/* Image with parallax */}
            <div
              className={`
                relative transition-all duration-1000 delay-300
                ${heroReveal.isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}
              `}
            >
              <div
                className="relative aspect-[4/5] rounded-3xl lg:rounded-[48px] overflow-hidden shadow-2xl shadow-mocha-900/20"
                style={{ transform: `translateY(${scrollY * -0.08}px)` }}
              >
                {/* Loading state */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-mocha-100 dark:bg-dark-800 animate-pulse flex items-center justify-center">
                    <div className="w-12 h-12 border-3 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Image */}
                <img
                  src={heroImage}
                  alt="Sertan Açıkgöz - Artisan Chocolatier"
                  className={`
                    w-full h-full object-cover transition-all duration-[2s]
                    ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                  `}
                  onLoad={() => setImageLoaded(true)}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-mocha-900/30 via-transparent to-transparent" />
              </div>

              {/* Floating badge */}
              <div
                className={`
                  absolute -bottom-8 -left-8 lg:-bottom-12 lg:-left-12
                  bg-gold text-cream-50 p-8 lg:p-10 rounded-3xl shadow-2xl shadow-gold/30
                  transition-all duration-700 delay-700
                  ${heroReveal.isVisible ? 'opacity-100 translate-y-0 rotate-0' : 'opacity-0 translate-y-8 -rotate-12'}
                `}
                style={{ transform: `translateY(${scrollY * 0.05}px)` }}
              >
                <span className="block text-4xl lg:text-5xl font-display font-bold tracking-tight">%100</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">Katkısız Üretim</span>
              </div>

              {/* Decorative frame corner */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-gold/30 rounded-tr-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PHILOSOPHY SECTION - Pull Quote Style
      ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={philosophyReveal.ref}
        className="relative py-32 lg:py-40"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-mocha-50/50 via-mocha-50/30 to-transparent dark:from-dark-800 dark:via-dark-800/50 dark:to-transparent" />

        {/* Decorative quote marks */}
        <div className="absolute top-20 left-8 lg:left-20 text-[200px] lg:text-[300px] font-display text-gold/10 leading-none select-none pointer-events-none">
          "
        </div>

        <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className={`
            max-w-4xl mx-auto text-center
            transition-all duration-1000
            ${philosophyReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
          `}>
            {/* Quote */}
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-mocha-900 dark:text-cream-50 mb-10 leading-tight tracking-tight">
              {philosophyTitle}
            </h2>

            {/* Description */}
            <p
              className={`
                text-lg text-mocha-400 dark:text-mocha-200 leading-relaxed mb-20 max-w-2xl mx-auto
                transition-all duration-700 delay-200
                ${philosophyReveal.isVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              {philosophyDescription}
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <AnimatedStat value={stat1Value} label={stat1Label} delay={0} />
              <AnimatedStat value={stat2Value} label={stat2Label} delay={100} />
              <AnimatedStat value={stat3Value} label={stat3Label} delay={200} />
              <AnimatedStat value={stat4Value} label={stat4Label} delay={300} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          EXPERIENCE & DELIVERY SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={deliveryReveal.ref}
        className="py-24 lg:py-32"
      >
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

            {/* Delivery Card */}
            <div className={`
              relative transition-all duration-1000
              ${deliveryReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}>
              <div className="relative bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-10 lg:p-14 rounded-3xl border border-gold/20 overflow-hidden">
                {/* Background icon */}
                <div className="absolute -top-8 -right-8 text-gold/10">
                  <Snowflake className="w-40 h-40" strokeWidth={1} />
                </div>

                <h3 className="relative font-display text-3xl lg:text-4xl text-mocha-900 dark:text-cream-50 mb-6 tracking-tight">
                  {deliveryTitle}
                </h3>

                <p className="relative text-mocha-400 dark:text-mocha-200 leading-relaxed mb-10">
                  {deliveryDescription}
                </p>

                {/* Feature badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-cream-50 dark:bg-dark-900 rounded-full text-sm text-mocha-900 dark:text-cream-50 border border-mocha-100 dark:border-mocha-800">
                    <Snowflake className="w-4 h-4 text-gold" />
                    Soğuk Zincir
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-cream-50 dark:bg-dark-900 rounded-full text-sm text-mocha-900 dark:text-cream-50 border border-mocha-100 dark:border-mocha-800">
                    <BadgeCheck className="w-4 h-4 text-gold" />
                    Sigortalı Kargo
                  </div>
                </div>
              </div>
            </div>

            {/* Experience List */}
            <div>
              <h3
                className={`
                  font-display text-4xl lg:text-5xl text-mocha-900 dark:text-cream-50 mb-12 tracking-tight
                  transition-all duration-700
                  ${deliveryReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
              >
                Artizan Bir Deneyim
              </h3>

              <div className="space-y-8">
                <ExperienceItem
                  number={1}
                  title={exp1Title}
                  description={exp1Desc}
                  icon={Leaf}
                  delay={100}
                />
                <ExperienceItem
                  number={2}
                  title={exp2Title}
                  description={exp2Desc}
                  icon={Droplets}
                  delay={200}
                />
                <ExperienceItem
                  number={3}
                  title={exp3Title}
                  description={exp3Desc}
                  icon={Clock}
                  delay={300}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LOCATIONS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        ref={locationsReveal.ref}
        className="py-24 lg:py-32 pb-32"
      >
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Section header */}
          <div className={`
            text-center mb-16 lg:mb-20
            transition-all duration-700
            ${locationsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}>
            <span className="inline-block text-gold text-[11px] font-semibold uppercase tracking-[0.4em] mb-4">
              Bizi Ziyaret Edin
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-mocha-900 dark:text-cream-50 tracking-tight">
              {locationsTitle}
            </h2>
          </div>

          {/* Store cards */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
            <StoreCard
              name={store1Name}
              address={store1Address}
              phone={store1Phone}
              mapLink={store1Map}
              index={0}
            />
            <StoreCard
              name={store2Name}
              address={store2Address}
              phone={store2Phone}
              mapLink={store2Map}
              index={1}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};
