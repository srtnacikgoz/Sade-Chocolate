import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';
import { Mail, Save, Eye, RefreshCw, X, ExternalLink } from 'lucide-react';
import type { NewsletterTemplate, EmailFont } from '../../../types';
import { DEFAULT_EMAIL_FONTS } from '../../../utils/seedEmailFonts';
import { getEmailPreviewHtml } from '../../../services/emailPreviewService';

// Hex renk -> SVG color overlay filter (daha iyi sonuç verir)
function getLogoColorStyle(hex: string): string {
  // Basit filter: sadece rengi değiştir, şekli koruyun
  // opacity ile renk yoğunluğunu ayarla
  return `
    filter:
      drop-shadow(0 0 0 ${hex})
      brightness(0)
      invert(1)
      sepia(1)
      saturate(10000%)
      hue-rotate(0deg);
    -webkit-filter:
      drop-shadow(0 0 0 ${hex})
      brightness(0)
      invert(1)
      sepia(1)
      saturate(10000%)
      hue-rotate(0deg);
  `.trim();
}

// Alternatif: SVG mask kullanarak renklendirme
function getLogoWithColor(hex: string): string {
  return `background-color: ${hex}; -webkit-mask: url(https://sadechocolate.com/kakaologo.png) center/contain no-repeat; mask: url(https://sadechocolate.com/kakaologo.png) center/contain no-repeat;`;
}

// Varsayılan template değerleri
const DEFAULT_TEMPLATE: NewsletterTemplate = {
  id: 'newsletter_welcome',
  // Logo
  logoImageUrl: 'https://sadechocolate.com/kakaologo.png',
  logoShowImage: true,
  logoImageSize: 60,
  logoColor: '#C5A059',
  logoSadeText: 'SADE',
  logoChocolateText: 'Chocolate',
  logoSadeFont: "'Santana', Georgia, serif",
  logoChocolateFont: "'Santana', Georgia, serif",
  logoSadeSize: 28,
  logoChocolateSize: 11,
  // Content
  headerBadge: '✦ Hoş Geldin ✦',
  mainTitle: 'Artisan Çikolata\nDünyasına Adım Attın',
  welcomeText: 'Bundan sonra yeni koleksiyonlar, özel teklifler ve artisan çikolata dünyasından hikayeler seninle.',
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
  },
  typography: {
    headingFont: 'Georgia, serif',
    bodyFont: 'Arial, sans-serif',
    headingSize: 32,
    bodySize: 15,
    lineHeight: 1.8
  }
};

// Tüm email şablonlarının listesi
const ALL_EMAIL_TEMPLATES = [
  {
    id: 'order_confirmation',
    name: 'Sipariş Onayı',
    description: 'Sipariş başarıyla oluşturulduğunda gönderilir',
    trigger: 'Otomatik - Kart ödemeli sipariş tamamlandığında',
    icon: '🛒'
  },
  {
    id: 'eft_order_pending',
    name: 'EFT Ödeme Bekliyor',
    description: 'EFT/Havale ile sipariş verildiğinde banka bilgileri ile gönderilir',
    trigger: 'Otomatik - EFT seçildiğinde sipariş sonrası',
    icon: '🏦'
  },
  {
    id: 'payment_success',
    name: 'Ödeme Başarılı',
    description: 'Kredi kartı ile ödeme başarılı olduğunda gönderilir',
    trigger: 'Otomatik - İyzico 3D Secure onayından sonra',
    icon: '✅'
  },
  {
    id: 'payment_failed',
    name: 'Ödeme Başarısız',
    description: 'Ödeme başarısız olduğunda yeniden deneme linki ile gönderilir',
    trigger: 'Otomatik - İyzico ödeme hatası durumunda',
    icon: '❌'
  },
  {
    id: 'shipping_notification',
    name: 'Kargo Bildirimi',
    description: 'Sipariş kargoya verildiğinde takip numarası ile gönderilir',
    trigger: 'Manuel - Admin panelden "Kargoya Ver" butonuyla',
    icon: '📦'
  },
  {
    id: 'delivery_confirmation',
    name: 'Teslimat Onayı',
    description: 'Sipariş teslim edildiğinde gönderilir',
    trigger: 'Manuel - Admin panelden "Teslim Edildi" butonuyla',
    icon: '🎉'
  },
  {
    id: 'order_cancellation',
    name: 'Sipariş İptali',
    description: 'Sipariş iptal edildiğinde gönderilir',
    trigger: 'Manuel - Admin panelden sipariş iptal edildiğinde',
    icon: '😔'
  },
  {
    id: 'newsletter_welcome',
    name: 'Newsletter Hoş Geldin',
    description: 'Newsletter\'a abone olunduğunda gönderilir',
    trigger: 'Otomatik - Footer\'dan email kayıt formunda',
    icon: '📬',
    editable: true
  },
  {
    id: 'welcome',
    name: 'Hesap Hoş Geldin',
    description: 'Yeni hesap oluşturulduğunda gönderilir',
    trigger: 'Otomatik - Kayıt formunda',
    icon: '👋'
  },
  {
    id: 'campaign_code',
    name: 'Kampanya Kodu',
    description: 'Özel kampanya kodu ile bonus puan bildirimi',
    trigger: 'Manuel - Admin panelden kampanya oluşturulduğunda',
    icon: '🎁'
  },
  {
    id: 'campaign_reminder',
    name: 'Kampanya Hatırlatma',
    description: 'Kampanya süresi dolmadan önce hatırlatma',
    trigger: 'Manuel - Admin panelden',
    icon: '⏰'
  }
];

type TabType = 'all_templates' | 'newsletter_editor';

// Preview modal için template tipi
interface PreviewTemplate {
  id: string;
  name: string;
  icon: string;
}

export const EmailTemplatesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all_templates');
  const [template, setTemplate] = useState<NewsletterTemplate>(DEFAULT_TEMPLATE);
  const [availableFonts, setAvailableFonts] = useState<EmailFont[]>(DEFAULT_EMAIL_FONTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PreviewTemplate | null>(null);

  // Firestore'dan template ve fontları yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        // Template'i yükle
        const templateRef = doc(db, 'email_templates', 'newsletter_welcome');
        const templateSnap = await getDoc(templateRef);
        if (templateSnap.exists()) {
          setTemplate({ ...DEFAULT_TEMPLATE, ...templateSnap.data() } as NewsletterTemplate);
        } else {
          // İlk kez - varsayılan değerleri kaydet
          await setDoc(templateRef, { ...DEFAULT_TEMPLATE, updatedAt: serverTimestamp() });
        }

        // Fontları yükle
        const fontsRef = doc(db, 'email_settings', 'fonts');
        const fontsSnap = await getDoc(fontsRef);
        if (fontsSnap.exists()) {
          const fonts = fontsSnap.data().fonts || DEFAULT_EMAIL_FONTS;
          // Sadece aktif fontları göster, sırala
          setAvailableFonts(fonts.filter((f: EmailFont) => f.isActive !== false).sort((a: EmailFont, b: EmailFont) => (a.order || 0) - (b.order || 0)));
        }
      } catch (error) {
        console.error('Yükleme hatası:', error);
        toast.error('Yükleme başarısız');
      } finally {
        setLoading(false);
      }
    };
    loadData();
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
              Email Şablonları
            </h2>
            <p className="text-sm text-gray-500">Sistemdeki tüm email şablonlarını görüntüle ve düzenle</p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-dark-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('all_templates')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'all_templates'
              ? 'bg-white dark:bg-dark-700 text-brown-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tüm Şablonlar
        </button>
        <button
          onClick={() => setActiveTab('newsletter_editor')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'newsletter_editor'
              ? 'bg-white dark:bg-dark-700 text-brown-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Newsletter Editörü
        </button>
      </div>

      {/* All Templates Tab */}
      {activeTab === 'all_templates' && (
        <div className="grid gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>İpucu:</strong> Herhangi bir şablona tıklayarak önizlemesini görebilirsiniz. "Düzenlenebilir" etiketli şablonlar admin panelinden özelleştirilebilir.
            </p>
          </div>

          <div className="grid gap-3">
            {ALL_EMAIL_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gold/50 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setPreviewTemplate({ id: tmpl.id, name: tmpl.name, icon: tmpl.icon })}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{tmpl.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{tmpl.name}</h3>
                      {tmpl.editable && (
                        <span className="px-2 py-0.5 text-xs bg-gold/20 text-gold rounded-full">
                          Düzenlenebilir
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tmpl.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">schedule</span>
                      {tmpl.trigger}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-3 py-1.5 bg-gold/10 text-gold rounded-lg text-xs font-medium flex items-center gap-1">
                      <Eye size={14} />
                      Önizle
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Editor Tab */}
      {activeTab === 'newsletter_editor' && (
        <>
          {/* Editor Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Newsletter Hoş Geldin Emaili</h3>
              <p className="text-sm text-gray-500">Yeni abonelere gönderilen email şablonunu düzenleyin</p>
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

            {/* Logo Customization */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">🏷️ Logo Özelleştirme</h3>
              <div className="space-y-4">
                {/* Logo Görsel Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-xl">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kakao Logo Görseli</label>
                    <p className="text-xs text-gray-500">Email başlığında logo görseli göster</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.logoShowImage !== false}
                      onChange={(e) => setTemplate({ ...template, logoShowImage: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <span className="text-xs text-gray-500">{template.logoShowImage !== false ? 'Göster' : 'Gizle'}</span>
                  </label>
                </div>

                {/* Logo Görsel Ayarları */}
                {template.logoShowImage !== false && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Logo Görsel URL</label>
                        <input
                          type="text"
                          value={template.logoImageUrl || 'https://sadechocolate.com/kakaologo.png'}
                          onChange={(e) => setTemplate({ ...template, logoImageUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                          placeholder="https://sadechocolate.com/kakaologo.png"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Logo Boyutu (px)</label>
                        <input
                          type="number"
                          value={template.logoImageSize || 60}
                          onChange={(e) => setTemplate({ ...template, logoImageSize: parseInt(e.target.value) || 60 })}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                          min={30}
                          max={120}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Logo Rengi</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={template.logoColor || '#C5A059'}
                          onChange={(e) => setTemplate({ ...template, logoColor: e.target.value })}
                          className="w-16 h-10 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={template.logoColor || '#C5A059'}
                          onChange={(e) => setTemplate({ ...template, logoColor: e.target.value })}
                          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none font-mono"
                          placeholder="#C5A059"
                        />
                        <button
                          onClick={() => setTemplate({ ...template, logoColor: '#C5A059' })}
                          className="px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-xl text-xs transition-colors"
                          title="Varsayılan (Gold)"
                        >
                          Sıfırla
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setTemplate({ ...template, logoColor: '#C5A059' })} className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: '#C5A059', color: 'white' }}>Gold</button>
                        <button onClick={() => setTemplate({ ...template, logoColor: '#FFFFFF' })} className="px-3 py-1 rounded-lg text-xs border" style={{ backgroundColor: '#FFFFFF', color: '#333' }}>Beyaz</button>
                        <button onClick={() => setTemplate({ ...template, logoColor: '#8B4513' })} className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: '#8B4513', color: 'white' }}>Kahve</button>
                        <button onClick={() => setTemplate({ ...template, logoColor: '#4B3832' })} className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: '#4B3832', color: 'white' }}>Koyu</button>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">SADE Metni</label>
                    <input
                      type="text"
                      value={template.logoSadeText || 'SADE'}
                      onChange={(e) => setTemplate({ ...template, logoSadeText: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      placeholder="SADE"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Chocolate Metni</label>
                    <input
                      type="text"
                      value={template.logoChocolateText || 'Chocolate'}
                      onChange={(e) => setTemplate({ ...template, logoChocolateText: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      placeholder="Chocolate"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">SADE Fontu</label>
                    <select
                      value={template.logoSadeFont || "'Santana', Georgia, serif"}
                      onChange={(e) => setTemplate({ ...template, logoSadeFont: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                    >
                      <optgroup label="⭐ Önerilen">
                        <option value="'Santana', Georgia, serif">Santana (Özel Font)</option>
                      </optgroup>
                      {availableFonts.length > 0 && (
                        <optgroup label="Diğer Email-Safe Fonts">
                          {availableFonts.map(font => (
                            <option key={font.id} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Chocolate Fontu</label>
                    <select
                      value={template.logoChocolateFont || "'Santana', Georgia, serif"}
                      onChange={(e) => setTemplate({ ...template, logoChocolateFont: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                    >
                      <optgroup label="⭐ Önerilen">
                        <option value="'Santana', Georgia, serif">Santana (Özel Font)</option>
                      </optgroup>
                      {availableFonts.length > 0 && (
                        <optgroup label="Diğer Email-Safe Fonts">
                          {availableFonts.map(font => (
                            <option key={font.id} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">SADE Boyutu (px)</label>
                    <input
                      type="number"
                      value={template.logoSadeSize || 28}
                      onChange={(e) => setTemplate({ ...template, logoSadeSize: parseInt(e.target.value) || 28 })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      min={16}
                      max={64}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Chocolate Boyutu (px)</label>
                    <input
                      type="number"
                      value={template.logoChocolateSize || 11}
                      onChange={(e) => setTemplate({ ...template, logoChocolateSize: parseInt(e.target.value) || 11 })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      min={8}
                      max={32}
                    />
                  </div>
                </div>
                {/* Logo Preview */}
                <div className="p-6 bg-brown-900 dark:bg-dark-900 rounded-xl text-center">
                  {template.logoShowImage !== false && (
                    <div className="mb-4">
                      <img
                        src="/kakaologo.png"
                        alt="Logo"
                        style={{
                          width: `${template.logoImageSize || 60}px`,
                          height: `${template.logoImageSize || 60}px`,
                          margin: '0 auto',
                          display: 'block',
                          filter: `brightness(0) saturate(100%) invert(${template.logoColor === '#FFFFFF' ? '100' : '0'}%)`,
                          opacity: 0.9
                        }}
                      />
                    </div>
                  )}
                  <div style={{ fontFamily: template.logoSadeFont || "'Santana', Georgia, serif", fontSize: `${template.logoSadeSize || 28}px`, fontWeight: 'bold', color: 'white' }}>
                    {template.logoSadeText || 'SADE'}
                  </div>
                  <div style={{ fontFamily: template.logoChocolateFont || "'Santana', Georgia, serif", fontSize: `${template.logoChocolateSize || 11}px`, color: '#C5A059', marginTop: '4px' }}>
                    {template.logoChocolateText || 'Chocolate'}
                  </div>
                </div>
              </div>
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

            {/* Typography Settings */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="text-gold">Aa</span>
                Tipografi Ayarları
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Başlık Fontu</label>
                    <select
                      value={template.typography?.headingFont || DEFAULT_TEMPLATE.typography?.headingFont}
                      onChange={(e) => setTemplate({
                        ...template,
                        typography: { ...template.typography!, headingFont: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                    >
                      {availableFonts.map(font => (
                        <option key={font.id} value={font.value}>{font.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Gövde Fontu</label>
                    <select
                      value={template.typography?.bodyFont || DEFAULT_TEMPLATE.typography?.bodyFont}
                      onChange={(e) => setTemplate({
                        ...template,
                        typography: { ...template.typography!, bodyFont: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                    >
                      {availableFonts.map(font => (
                        <option key={font.id} value={font.value}>{font.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Başlık Boyutu (px)</label>
                    <input
                      type="number"
                      value={template.typography?.headingSize || 32}
                      onChange={(e) => setTemplate({
                        ...template,
                        typography: { ...template.typography!, headingSize: parseInt(e.target.value) || 32 }
                      })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      min={16}
                      max={64}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Gövde Boyutu (px)</label>
                    <input
                      type="number"
                      value={template.typography?.bodySize || 15}
                      onChange={(e) => setTemplate({
                        ...template,
                        typography: { ...template.typography!, bodySize: parseInt(e.target.value) || 15 }
                      })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      min={10}
                      max={24}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Satır Yüksekliği</label>
                    <input
                      type="number"
                      step="0.1"
                      value={template.typography?.lineHeight || 1.8}
                      onChange={(e) => setTemplate({
                        ...template,
                        typography: { ...template.typography!, lineHeight: parseFloat(e.target.value) || 1.8 }
                      })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                      min={1}
                      max={3}
                    />
                  </div>
                </div>
                {/* Preview */}
                <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Önizleme:</p>
                  <p style={{ fontFamily: template.typography?.headingFont, fontSize: `${template.typography?.headingSize || 32}px`, fontStyle: 'italic' }} className="text-gray-900 dark:text-white mb-2">
                    Başlık Örneği
                  </p>
                  <p style={{ fontFamily: template.typography?.bodyFont, fontSize: `${template.typography?.bodySize || 15}px`, lineHeight: template.typography?.lineHeight || 1.8 }} className="text-gray-600 dark:text-gray-400">
                    Bu bir gövde metni örneğidir. Tipografi ayarlarınızın nasıl görüneceğini buradan kontrol edebilirsiniz.
                  </p>
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
        </>
      )}

      {/* Email Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewTemplate(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{previewTemplate.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{previewTemplate.name}</h3>
                  <p className="text-xs text-gray-500">Email şablonu önizlemesi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ALL_EMAIL_TEMPLATES.find(t => t.id === previewTemplate.id)?.editable && (
                  <button
                    onClick={() => {
                      setPreviewTemplate(null);
                      setActiveTab('newsletter_editor');
                    }}
                    className="px-4 py-2 bg-gold/10 text-gold rounded-xl text-sm font-medium hover:bg-gold/20 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    Düzenle
                  </button>
                )}
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="overflow-auto max-h-[calc(90vh-80px)] bg-gray-100 dark:bg-dark-900">
              <div
                className="p-6"
                dangerouslySetInnerHTML={{ __html: getEmailPreviewHtml(previewTemplate.id) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Preview HTML generator
function generatePreviewHTML(t: NewsletterTemplate): string {
  const c = t.colors || DEFAULT_TEMPLATE.colors!;
  const ty = t.typography || DEFAULT_TEMPLATE.typography!;
  const mainTitleHTML = t.mainTitle.replace(/\n/g, '<br>');

  // Logo customization
  const logoShowImage = t.logoShowImage !== false;
  const logoImageUrl = t.logoImageUrl || `${window.location.origin}/kakaologo.png`;
  const logoImageSize = t.logoImageSize || 60;
  const logoColor = t.logoColor || '#C5A059';
  const logoSadeText = t.logoSadeText || 'SADE';
  const logoChocolateText = t.logoChocolateText || 'Chocolate';
  const logoSadeFont = t.logoSadeFont || "'Santana', Georgia, serif";
  const logoChocolateFont = t.logoChocolateFont || "'Santana', Georgia, serif";
  const logoSadeSize = t.logoSadeSize || 28;
  const logoChocolateSize = t.logoChocolateSize || 11;

  return `
    <div style="background-color: ${c.outerBg}; padding: 40px 20px; font-family: ${ty.headingFont};">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: ${c.bodyBg}; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background-color: ${c.headerBg}; padding: 40px 48px; text-align: center;">
            ${logoShowImage ? `<div style="width: ${logoImageSize}px; height: ${logoImageSize}px; margin: 0 auto 16px; background-color: ${logoColor}; -webkit-mask: url(${logoImageUrl}) center/contain no-repeat; mask: url(${logoImageUrl}) center/contain no-repeat;"></div>` : ''}
            <h1 style="margin: 0; font-family: ${logoSadeFont}; font-size: ${logoSadeSize}px; font-weight: bold; letter-spacing: 6px; color: ${c.bodyBg};">${logoSadeText}</h1>
            <p style="margin: 8px 0 0; font-family: ${logoChocolateFont}; font-size: ${logoChocolateSize}px; letter-spacing: 4px; color: ${c.accent}; font-weight: normal;">${logoChocolateText}</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 60px 48px;">
            <p style="text-align: center; margin: 0 0 16px; font-family: ${ty.bodyFont}; font-size: 10px; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase;">${t.headerBadge}</p>
            <h2 style="text-align: center; margin: 0 0 32px; font-family: ${ty.headingFont}; font-size: ${ty.headingSize}px; font-weight: normal; font-style: italic; color: ${c.textPrimary}; line-height: 1.3;">${mainTitleHTML}</h2>
            <div style="width: 60px; height: 1px; background-color: ${c.accent}; margin: 0 auto 32px;"></div>
            <p style="text-align: center; margin: 0 0 48px; font-family: ${ty.bodyFont}; font-size: ${ty.bodySize}px; line-height: ${ty.lineHeight}; color: ${c.textSecondary};">${t.welcomeText}</p>
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
