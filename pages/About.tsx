import React from 'react';
import { HERO_IMAGE } from '../constants';
import { useLanguage } from '../context/LanguageContext';

const StoreCard: React.FC<{ name: string, address: string, phone: string, mapLink: string }> = ({ name, address, phone, mapLink }) => (
  <div className="bg-gray-50 dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-soft group hover:shadow-luxurious transition-all">
    <div className="w-12 h-12 bg-brown-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
      <span className="material-icons-outlined">place</span>
    </div>
    <h3 className="font-display text-2xl font-bold mb-4 dark:text-white">{name}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{address}</p>
    <div className="flex flex-col gap-3">
       <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-xs font-bold text-brown-900 dark:text-gold hover:opacity-80 transition-opacity">
         <span className="material-icons-outlined text-sm">phone</span> {phone}
       </a>
       <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-brown-900 dark:text-gold hover:opacity-80 transition-opacity uppercase tracking-widest">
         <span className="material-icons-outlined text-sm">map</span> Konumu Gör
       </a>
    </div>
  </div>
);

export const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <main className="pt-20 lg:pt-32 max-w-7xl mx-auto pb-32 bg-white dark:bg-dark-900 min-h-screen px-5 lg:px-8">
      <div className="animate-fade-in">
        
        {/* Intro */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 mb-32 items-center">
          <div>
            <span className="font-sans text-xs font-bold tracking-[0.4em] text-gold uppercase mb-4 block">Hakkımızda</span>
            <h1 className="font-display text-5xl lg:text-7xl text-gray-900 dark:text-white mb-8 leading-tight italic">
               Hile Yok,<br/>Kalite Var.
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-sans mb-10 max-w-xl">
              Sertan Açıkgöz'ün butik pastanecilik vizyonuyla 2016'dan bu yana Antalya'da şekillenen Sade Patisserie, çikolatanın en saf halini size ulaştırıyor. 
            </p>
            <div className="flex gap-4">
               <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 mt-4"></div>
               <div className="font-handwriting text-3xl text-brown-900 dark:text-white">Sertan Açıkgöz</div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl border-8 border-white dark:border-dark-800">
              <img src={HERO_IMAGE} alt="Sertan Açıkgöz Artisan" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-gold text-white p-8 rounded-[40px] shadow-2xl hidden lg:block animate-bounce-slow">
               <span className="block text-4xl font-display font-bold">%100</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">Katkısız Üretim</span>
            </div>
          </div>
        </div>

        {/* Philosophy */}
        <div className="bg-gray-50 dark:bg-dark-800 rounded-[60px] p-12 lg:p-24 mb-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-10 dark:text-white italic">"Çikolata, Damağınızda Biten Değil, Kalbinizde Başlayan Bir Hikayedir."</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-loose mb-12">
               Sade Chocolate olarak inancımız basit: Minimalizm, lezzetin en saf halidir. Endüstriyel işlemlerden, gereksiz katkı maddelerinden ve yapay boyalardan uzak duruyoruz. Sadece özenle seçilmiş tek kaynaklı kakao çekirdekleri ve ustalığımızı kullanıyoruz.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div><span className="block text-4xl font-display text-brown-900 dark:text-gold mb-2">2016</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Kuruluş</span></div>
              <div><span className="block text-4xl font-display text-brown-900 dark:text-gold mb-2">%100</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">El Yapımı</span></div>
              <div><span className="block text-4xl font-display text-brown-900 dark:text-gold mb-2">0</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Katkı Maddesi</span></div>
              <div><span className="block text-4xl font-display text-brown-900 dark:text-gold mb-2">Antalya</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ana Merkez</span></div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div>
          <h2 className="font-display text-4xl font-bold text-center mb-16 dark:text-white italic">Atölyelerimiz ve Şubelerimiz</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <StoreCard 
               name="Yeşilbahçe Şubesi" 
               address="Yeşilbahçe Mah. Çınarlı Cad. No:47/A Muratpaşa, Antalya" 
               phone="0552 896 30 26" 
               mapLink="https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Yeşilbahçe"
            />
            <StoreCard 
               name="Çağlayan Şubesi" 
               address="Çağlayan Mah. 2050 Sokak No:19 Muratpaşa, Antalya" 
               phone="0552 896 30 26" 
               mapLink="https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Çağlayan"
            />
          </div>
        </div>

      </div>
    </main>
  );
};