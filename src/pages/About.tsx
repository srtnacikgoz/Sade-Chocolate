import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Footer } from '../components/Footer';

const StoreCard: React.FC<{ name: string, address: string, phone: string, mapLink: string }> = ({ name, address, phone, mapLink }) => (
  <div className="bg-gray-50 dark:bg-dark-800 p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:shadow-luxurious transition-all duration-500 hover:-translate-y-2">
    <div className="w-16 h-16 bg-brown-900 text-white rounded-[20px] flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform group-hover:rotate-6">
      <span className="material-icons-outlined text-3xl">place</span>
    </div>
    <h3 className="font-display text-3xl font-bold mb-4 dark:text-white italic tracking-tighter leading-tight">{name}</h3>
    <div className="space-y-2 mb-10">
      <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">{address}</p>
      <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">Muratpaşa, Antalya</p>
    </div>
    <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
       <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm font-bold text-brown-900 dark:text-gold hover:opacity-70 transition-opacity">
         <span className="material-icons-outlined text-lg">phone</span> {phone}
       </a>
       <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[11px] font-bold text-brown-900 dark:text-gold hover:opacity-70 transition-opacity uppercase tracking-[0.3em]">
         <span className="material-icons-outlined text-lg">map</span> Haritada Gör
       </a>
    </div>
  </div>
);

export const About: React.FC = () => {
  const { t, language } = useLanguage();
  const [aboutData, setAboutData] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Firebase'den About CMS verisini çek
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'about'), (doc) => {
      if (doc.exists()) {
        setAboutData(doc.data());
        // Yeni veri geldiğinde görseli tekrar yükle
        setImageLoaded(false);
      }
    });
    return () => unsub();
  }, []);

  // Dinamik veriler - Firebase'den veya default değerler
  const heroLabel = aboutData?.[language]?.hero_label || 'Hikayemiz';
  const heroTitle = aboutData?.[language]?.hero_title || 'Hile Yok,\nKalite Var.';
  const heroDescription = aboutData?.[language]?.hero_description || 'Sertan Açıkgöz\'ün butik pastanecilik vizyonuyla 2016\'dan bu yana Antalya\'da şekillenen Sade Patisserie, çikolatanın en saf halini modern bir sanat dalı olarak sunuyor.';
  const heroImage = aboutData?.[language]?.hero_image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPsg3jC391kW1kEstLZOiXYJ4jKeH3Ert6-SapPNTbe7UBTW72yhpEVQxRGouZVEwRX-i7uX-GpwZ9neF6MrhK2LhPe6QLacGfceRfOdJ_K37BAQLTzLKt_h8sx6qhFiqVyw5uaRjTbWGfD6oCOVh_xQvZflmUXHakFaeSX4YdxsGfUBIP8_OuhOi-G3sU22UrQfU6LFC8NSCm6Mw9eemRL8gBfnlKax26WRn4jZX4-iYvm7G3kRAGdqFhRT98yXL0F2g2l_aL3cs';
  const signature = aboutData?.[language]?.signature || 'Sertan Açıkgöz';

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

  const store1Name = aboutData?.store1_name || 'Yeşilbahçe Şubesi';
  const store1Address = aboutData?.store1_address || 'Yeşilbahçe Mah. Çınarlı Cad. No:47/A';
  const store1Phone = aboutData?.store1_phone || '0552 896 30 26';
  const store1Map = aboutData?.store1_map || 'https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Yeşilbahçe';

  const store2Name = aboutData?.store2_name || 'Çağlayan Şubesi';
  const store2Address = aboutData?.store2_address || 'Çağlayan Mah. 2050 Sokak No:19';
  const store2Phone = aboutData?.store2_phone || '0552 896 30 26';
  const store2Map = aboutData?.store2_map || 'https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Çağlayan';

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-32 pb-24 px-4 sm:px-6 lg:px-12 bg-cream-100 dark:bg-dark-900 min-h-screen">
      <div className="animate-fade-in">
        
        {/* Intro Section - Premium Layout */}
        <section className="grid lg:grid-cols-2 gap-16 lg:gap-32 mb-40 items-center">
          <div>
            <span className="font-sans text-xs font-bold tracking-[0.5em] text-gold uppercase mb-6 block">{heroLabel}</span>
            <h1 className="font-display text-6xl lg:text-8xl text-gray-900 dark:text-white mb-10 leading-[0.9] italic tracking-tighter">
               {heroTitle.split('\n').map((line, i) => (
                 <React.Fragment key={i}>{line}{i < heroTitle.split('\n').length - 1 && <br />}</React.Fragment>
               ))}
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-sans mb-12 max-w-xl">
              {heroDescription}
            </p>
            <div className="flex items-center gap-6">
               <div className="font-handwriting text-5xl text-brown-900 dark:text-white">{signature}</div>
               <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
            </div>
          </div>
          <div className="relative group">
            <div className="aspect-[4/5] rounded-[80px] overflow-hidden shadow-luxurious border-[12px] border-white dark:border-dark-800 transition-all duration-700 bg-gray-100 dark:bg-dark-800">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-100 dark:bg-dark-800 animate-pulse flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={heroImage}
                alt="Sertan Açıkgöz Artisan"
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-[3s] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            <div className="absolute -bottom-12 -left-12 bg-gold text-white p-10 rounded-[50px] shadow-2xl hidden lg:block animate-bounce-slow border-8 border-white dark:border-dark-900">
               <span className="block text-5xl font-display font-bold">%100</span>
               <span className="text-xs font-bold uppercase tracking-[0.3em]">Katkısız Üretim</span>
            </div>
          </div>
        </section>

        {/* Philosophy - Centered Text */}
        <section className="bg-gray-50 dark:bg-dark-800 rounded-[80px] p-12 lg:p-32 mb-40 relative overflow-hidden shadow-soft">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-display text-4xl lg:text-6xl font-bold mb-12 dark:text-white italic tracking-tighter leading-tight">{philosophyTitle}</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 leading-loose mb-16 opacity-90">
               {philosophyDescription}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              <div className="space-y-2">
                <span className="block text-5xl font-display text-brown-900 dark:text-gold italic">{stat1Value}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">{stat1Label}</span>
              </div>
              <div className="space-y-2">
                <span className="block text-5xl font-display text-brown-900 dark:text-gold italic">{stat2Value}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">{stat2Label}</span>
              </div>
              <div className="space-y-2">
                <span className="block text-5xl font-display text-brown-900 dark:text-gold italic">{stat3Value}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">{stat3Label}</span>
              </div>
              <div className="space-y-2">
                <span className="block text-5xl font-display text-brown-900 dark:text-gold italic">{stat4Value}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">{stat4Label}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Shipping & Delivery Highlights */}
        <section className="mb-40 grid lg:grid-cols-2 gap-16 items-center">
            <div className="bg-gold/5 p-12 lg:p-20 rounded-[60px] border border-gold/10 relative overflow-hidden">
                <span className="material-icons-outlined text-7xl text-gold/20 absolute -top-4 -right-4">local_shipping</span>
                <h3 className="font-display text-4xl mb-8 text-brown-900 dark:text-gold italic tracking-tighter leading-tight">{deliveryTitle}</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                    {deliveryDescription}
                </p>
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-dark-900 rounded-full flex items-center justify-center shadow-sm text-gold">
                        <span className="material-icons-outlined">ac_unit</span>
                    </div>
                    <div className="w-12 h-12 bg-white dark:bg-dark-900 rounded-full flex items-center justify-center shadow-sm text-gold">
                        <span className="material-icons-outlined">verified</span>
                    </div>
                </div>
            </div>
            <div className="space-y-10">
                <h4 className="font-display text-5xl font-bold dark:text-white italic tracking-tighter">Artizan Bir Deneyim</h4>
                <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-8 h-8 rounded-full bg-brown-900 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-sm">1</div>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed"><strong className="text-gray-900 dark:text-white">{exp1Title}:</strong> {exp1Desc}</p>
                    </div>
                    <div className="flex gap-6 items-start">
                        <div className="w-8 h-8 rounded-full bg-brown-900 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-sm">2</div>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed"><strong className="text-gray-900 dark:text-white">{exp2Title}:</strong> {exp2Desc}</p>
                    </div>
                    <div className="flex gap-6 items-start">
                        <div className="w-8 h-8 rounded-full bg-brown-900 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-sm">3</div>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed"><strong className="text-gray-900 dark:text-white">{exp3Title}:</strong> {exp3Desc}</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Locations Section */}
        <section>
          <div className="text-center mb-20">
             <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block">Bizi Ziyaret Edin</span>
             <h2 className="font-display text-5xl lg:text-7xl font-bold dark:text-white italic tracking-tighter">{locationsTitle}</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-10">
            <StoreCard
               name={store1Name}
               address={store1Address}
               phone={store1Phone}
               mapLink={store1Map}
            />
            <StoreCard
               name={store2Name}
               address={store2Address}
               phone={store2Phone}
               mapLink={store2Map}
            />
          </div>
        </section>

      </div>

      <Footer />
    </main>
  );
};