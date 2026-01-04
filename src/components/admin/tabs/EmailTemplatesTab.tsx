import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';
import { Mail, Save, Eye, RefreshCw } from 'lucide-react';
import type { NewsletterTemplate } from '../../../types';

// Varsayılan template değerleri
const DEFAULT_TEMPLATE: NewsletterTemplate = {
  id: 'newsletter_welcome',
  headerBadge: '✦ Hoş Geldin ✦',
  mainTitle: 'Artisan Çikolata\nDünyasına Adım Attın',
  welcomeText: 'Bundan sonra yeni koleksiyonlar, özel teklifler ve bean-to-bar dünyasından hikayeler seninle.',
  discountEnabled: true,
  discountLabel: 'İlk Siparişine Özel',
  discountPercent: 10,
  discountCode: 'HOSGELDIN10',
  benefit1Title: 'Koleksiyonlar',
  benefit1Text: 'Tek menşei kakao çekirdeklerinden üretilen sezonluk ve limitli seriler',
  benefit2Title: 'Ayrıcalıklar',
  benefit2Text: 'Abonelere özel erken erişim, indirimler ve sürpriz hediyeler',
  ctaText: 'Koleksiyonu Keşfet',
  ctaUrl: 'https://sadechocolate.com/#/catalog',
  emailSubject: 'Hoş Geldin — İlk Siparişine %10 İndirim',
  colors: {
    headerBg: '#4B3832',
    bodyBg: '#FDFCF8',
    outerBg: '#E8E4DC',
    accent: '#C5A059',
    textPrimary: '#4B3832',
    textSecondary: '#666666'
  }
};

export const EmailTemplatesTab: React.FC = () => {
  const [template, setTemplate] = useState<NewsletterTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Firestore'dan template'i yükle
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const docRef = doc(db, 'email_templates', 'newsletter_welcome');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTemplate({ ...DEFAULT_TEMPLATE, ...docSnap.data() } as NewsletterTemplate);
        } else {
          // İlk kez - varsayılan değerleri kaydet
          await setDoc(docRef, { ...DEFAULT_TEMPLATE, updatedAt: serverTimestamp() });
        }
      } catch (error) {
        console.error('Template yüklenemedi:', error);
        toast.error('Template yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, []);

  // Template'i kaydet
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'email_templates', 'newsletter_welcome'), {
        ...template,
        updatedAt: serverTimestamp()
      });
      toast.success('Email şablonu kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  // Varsayılana sıfırla
  const handleReset = () => {
    if (confirm('Şablonu varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      setTemplate(DEFAULT_TEMPLATE);
      toast.info('Varsayılan değerler yüklendi. Kaydetmeyi unutmayın.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-3 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-brown-900 to-brown-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Mail className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white italic">
              Newsletter Hoş Geldin Emaili
            </h2>
            <p className="text-sm text-gray-500">Yeni abonelere gönderilen email şablonunu düzenleyin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Sıfırla
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-2"
          >
            <Eye size={16} />
            {showPreview ? 'Düzenle' : 'Önizle'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-brown-900 hover:bg-brown-800 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="bg-gray-100 rounded-3xl p-8 overflow-auto max-h-[70vh]">
          <div className="max-w-[600px] mx-auto shadow-2xl" dangerouslySetInnerHTML={{ __html: generatePreviewHTML(template) }} />
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol Kolon - İçerik */}
          <div className="space-y-6">
            {/* Email Subject */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Mail size={16} className="text-gold" />
                Email Konusu
              </h3>
              <input
                type="text"
                value={template.emailSubject}
                onChange={(e) => setTemplate({ ...template, emailSubject: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="Email konusu..."
              />
            </div>

            {/* Header Section */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Başlık Alanı</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Badge Metni</label>
                  <input
                    type="text"
                    value={template.headerBadge}
                    onChange={(e) => setTemplate({ ...template, headerBadge: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                    placeholder="✦ Hoş Geldin ✦"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ana Başlık (satır için \n kullanın)</label>
                  <textarea
                    value={template.mainTitle}
                    onChange={(e) => setTemplate({ ...template, mainTitle: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none resize-none"
                    rows={2}
                    placeholder="Artisan Çikolata\nDünyasına Adım Attın"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hoş Geldin Metni</label>
                  <textarea
                    value={template.welcomeText}
                    onChange={(e) => setTemplate({ ...template, welcomeText: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">İndirim Bölümü</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.discountEnabled}
                    onChange={(e) => setTemplate({ ...template, discountEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                  />
                  <span className="text-xs text-gray-500">Aktif</span>
                </label>
              </div>
              {template.discountEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Üst Etiket</label>
                      <input
                        type="text"
                        value={template.discountLabel}
                        onChange={(e) => setTemplate({ ...template, discountLabel: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">İndirim %</label>
                      <input
                        type="number"
                        value={template.discountPercent}
                        onChange={(e) => setTemplate({ ...template, discountPercent: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">İndirim Kodu</label>
                    <input
                      type="text"
                      value={template.discountCode}
                      onChange={(e) => setTemplate({ ...template, discountCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none font-mono tracking-wider"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kolon - Benefits & CTA */}
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Avantajlar (2 Sütun)</h3>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
                  <label className="text-xs text-gold mb-2 block font-bold">Sol Sütun</label>
                  <input
                    type="text"
                    value={template.benefit1Title}
                    onChange={(e) => setTemplate({ ...template, benefit1Title: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none mb-2"
                    placeholder="Başlık"
                  />
                  <textarea
                    value={template.benefit1Text}
                    onChange={(e) => setTemplate({ ...template, benefit1Text: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none resize-none"
                    rows={2}
                    placeholder="Açıklama"
                  />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
                  <label className="text-xs text-gold mb-2 block font-bold">Sağ Sütun</label>
                  <input
                    type="text"
                    value={template.benefit2Title}
                    onChange={(e) => setTemplate({ ...template, benefit2Title: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none mb-2"
                    placeholder="Başlık"
                  />
                  <textarea
                    value={template.benefit2Text}
                    onChange={(e) => setTemplate({ ...template, benefit2Text: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none resize-none"
                    rows={2}
                    placeholder="Açıklama"
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Aksiyon Butonu</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Buton Metni</label>
                  <input
                    type="text"
                    value={template.ctaText}
                    onChange={(e) => setTemplate({ ...template, ctaText: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Buton URL</label>
                  <input
                    type="url"
                    value={template.ctaUrl}
                    onChange={(e) => setTemplate({ ...template, ctaUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Color Settings (Collapsible) */}
            <details className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <summary className="p-6 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                Renk Ayarları (Gelişmiş)
              </summary>
              <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                {template.colors && Object.entries(template.colors).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setTemplate({
                          ...template,
                          colors: { ...template.colors!, [key]: e.target.value }
                        })}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setTemplate({
                          ...template,
                          colors: { ...template.colors!, [key]: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

// Preview HTML generator
function generatePreviewHTML(t: NewsletterTemplate): string {
  const c = t.colors || DEFAULT_TEMPLATE.colors!;
  const mainTitleHTML = t.mainTitle.replace(/\n/g, '<br>');

  return `
    <div style="background-color: ${c.outerBg}; padding: 40px 20px; font-family: Georgia, serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: ${c.bodyBg}; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background-color: ${c.headerBg}; padding: 40px 48px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 6px; color: ${c.bodyBg};">SADE</h1>
            <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 4px; color: ${c.accent}; text-transform: uppercase;">Chocolate</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 60px 48px;">
            <p style="text-align: center; margin: 0 0 16px; font-size: 10px; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase;">${t.headerBadge}</p>
            <h2 style="text-align: center; margin: 0 0 32px; font-size: 32px; font-weight: normal; font-style: italic; color: ${c.textPrimary}; line-height: 1.3;">${mainTitleHTML}</h2>
            <div style="width: 60px; height: 1px; background-color: ${c.accent}; margin: 0 auto 32px;"></div>
            <p style="text-align: center; margin: 0 0 48px; font-size: 15px; line-height: 1.8; color: ${c.textSecondary};">${t.welcomeText}</p>
            ${t.discountEnabled ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.headerBg}; margin-bottom: 48px;">
              <tr>
                <td style="padding: 40px 32px; text-align: center;">
                  <p style="margin: 0 0 8px; font-size: 10px; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase;">${t.discountLabel}</p>
                  <p style="margin: 0 0 4px; font-size: 64px; font-weight: normal; color: ${c.bodyBg}; line-height: 1;">%${t.discountPercent}</p>
                  <p style="margin: 0 0 24px; font-size: 16px; font-style: italic; color: ${c.accent};">indirim</p>
                  <div style="display: inline-block; border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px;">
                    <p style="margin: 0 0 4px; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Kod</p>
                    <p style="margin: 0; font-family: monospace; font-size: 20px; letter-spacing: 4px; color: ${c.bodyBg}; font-weight: bold;">${t.discountCode}</p>
                  </div>
                </td>
              </tr>
            </table>
            ` : ''}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 48px;">
              <tr>
                <td width="48%" valign="top">
                  <p style="margin: 0 0 8px; font-size: 9px; letter-spacing: 2px; color: ${c.accent}; text-transform: uppercase;">${t.benefit1Title}</p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${c.textSecondary};">${t.benefit1Text}</p>
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top">
                  <p style="margin: 0 0 8px; font-size: 9px; letter-spacing: 2px; color: ${c.accent}; text-transform: uppercase;">${t.benefit2Title}</p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${c.textSecondary};">${t.benefit2Text}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${t.ctaUrl}" style="display: inline-block; background-color: ${c.headerBg}; color: ${c.bodyBg}; padding: 16px 48px; text-decoration: none; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">${t.ctaText}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #F5F3EF; padding: 32px 48px; text-align: center; border-top: 1px solid ${c.outerBg};">
            <p style="margin: 0 0 16px; font-size: 14px; color: ${c.textPrimary};">Sade Chocolate</p>
            <p style="margin: 0; font-size: 11px; color: #999999;">Yeşilbahçe Mah. Çınarlı Cd. 47/A, Muratpaşa, Antalya</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export default EmailTemplatesTab;
