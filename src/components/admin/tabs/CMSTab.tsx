import React, { useState, useEffect } from 'react';
import { Globe, X, Maximize2 } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';
import { ImageUpload } from '../ImageUpload';
import { AdminCard } from '../shared/AdminCard';

type CMSTabProps = {
  onSave: () => void;
};

export const CMSTab: React.FC<CMSTabProps> = ({ onSave }) => {
  const [cmsPage, setCmsPage] = useState<'home' | 'about' | 'story' | 'legal'>('home');
  const [cmsData, setCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [aboutCmsData, setAboutCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [storyCmsData, setStoryCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [legalCmsData, setLegalCmsData] = useState<any>({ tr: {}, en: {}, ru: {} });
  const [legalEditModal, setLegalEditModal] = useState<{ isOpen: boolean; lang: string; field: string; label: string; color: string } | null>(null);

  useEffect(() => {
    const unsubs = [
      onSnapshot(doc(db, 'site_content', 'home'), (d) => { if (d.exists()) setCmsData(d.data()); }),
      onSnapshot(doc(db, 'site_content', 'about'), (d) => { if (d.exists()) setAboutCmsData(d.data()); }),
      onSnapshot(doc(db, 'cms', 'story'), (d) => { if (d.exists()) setStoryCmsData(d.data()); }),
      onSnapshot(doc(db, 'site_content', 'legal'), (d) => { if (d.exists()) setLegalCmsData(d.data()); }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleCmsSave = async () => {
    try {
      if (cmsPage === 'home') await setDoc(doc(db, 'site_content', 'home'), cmsData, { merge: true });
      else if (cmsPage === 'about') await setDoc(doc(db, 'site_content', 'about'), aboutCmsData, { merge: true });
      else if (cmsPage === 'story') await setDoc(doc(db, 'cms', 'story'), storyCmsData, { merge: true });
      else if (cmsPage === 'legal') await setDoc(doc(db, 'site_content', 'legal'), legalCmsData, { merge: true });
      toast.success('Yayına alındı');
    } catch {
      toast.error('Kaydedilemedi');
    }
  };

  const langLabel = (lang: string) => lang === 'tr' ? 'Türkçe (TR)' : lang === 'en' ? 'English (EN)' : 'Russian (RU)';
  const langColor = (lang: string) => lang === 'tr' ? 'bg-red-50 text-red-600' : lang === 'en' ? 'bg-brand-blue/10 text-blue-700' : 'bg-purple-50 text-purple-700';

  const pages = [
    { id: 'home' as const, label: 'Ana Sayfa' },
    { id: 'about' as const, label: 'Hakkımızda' },
    { id: 'story' as const, label: 'Hikaye' },
    { id: 'legal' as const, label: 'Yasal Metinler' },
  ];

  const inputClass = "w-full bg-cream-50 border border-cream-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-mustard/20 outline-none text-mocha-900";

  return (
    <div className="space-y-4">
      {/* Page Selector & Save */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => setCmsPage(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                cmsPage === p.id ? 'bg-mocha-900 text-white' : 'bg-white border border-cream-200 text-mocha-600 hover:bg-cream-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={handleCmsSave} className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors">Kaydet</button>
      </div>

      {/* Home CMS */}
      {cmsPage === 'home' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['tr', 'en', 'ru'].map((lang) => (
            <AdminCard key={lang}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${langColor(lang)}`}><Globe size={16} /></div>
                <span className="text-sm font-semibold text-mocha-900">{langLabel(lang)}</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ImageUpload value={cmsData?.[lang]?.hero_image_desktop || ''} onChange={(url) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_image_desktop: url } })} onFocalPointChange={(point) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_focal_point_desktop: point } })} focalPoint={cmsData?.[lang]?.hero_focal_point_desktop || { x: 50, y: 50 }} label="Hero (Desktop)" folder="hero-images/desktop" showFocalPoint={true} />
                  <ImageUpload value={cmsData?.[lang]?.hero_image_mobile || ''} onChange={(url) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_image_mobile: url } })} onFocalPointChange={(point) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_focal_point_mobile: point } })} focalPoint={cmsData?.[lang]?.hero_focal_point_mobile || { x: 50, y: 50 }} label="Hero (Mobil)" folder="hero-images/mobile" showFocalPoint={true} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Hero Başlık</label>
                  <textarea value={cmsData?.[lang]?.hero_title || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_title: e.target.value } })} className={inputClass} rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Hero Alt Başlık</label>
                  <input type="text" value={cmsData?.[lang]?.hero_subtitle || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], hero_subtitle: e.target.value } })} className={inputClass} />
                </div>
                <div className="pt-3 border-t border-cream-200">
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">"Sade'nin Sırrı" Başlığı</label>
                  <input type="text" value={cmsData?.[lang]?.secret_title || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], secret_title: e.target.value } })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">"Sade'nin Sırrı" Alıntı</label>
                  <textarea value={cmsData?.[lang]?.secret_quote || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], secret_quote: e.target.value } })} className={inputClass} rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">"Sade'nin Sırrı" Açıklama</label>
                  <textarea value={cmsData?.[lang]?.secret_desc || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], secret_desc: e.target.value } })} className={inputClass} rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">İmza</label>
                  <input value={cmsData?.[lang]?.signature || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], signature: e.target.value } })} className={inputClass} placeholder="Örn: Sertan Açıkgöz" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-mocha-400 mb-1">Font</label>
                      <select value={cmsData?.[lang]?.signature_font || 'handwriting'} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], signature_font: e.target.value } })} className="w-full bg-cream-50 border border-cream-200 rounded-lg p-2 text-xs outline-none">
                        <option value="handwriting">El Yazısı</option>
                        <option value="santana">Santana</option>
                        <option value="display">Display</option>
                        <option value="sans">Sans Serif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-mocha-400 mb-1">Renk</label>
                      <select value={cmsData?.[lang]?.signature_color || 'gold'} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], signature_color: e.target.value } })} className="w-full bg-cream-50 border border-cream-200 rounded-lg p-2 text-xs outline-none">
                        <option value="gold">Altın</option>
                        <option value="mocha-900">Kahve</option>
                        <option value="dark-900">Koyu</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Katalog Hızlı Etiketleri</label>
                  <input type="text" placeholder="Örn: Yoğun Bitter, İpeksi Beyaz" value={cmsData?.[lang]?.featured_tags || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], featured_tags: e.target.value } })} className={inputClass} />
                </div>
                <div className="pt-3 border-t border-cream-200">
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Üst Duyuru Barı</label>
                  <input type="text" placeholder="Örn: 1500 TL Üzeri Ücretsiz Kargo" value={cmsData?.[lang]?.top_bar_message || ''} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_message: e.target.value } })} className={inputClass} />
                  <p className="mt-1 text-xs text-mocha-400">Boş bırakılırsa duyuru barı gizlenir</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-mocha-400 mb-1">Arka Plan</label>
                      <div className="flex gap-1 items-center bg-cream-50 p-1.5 rounded-lg border border-cream-200">
                        <input type="color" value={cmsData?.[lang]?.top_bar_bg || '#E5E1D1'} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_bg: e.target.value } })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
                        <input type="text" value={cmsData?.[lang]?.top_bar_bg || '#E5E1D1'} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_bg: e.target.value } })} className="flex-1 bg-transparent text-xs font-mono outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-mocha-400 mb-1">Yazı Rengi</label>
                      <div className="flex gap-1 items-center bg-cream-50 p-1.5 rounded-lg border border-cream-200">
                        <input type="color" value={cmsData?.[lang]?.top_bar_text || '#4B3832'} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_text: e.target.value } })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
                        <input type="text" value={cmsData?.[lang]?.top_bar_text || '#4B3832'} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_text: e.target.value } })} className="flex-1 bg-transparent text-xs font-mono outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-mocha-400 mb-1">Yükseklik</label>
                      <input type="number" min="30" max="60" value={cmsData?.[lang]?.top_bar_height || 36} onChange={(e) => setCmsData({ ...cmsData, [lang]: { ...cmsData[lang], top_bar_height: parseInt(e.target.value) || 36 } })} className="w-full bg-cream-50 border border-cream-200 rounded-lg p-1.5 text-xs outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* About CMS */}
      {cmsPage === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['tr', 'en', 'ru'].map((lang) => (
            <AdminCard key={lang}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${langColor(lang)}`}><Globe size={16} /></div>
                <span className="text-sm font-semibold text-mocha-900">{langLabel(lang)}</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Hakkımızda Başlık</label>
                  <input type="text" value={aboutCmsData?.[lang]?.title || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], title: e.target.value } })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Hakkımızda İçerik</label>
                  <textarea value={aboutCmsData?.[lang]?.content || ''} onChange={(e) => setAboutCmsData({ ...aboutCmsData, [lang]: { ...aboutCmsData[lang], content: e.target.value } })} className={inputClass} rows={6} />
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Story CMS */}
      {cmsPage === 'story' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['tr', 'en', 'ru'].map((lang) => (
            <AdminCard key={lang}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${langColor(lang)}`}><Globe size={16} /></div>
                <span className="text-sm font-semibold text-mocha-900">{langLabel(lang)}</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">Hikaye Başlığı</label>
                  <input type="text" value={storyCmsData?.[lang]?.title || ''} onChange={(e) => setStoryCmsData({ ...storyCmsData, [lang]: { ...(storyCmsData?.[lang] || {}), title: e.target.value } })} className={inputClass} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-mocha-400">Bölümler</label>
                  <button onClick={() => { const current = storyCmsData?.[lang]?.sections || []; setStoryCmsData({ ...storyCmsData, [lang]: { ...(storyCmsData?.[lang] || {}), sections: [...current, { title: '', content: '', image: '' }] } }); }} className="text-xs text-brand-mustard hover:text-brand-mustard/80 font-medium">+ Yeni Bölüm</button>
                </div>
                {(storyCmsData?.[lang]?.sections || []).map((section: any, index: number) => (
                  <div key={index} className="bg-cream-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-mocha-500">Bölüm {index + 1}</span>
                      <button onClick={() => { const s = [...(storyCmsData?.[lang]?.sections || [])]; s.splice(index, 1); setStoryCmsData({ ...storyCmsData, [lang]: { ...(storyCmsData?.[lang] || {}), sections: s } }); }} className="text-mocha-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                    <input value={section.title || ''} onChange={(e) => { const s = [...(storyCmsData?.[lang]?.sections || [])]; s[index] = { ...s[index], title: e.target.value }; setStoryCmsData({ ...storyCmsData, [lang]: { ...(storyCmsData?.[lang] || {}), sections: s } }); }} className={inputClass} placeholder="Bölüm Başlığı" />
                    <ImageUpload value={section.image || ''} onChange={(url) => { const s = [...(storyCmsData?.[lang]?.sections || [])]; s[index] = { ...s[index], image: url }; setStoryCmsData({ ...storyCmsData, [lang]: { ...(storyCmsData?.[lang] || {}), sections: s } }); }} label="Bölüm Görseli" folder="story-images" />
                    <textarea value={section.content || ''} onChange={(e) => { const s = [...(storyCmsData?.[lang]?.sections || [])]; s[index] = { ...s[index], content: e.target.value }; setStoryCmsData({ ...storyCmsData, [lang]: { ...(storyCmsData?.[lang] || {}), sections: s } }); }} className={inputClass} rows={4} placeholder="Bölüm içeriği..." />
                  </div>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Legal CMS */}
      {cmsPage === 'legal' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['tr', 'en', 'ru'].map((lang) => {
              const legalFields = [
                { field: 'privacy_content', label: 'Gizlilik Politikası' },
                { field: 'shipping_content', label: 'Teslimat Koşulları' },
                { field: 'preinfo_content', label: 'Ön Bilgilendirme' },
                { field: 'distance_sales_content', label: 'Mesafeli Satış Sözleşmesi' },
                { field: 'kvkk_content', label: 'KVKK' },
                { field: 'refund_content', label: 'İptal & İade' },
              ];
              return (
                <AdminCard key={lang}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${langColor(lang)}`}><Globe size={16} /></div>
                    <span className="text-sm font-semibold text-mocha-900">{langLabel(lang)}</span>
                  </div>
                  <div className="space-y-4">
                    {legalFields.map(({ field, label }) => (
                      <div key={field} className="pt-3 border-t border-cream-200 first:pt-0 first:border-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-mocha-600">{label}</label>
                          <button onClick={() => setLegalEditModal({ isOpen: true, lang, field, label, color: 'blue' })} className="text-xs text-brand-mustard hover:text-brand-mustard/80 font-medium flex items-center gap-1"><Maximize2 size={10} /> Genişlet</button>
                        </div>
                        <textarea value={legalCmsData?.[lang]?.[field] || ''} onChange={(e) => setLegalCmsData({ ...legalCmsData, [lang]: { ...legalCmsData[lang], [field]: e.target.value } })} className={inputClass + ' font-mono'} rows={4} />
                      </div>
                    ))}
                  </div>
                </AdminCard>
              );
            })}
          </div>

          {/* Legal Edit Modal */}
          {legalEditModal?.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setLegalEditModal(null)} />
              <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
                  <div>
                    <h2 className="text-base font-semibold text-mocha-900">{legalEditModal.label}</h2>
                    <span className="text-xs text-mocha-400">{langLabel(legalEditModal.lang)}</span>
                  </div>
                  <button onClick={() => setLegalEditModal(null)} className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors"><X size={18} className="text-mocha-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <textarea value={legalCmsData?.[legalEditModal.lang]?.[legalEditModal.field] || ''} onChange={(e) => setLegalCmsData({ ...legalCmsData, [legalEditModal.lang]: { ...legalCmsData[legalEditModal.lang], [legalEditModal.field]: e.target.value } })} className="w-full h-[60vh] bg-cream-50 border border-cream-200 rounded-lg p-4 text-sm outline-none text-mocha-900 font-mono resize-none focus:ring-2 focus:ring-brand-mustard/20" autoFocus />
                </div>
                <div className="flex items-center justify-between px-6 py-3 border-t border-cream-200 bg-cream-50">
                  <p className="text-xs text-mocha-400">{(legalCmsData?.[legalEditModal.lang]?.[legalEditModal.field] || '').length} karakter</p>
                  <button onClick={() => setLegalEditModal(null)} className="px-4 py-2 bg-brand-mustard text-white rounded-lg text-sm font-medium hover:bg-brand-mustard/90 transition-colors">Tamam</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
