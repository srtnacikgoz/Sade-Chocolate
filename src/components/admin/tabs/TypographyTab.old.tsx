import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TypographySettings, FontConfig } from '../../../types';
import { Type, Save, RotateCcw, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Varsayılan typography ayarları
const DEFAULT_TYPOGRAPHY: TypographySettings = {
  id: 'default',
  headingFont: {
    family: 'Santana',
    source: 'custom',
    weights: [400, 700],
    fallback: 'serif'
  },
  bodyFont: {
    family: 'Inter',
    source: 'google',
    weights: [300, 400, 600],
    fallback: 'sans-serif'
  },
  displayFont: {
    family: 'Playfair Display',
    source: 'google',
    weights: [400, 700],
    fallback: 'serif'
  },
  logoFont: {
    family: 'Santana',
    source: 'custom',
    weights: [400, 700],
    fallback: 'serif'
  },
  buttonFont: {
    family: 'Inter',
    source: 'google',
    weights: [600, 700],
    fallback: 'sans-serif'
  },
  navFont: {
    family: 'Inter',
    source: 'google',
    weights: [500, 600],
    fallback: 'sans-serif'
  },
  labelFont: {
    family: 'Inter',
    source: 'google',
    weights: [500],
    fallback: 'sans-serif'
  },
  captionFont: {
    family: 'Inter',
    source: 'google',
    weights: [400],
    fallback: 'sans-serif'
  },
  fontSize: {
    h1: { desktop: '72px', tablet: '56px', mobile: '40px' },
    h2: { desktop: '60px', tablet: '48px', mobile: '32px' },
    h3: { desktop: '48px', tablet: '36px', mobile: '28px' },
    h4: { desktop: '36px', tablet: '28px', mobile: '24px' },
    h5: { desktop: '24px', tablet: '20px', mobile: '18px' },
    h6: { desktop: '20px', tablet: '18px', mobile: '16px' },
    body: { desktop: '16px', tablet: '16px', mobile: '14px' },
    small: { desktop: '14px', tablet: '13px', mobile: '12px' },
    tiny: { desktop: '12px', tablet: '11px', mobile: '10px' },
    button: { desktop: '14px', tablet: '13px', mobile: '12px' }
  },
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },
  letterSpacing: {
    tight: '-0.05em',
    normal: '0',
    wide: '0.05em',
    wider: '0.1em',
    widest: '0.2em'
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  },
  hoverColors: {
    primary: '#D4AF37',      // gold
    secondary: '#111827',    // gray-900
    accent: '#8B4513'        // brown
  }
};

// Popüler Google Fonts listesi
const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'Raleway', 'Nunito', 'Playfair Display',
  'Merriweather', 'Cormorant', 'Crimson Text', 'Lora',
  'Source Serif Pro', 'Work Sans', 'DM Sans', 'Plus Jakarta Sans'
];

// System fonts
const SYSTEM_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
  'Verdana', 'Courier New', 'serif', 'sans-serif', 'monospace'
];

export const TypographyTab: React.FC = () => {
  const [settings, setSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewText, setPreviewText] = useState({
    heading: 'Sade Chocolate',
    body: 'Bean-to-bar çikolata yapımında kusursuzluğu hedefleyen, Türkiye\'nin en ince zevkli çikolata markası.'
  });

  // Firestore'dan ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'typography');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSettings(docSnap.data() as TypographySettings);
        }
      } catch (error) {
        console.error('Typography ayarları yüklenemedi:', error);
        toast.error('Ayarlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Ayarları kaydet
  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'site_settings', 'typography');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });

      toast.success('Typography ayarları kaydedildi! 🎨');

      // CSS variables'ı güncelle
      applyTypography(settings);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  // CSS variables uygula
  const applyTypography = (typo: TypographySettings) => {
    const root = document.documentElement;

    // Font families
    root.style.setProperty('--font-heading', `${typo.headingFont.family}, ${typo.headingFont.fallback}`);
    root.style.setProperty('--font-body', `${typo.bodyFont.family}, ${typo.bodyFont.fallback}`);
    root.style.setProperty('--font-display', `${typo.displayFont.family}, ${typo.displayFont.fallback}`);
    root.style.setProperty('--font-logo', `${typo.logoFont.family}, ${typo.logoFont.fallback}`);

    // Font size scale
    root.style.setProperty('--font-base', `${typo.scale.base}px`);
    root.style.setProperty('--font-ratio', typo.scale.ratio.toString());

    // Hover colors
    root.style.setProperty('--hover-primary', typo.hoverColors.primary);
    root.style.setProperty('--hover-secondary', typo.hoverColors.secondary);
    root.style.setProperty('--hover-accent', typo.hoverColors.accent);

    // Google Fonts'u yükle
    loadGoogleFonts(typo);
  };

  // Google Fonts yükle
  const loadGoogleFonts = (typo: TypographySettings) => {
    const fonts: Array<{ family: string; weights: number[] }> = [];

    [typo.headingFont, typo.bodyFont, typo.displayFont, typo.logoFont].forEach(font => {
      if (font.source === 'google' && !fonts.find(f => f.family === font.family)) {
        fonts.push({ family: font.family, weights: font.weights });
      }
    });

    if (fonts.length > 0) {
      // Mevcut Google Fonts link'ini kaldır
      const existingLink = document.querySelector('link[data-typography]');
      if (existingLink) existingLink.remove();

      // Yeni link oluştur
      const link = document.createElement('link');
      link.setAttribute('data-typography', 'true');
      link.rel = 'stylesheet';

      const families = fonts.map(f =>
        `family=${f.family.replace(/ /g, '+')}:wght@${f.weights.join(';')}`
      ).join('&');

      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);
    }
  };

  // Font değiştir
  const updateFont = (type: 'headingFont' | 'bodyFont' | 'displayFont' | 'logoFont', updates: Partial<FontConfig>) => {
    setSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }));
  };

  // Varsayılanlara dön
  const resetToDefaults = () => {
    if (confirm('Tüm typography ayarlarını varsayılanlara döndürmek istediğinize emin misiniz?')) {
      setSettings(DEFAULT_TYPOGRAPHY);
      toast.info('Varsayılan ayarlar yüklendi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-t-transparent border-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-mustard rounded-2xl flex items-center justify-center">
            <Type className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Typography Ayarları</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Site fontlarını ve tipografi ayarlarını yönetin</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
          >
            <RotateCcw size={16} />
            <span className="text-sm font-medium">Varsayılan</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gold hover:bg-gold/90 text-white font-bold transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            <span className="text-sm">{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* Hover Renk Ayarları */}
      <div className="p-6 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Hover Renkleri</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Butonlar ve linkler üzerine gelindiğinde gösterilecek renkler
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ana Hover Rengi
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.hoverColors.primary}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  hoverColors: { ...prev.hoverColors, primary: e.target.value }
                }))}
                className="w-12 h-10 rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.hoverColors.primary}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  hoverColors: { ...prev.hoverColors, primary: e.target.value }
                }))}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white text-sm font-mono"
                placeholder="#D4AF37"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              İkincil Hover Rengi
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.hoverColors.secondary}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  hoverColors: { ...prev.hoverColors, secondary: e.target.value }
                }))}
                className="w-12 h-10 rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.hoverColors.secondary}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  hoverColors: { ...prev.hoverColors, secondary: e.target.value }
                }))}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white text-sm font-mono"
                placeholder="#111827"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vurgu Rengi
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.hoverColors.accent}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  hoverColors: { ...prev.hoverColors, accent: e.target.value }
                }))}
                className="w-12 h-10 rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.hoverColors.accent}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  hoverColors: { ...prev.hoverColors, accent: e.target.value }
                }))}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white text-sm font-mono"
                placeholder="#8B4513"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font Ayarları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heading Font */}
        <FontSelector
          label="Başlık Fontu"
          description="H1, H2, H3 başlıkları için"
          font={settings.headingFont}
          onChange={(updates) => updateFont('headingFont', updates)}
        />

        {/* Body Font */}
        <FontSelector
          label="Metin Fontu"
          description="Normal paragraf metinleri için"
          font={settings.bodyFont}
          onChange={(updates) => updateFont('bodyFont', updates)}
        />

        {/* Display Font */}
        <FontSelector
          label="Display Fontu"
          description="Özel başlıklar ve vurgular için"
          font={settings.displayFont}
          onChange={(updates) => updateFont('displayFont', updates)}
        />

        {/* Logo Font */}
        <FontSelector
          label="Logo Fontu"
          description="Header logosunda kullanılır"
          font={settings.logoFont}
          onChange={(updates) => updateFont('logoFont', updates)}
        />
      </div>

      {/* Preview */}
      <div className="mt-8 p-6 bg-gradient-to-br from-cream-50 to-cream-100 dark:from-dark-800 dark:to-dark-900 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Eye size={20} className="text-gold" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Canlı Önizleme</h3>
        </div>

        <div className="space-y-6">
          <div>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ fontFamily: `${settings.headingFont.family}, ${settings.headingFont.fallback}` }}
            >
              {previewText.heading}
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ fontFamily: `${settings.bodyFont.family}, ${settings.bodyFont.fallback}` }}
            >
              {previewText.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Font Selector Component
interface FontSelectorProps {
  label: string;
  description: string;
  font: FontConfig;
  onChange: (updates: Partial<FontConfig>) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ label, description, font, onChange }) => {
  const availableFonts = font.source === 'google' ? GOOGLE_FONTS : SYSTEM_FONTS;

  return (
    <div className="p-6 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{label}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>

      <div className="space-y-4">
        {/* Font Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kaynak
          </label>
          <select
            value={font.source}
            onChange={(e) => onChange({ source: e.target.value as 'google' | 'system' | 'custom' })}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
          >
            <option value="google">Google Fonts</option>
            <option value="system">System Fonts</option>
            <option value="custom">Custom Upload</option>
          </select>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Ailesi
          </label>
          {font.source === 'custom' ? (
            <input
              type="text"
              value={font.family}
              onChange={(e) => onChange({ family: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
              placeholder="Santana"
            />
          ) : (
            <select
              value={font.family}
              onChange={(e) => onChange({ family: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
            >
              {availableFonts.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          )}
        </div>

        {/* Preview */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
          <p
            className="text-2xl"
            style={{ fontFamily: `${font.family}, ${font.fallback}` }}
          >
            Aa Bb Çç 123
          </p>
        </div>
      </div>
    </div>
  );
};
