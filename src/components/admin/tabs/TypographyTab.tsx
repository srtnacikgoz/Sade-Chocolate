import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TypographySettings, FontConfig, ResponsiveFontSize, WebFont } from '../../../types';
import { Type, Save, RotateCcw, Eye, Monitor, Tablet, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_WEB_FONTS, seedWebFonts } from '../../../utils/seedWebFonts';

// Varsayılan typography ayarları
const DEFAULT_TYPOGRAPHY: TypographySettings = {
  id: 'default',
  h1Font: { family: 'Santana', source: 'custom', weights: [400, 700], fallback: 'Cormorant Garamond, Georgia, serif' },
  h2Font: { family: 'Santana', source: 'custom', weights: [400, 700], fallback: 'Cormorant Garamond, Georgia, serif' },
  h3Font: { family: 'Inter', source: 'google', weights: [600, 700], fallback: 'sans-serif' },
  h4Font: { family: 'Inter', source: 'google', weights: [600, 700], fallback: 'sans-serif' },
  bodyFont: { family: 'Inter', source: 'google', weights: [300, 400, 600], fallback: 'sans-serif' },
  displayFont: { family: 'Playfair Display', source: 'google', weights: [400, 700], fallback: 'serif' },
  logoFont: { family: 'Santana', source: 'custom', weights: [400, 700], fallback: 'Cormorant Garamond, Georgia, serif' },
  buttonFont: { family: 'Inter', source: 'google', weights: [600, 700], fallback: 'sans-serif' },
  navFont: { family: 'Inter', source: 'google', weights: [500, 600], fallback: 'sans-serif' },
  labelFont: { family: 'Inter', source: 'google', weights: [500], fallback: 'sans-serif' },
  captionFont: { family: 'Inter', source: 'google', weights: [400], fallback: 'sans-serif' },
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
  fontWeight: { thin: 100, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 },
  elementWeights: { h1: 700, h2: 700, h3: 600, h4: 600, h5: 600, h6: 600, body: 400, button: 700, nav: 600, label: 500 },
  letterSpacing: { tight: '-0.05em', normal: '0', wide: '0.05em', wider: '0.1em', widest: '0.2em' },
  elementLetterSpacing: { h1: '-0.02em', h2: '-0.01em', h3: '0', h4: '0', body: '0', button: '0.05em', nav: '0.02em' },
  lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75, loose: 2 },
  elementLineHeight: { h1: 1.1, h2: 1.2, h3: 1.3, h4: 1.4, body: 1.6, button: 1 },
  hoverColors: { primary: '#D4AF37', secondary: '#111827', accent: '#8B4513' }
};

// Font Presets (Hazır Kombinasyonlar)
const FONT_PRESETS = [
  {
    id: 'chocolate-luxury',
    name: 'Chocolate Luxury',
    description: 'Mevcut lüks tasarım (Santana + Inter)',
    headingFont: 'Santana',
    bodyFont: 'Inter',
    displayFont: 'Playfair Display',
    buttonFont: 'Inter',
    navFont: 'Inter'
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    description: 'Klasik ve zarif (Playfair + Lato)',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    displayFont: 'Playfair Display',
    buttonFont: 'Lato',
    navFont: 'Lato'
  },
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    description: 'Çağdaş ve temiz (Montserrat + Open Sans)',
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    displayFont: 'Montserrat',
    buttonFont: 'Montserrat',
    navFont: 'Montserrat'
  },
  {
    id: 'classic-editorial',
    name: 'Classic Editorial',
    description: 'Dergi tarzı (Cormorant + Work Sans)',
    headingFont: 'Cormorant',
    bodyFont: 'Work Sans',
    displayFont: 'Cormorant',
    buttonFont: 'Work Sans',
    navFont: 'Work Sans'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Sade ve minimal (Inter + Inter)',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    displayFont: 'Inter',
    buttonFont: 'Inter',
    navFont: 'Inter'
  },
  {
    id: 'bold-statement',
    name: 'Bold Statement',
    description: 'Güçlü ve dikkat çekici (Raleway + Roboto)',
    headingFont: 'Raleway',
    bodyFont: 'Roboto',
    displayFont: 'Raleway',
    buttonFont: 'Raleway',
    navFont: 'Raleway'
  }
];

export const TypographyTab: React.FC = () => {
  const [settings, setSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<WebFont[]>(DEFAULT_WEB_FONTS);
  const [activePreviewTab, setActivePreviewTab] = useState<'scale' | 'components' | 'pages'>('scale');
  const [expandedSections, setExpandedSections] = useState({
    presets: true,
    fonts: false,
    sizes: false,
    weights: false,
    spacing: false,
    lineheight: false,
    colors: false
  });

  // Typography ayarlarını yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'typography');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;

          // Migration: Eski yapıdan yeni yapıya geçiş
          if (data.headingFont && !data.h1Font) {
            const migratedSettings: TypographySettings = {
              ...data,
              h1Font: data.headingFont,
              h2Font: data.headingFont,
              h3Font: data.headingFont,
              h4Font: data.headingFont,
              // elementWeights yoksa ekle
              elementWeights: data.elementWeights || DEFAULT_TYPOGRAPHY.elementWeights,
              elementLetterSpacing: data.elementLetterSpacing || DEFAULT_TYPOGRAPHY.elementLetterSpacing,
              elementLineHeight: data.elementLineHeight || DEFAULT_TYPOGRAPHY.elementLineHeight
            };
            setSettings(migratedSettings);
          } else {
            setSettings(data as TypographySettings);
          }
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

  // Web fontlarını yükle
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fontsRef = doc(db, 'site_settings', 'web_fonts');
        const fontsSnap = await getDoc(fontsRef);

        if (fontsSnap.exists()) {
          const fonts = fontsSnap.data().fonts || DEFAULT_WEB_FONTS;
          // Sadece aktif fontları yükle ve sırala
          setAvailableFonts(
            fonts
              .filter((f: WebFont) => f.isActive !== false)
              .sort((a: WebFont, b: WebFont) => (a.order || 0) - (b.order || 0))
          );
        } else {
          // İlk kez - seed data yükle
          await seedWebFonts();
          setAvailableFonts(DEFAULT_WEB_FONTS);
        }
      } catch (error) {
        console.error('Web fonts yüklenemedi:', error);
        // Hata durumunda varsayılan fontları kullan
        setAvailableFonts(DEFAULT_WEB_FONTS);
      }
    };
    loadFonts();
  }, []);

  // Live preview için ayarları uygula
  useEffect(() => {
    if (!loading) {
      applyTypography(settings);
    }
  }, [settings, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'site_settings', 'typography');
      await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() });
      toast.success('Typography ayarları kaydedildi! 🎨');
      applyTypography(settings);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  // Font family değerini CSS için formatla
  const formatFontFamily = (family: string, fallback: string): string => {
    const formattedFamily = family.includes(' ') ? `"${family}"` : family;
    return `${formattedFamily}, ${fallback}`;
  };

  const applyTypography = (typo: TypographySettings) => {
    const root = document.documentElement;
    if (typo.h1Font) {
      root.style.setProperty('--font-h1', formatFontFamily(typo.h1Font.family, typo.h1Font.fallback));
    }
    if (typo.h2Font) {
      root.style.setProperty('--font-h2', formatFontFamily(typo.h2Font.family, typo.h2Font.fallback));
    }
    if (typo.h3Font) {
      root.style.setProperty('--font-h3', formatFontFamily(typo.h3Font.family, typo.h3Font.fallback));
    }
    if (typo.h4Font) {
      root.style.setProperty('--font-h4', formatFontFamily(typo.h4Font.family, typo.h4Font.fallback));
    }
    if (typo.bodyFont) {
      root.style.setProperty('--font-body', formatFontFamily(typo.bodyFont.family, typo.bodyFont.fallback));
    }
    if (typo.displayFont) {
      root.style.setProperty('--font-display', formatFontFamily(typo.displayFont.family, typo.displayFont.fallback));
    }
    if (typo.logoFont) {
      root.style.setProperty('--font-logo', formatFontFamily(typo.logoFont.family, typo.logoFont.fallback));
    }
    if (typo.buttonFont) {
      root.style.setProperty('--font-button', formatFontFamily(typo.buttonFont.family, typo.buttonFont.fallback));
    }
    if (typo.navFont) {
      root.style.setProperty('--font-nav', formatFontFamily(typo.navFont.family, typo.navFont.fallback));
    }
    if (typo.labelFont) {
      root.style.setProperty('--font-label', formatFontFamily(typo.labelFont.family, typo.labelFont.fallback));
    }
    if (typo.captionFont) {
      root.style.setProperty('--font-caption', formatFontFamily(typo.captionFont.family, typo.captionFont.fallback));
    }
    if (typo.hoverColors) {
      root.style.setProperty('--hover-primary', typo.hoverColors.primary);
      root.style.setProperty('--hover-secondary', typo.hoverColors.secondary);
      root.style.setProperty('--hover-accent', typo.hoverColors.accent);
    }

    // Element weights
    if (typo.elementWeights) {
      Object.entries(typo.elementWeights).forEach(([key, value]) => {
        root.style.setProperty(`--weight-${key}`, value.toString());
      });
    }

    // Element letter spacing
    if (typo.elementLetterSpacing) {
      Object.entries(typo.elementLetterSpacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, value);
      });
    }

    // Element line height
    if (typo.elementLineHeight) {
      Object.entries(typo.elementLineHeight).forEach(([key, value]) => {
        root.style.setProperty(`--lineheight-${key}`, value.toString());
      });
    }

    loadGoogleFonts(typo);
  };

  const loadGoogleFonts = (typo: TypographySettings) => {
    const fonts: Array<{ family: string; weights: number[] }> = [];
    [typo.h1Font, typo.h2Font, typo.h3Font, typo.h4Font, typo.bodyFont, typo.displayFont, typo.logoFont, typo.buttonFont, typo.navFont, typo.labelFont, typo.captionFont].forEach(font => {
      if (font && font.source === 'google' && !fonts.find(f => f.family === font.family)) {
        fonts.push({ family: font.family, weights: font.weights });
      }
    });
    if (fonts.length > 0) {
      const existingLink = document.querySelector('link[data-typography]');
      if (existingLink) existingLink.remove();
      const link = document.createElement('link');
      link.setAttribute('data-typography', 'true');
      link.rel = 'stylesheet';
      const families = fonts.map(f => `family=${f.family.replace(/ /g, '+')}:wght@${f.weights.join(';')}`).join('&');
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);
    }
  };

  const updateFont = (type: keyof Pick<TypographySettings, 'h1Font' | 'h2Font' | 'h3Font' | 'h4Font' | 'bodyFont' | 'displayFont' | 'logoFont' | 'buttonFont' | 'navFont' | 'labelFont' | 'captionFont'>, updates: Partial<FontConfig>) => {
    setSettings(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }));
  };

  const updateFontSize = (element: keyof TypographySettings['fontSize'], device: 'desktop' | 'tablet' | 'mobile', value: string) => {
    setSettings(prev => ({
      ...prev,
      fontSize: {
        ...prev.fontSize,
        [element]: { ...prev.fontSize[element], [device]: value }
      }
    }));
  };

  const updateElementWeight = (element: keyof TypographySettings['elementWeights'], value: number) => {
    setSettings(prev => ({
      ...prev,
      elementWeights: {
        ...prev.elementWeights,
        [element]: value
      }
    }));
  };

  const updateElementLetterSpacing = (element: keyof TypographySettings['elementLetterSpacing'], value: string) => {
    setSettings(prev => ({
      ...prev,
      elementLetterSpacing: {
        ...prev.elementLetterSpacing,
        [element]: value
      }
    }));
  };

  const updateElementLineHeight = (element: keyof TypographySettings['elementLineHeight'], value: number) => {
    setSettings(prev => ({
      ...prev,
      elementLineHeight: {
        ...prev.elementLineHeight,
        [element]: value
      }
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const applyPreset = (presetId: string) => {
    const preset = FONT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Font bilgisini Firestore'dan yüklenen listeden al
    const getFont = (family: string): FontConfig => {
      const font = availableFonts.find(f => f.family === family);
      if (font) {
        return {
          family: font.family,
          source: font.source,
          weights: font.weights || [400, 700],
          fallback: font.fallback || (font.source === 'google' ? 'sans-serif' : 'serif')
        };
      }
      // Fallback: font bulunamazsa varsayılan değerler
      return { family, source: 'system', weights: [400, 700], fallback: 'sans-serif' };
    };

    setSettings(prev => ({
      ...prev,
      h1Font: getFont(preset.headingFont),
      h2Font: getFont(preset.headingFont),
      h3Font: getFont(preset.bodyFont),
      h4Font: getFont(preset.bodyFont),
      bodyFont: getFont(preset.bodyFont),
      displayFont: getFont(preset.displayFont),
      buttonFont: getFont(preset.buttonFont),
      navFont: getFont(preset.navFont),
      labelFont: getFont(preset.bodyFont),
      captionFont: getFont(preset.bodyFont)
    }));

    toast.success(`${preset.name} preset uygulandı! 🎨`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-t-transparent border-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gold to-brand-mustard rounded-2xl flex items-center justify-center">
            <Type className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Typography Ayarları</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fontlar, boyutlar ve renkler</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setSettings(DEFAULT_TYPOGRAPHY)}
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

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="lg:col-span-1 space-y-4">
          {/* Presets Section */}
          <CollapsibleSection
            title="Hazır Kombinasyonlar"
            isExpanded={expandedSections.presets}
            onToggle={() => toggleSection('presets')}
          >
            <div className="space-y-2">
              {FONT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gold dark:hover:border-gold hover:bg-gold/5 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-gold transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                    {/* Active indicator */}
                    {settings.h1Font.family === preset.headingFont &&
                     settings.bodyFont.family === preset.bodyFont && (
                      <span className="px-2 py-0.5 bg-gold text-white text-[9px] font-bold rounded-full">
                        AKTİF
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Fonts Section */}
          <CollapsibleSection
            title="Font Aileleri"
            isExpanded={expandedSections.fonts}
            onToggle={() => toggleSection('fonts')}
          >
            <div className="space-y-3">
              {/* Başlık Fontları */}
              <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2">BAŞLIKLAR</p>
                <div className="space-y-3">
                  <MiniFontSelector label="H1 Başlık" font={settings.h1Font} onChange={(u) => updateFont('h1Font', u)} availableFonts={availableFonts} />
                  <MiniFontSelector label="H2 Başlık" font={settings.h2Font} onChange={(u) => updateFont('h2Font', u)} availableFonts={availableFonts} />
                  <MiniFontSelector label="H3 Başlık" font={settings.h3Font} onChange={(u) => updateFont('h3Font', u)} availableFonts={availableFonts} />
                  <MiniFontSelector label="H4 Başlık" font={settings.h4Font} onChange={(u) => updateFont('h4Font', u)} availableFonts={availableFonts} />
                </div>
              </div>

              {/* Diğer Fontlar */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2">DİĞER</p>
                <div className="space-y-3">
                  <MiniFontSelector label="Metin" font={settings.bodyFont} onChange={(u) => updateFont('bodyFont', u)} availableFonts={availableFonts} />
                  <MiniFontSelector label="Display" font={settings.displayFont} onChange={(u) => updateFont('displayFont', u)} availableFonts={availableFonts} />

                  {/* Logo - Korumalı */}
                  <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Logo</label>
                        <p className="text-[10px] text-gray-500 mt-0.5">Sabit - Değiştirilemez</p>
                      </div>
                      <span className="px-3 py-1 bg-gold/20 text-gold font-bold text-xs rounded-full">Santana</span>
                    </div>
                  </div>

                  <MiniFontSelector label="Buton" font={settings.buttonFont} onChange={(u) => updateFont('buttonFont', u)} availableFonts={availableFonts} />
                  <MiniFontSelector label="Nav" font={settings.navFont} onChange={(u) => updateFont('navFont', u)} availableFonts={availableFonts} />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Font Sizes Section */}
          <CollapsibleSection
            title="Font Boyutları"
            isExpanded={expandedSections.sizes}
            onToggle={() => toggleSection('sizes')}
          >
            <div className="space-y-3">
              {(['h1', 'h2', 'h3', 'h4', 'body', 'button'] as const).map(elem => (
                <FontSizeControl
                  key={elem}
                  label={elem.toUpperCase()}
                  value={settings.fontSize[elem]}
                  onChange={(device, val) => updateFontSize(elem, device, val)}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* Font Weights Section */}
          <CollapsibleSection
            title="Font Kalınlıkları"
            isExpanded={expandedSections.weights}
            onToggle={() => toggleSection('weights')}
          >
            <div className="space-y-3">
              {(['h1', 'h2', 'h3', 'h4', 'body', 'button', 'nav', 'label'] as const).map(elem => (
                <WeightSelector
                  key={elem}
                  label={elem.toUpperCase()}
                  value={settings.elementWeights[elem]}
                  onChange={(val) => updateElementWeight(elem, val)}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* Letter Spacing Section */}
          <CollapsibleSection
            title="Harf Aralığı"
            isExpanded={expandedSections.spacing}
            onToggle={() => toggleSection('spacing')}
          >
            <div className="space-y-3">
              {(['h1', 'h2', 'h3', 'h4', 'body', 'button', 'nav'] as const).map(elem => (
                <LetterSpacingSelector
                  key={elem}
                  label={elem.toUpperCase()}
                  value={settings.elementLetterSpacing[elem]}
                  onChange={(val) => updateElementLetterSpacing(elem, val)}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* Line Height Section */}
          <CollapsibleSection
            title="Satır Yüksekliği"
            isExpanded={expandedSections.lineheight}
            onToggle={() => toggleSection('lineheight')}
          >
            <div className="space-y-3">
              {(['h1', 'h2', 'h3', 'h4', 'body', 'button'] as const).map(elem => (
                <LineHeightSelector
                  key={elem}
                  label={elem.toUpperCase()}
                  value={settings.elementLineHeight[elem]}
                  onChange={(val) => updateElementLineHeight(elem, val)}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* Hover Colors Section */}
          <CollapsibleSection
            title="Hover Renkleri"
            isExpanded={expandedSections.colors}
            onToggle={() => toggleSection('colors')}
          >
            <div className="space-y-3">
              <ColorPicker
                label="Ana"
                value={settings.hoverColors.primary}
                onChange={(val) => setSettings(prev => ({ ...prev, hoverColors: { ...prev.hoverColors, primary: val } }))}
              />
              <ColorPicker
                label="İkincil"
                value={settings.hoverColors.secondary}
                onChange={(val) => setSettings(prev => ({ ...prev, hoverColors: { ...prev.hoverColors, secondary: val } }))}
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Preview Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActivePreviewTab('scale')}
                className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                  activePreviewTab === 'scale'
                    ? 'bg-gold text-white'
                    : 'bg-gray-50 dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                Typography Scale
              </button>
              <button
                onClick={() => setActivePreviewTab('components')}
                className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                  activePreviewTab === 'components'
                    ? 'bg-gold text-white'
                    : 'bg-gray-50 dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                Components
              </button>
              <button
                onClick={() => setActivePreviewTab('pages')}
                className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                  activePreviewTab === 'pages'
                    ? 'bg-gold text-white'
                    : 'bg-gray-50 dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                Pages
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-8">
              {activePreviewTab === 'scale' && <TypographyScalePreview settings={settings} />}
              {activePreviewTab === 'components' && <ComponentPreview settings={settings} />}
              {activePreviewTab === 'pages' && <PagePreview settings={settings} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Font Selector
const MiniFontSelector: React.FC<{
  label: string;
  font: FontConfig;
  onChange: (u: Partial<FontConfig>) => void;
  availableFonts: WebFont[];
}> = ({ label, font, onChange, availableFonts }) => {
  // Fontları source'a göre grupla
  const customFonts = availableFonts.filter(f => f.source === 'custom');
  const googleFonts = availableFonts.filter(f => f.source === 'google');
  const systemFonts = availableFonts.filter(f => f.source === 'system');

  const handleChange = (selectedFamily: string) => {
    const selectedFont = availableFonts.find(f => f.family === selectedFamily);
    if (selectedFont) {
      onChange({
        family: selectedFont.family,
        source: selectedFont.source,
        fallback: selectedFont.fallback || (selectedFont.source === 'google' ? 'sans-serif' : 'serif'),
        weights: selectedFont.weights
      });
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={font.family}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
      >
        {customFonts.length > 0 && (
          <optgroup label="⭐ Custom Fonts">
            {customFonts.map(f => <option key={f.id} value={f.family}>{f.family}</option>)}
          </optgroup>
        )}
        {googleFonts.length > 0 && (
          <optgroup label="Google Fonts">
            {googleFonts.map(f => <option key={f.id} value={f.family}>{f.family}</option>)}
          </optgroup>
        )}
        {systemFonts.length > 0 && (
          <optgroup label="System Fonts">
            {systemFonts.map(f => <option key={f.id} value={f.family}>{f.family}</option>)}
          </optgroup>
        )}
      </select>
    </div>
  );
};

// Font Size Control
const FontSizeControl: React.FC<{ label: string; value: ResponsiveFontSize; onChange: (device: 'desktop' | 'tablet' | 'mobile', val: string) => void }> = ({ label, value, onChange }) => {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Monitor size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-500">Desktop</span>
          </div>
          <input
            type="text"
            value={value.desktop}
            onChange={(e) => onChange('desktop', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
          />
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Tablet size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-500">Tablet</span>
          </div>
          <input
            type="text"
            value={value.tablet}
            onChange={(e) => onChange('tablet', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
          />
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Smartphone size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-500">Mobile</span>
          </div>
          <input
            type="text"
            value={value.mobile}
            onChange={(e) => onChange('mobile', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
          />
        </div>
      </div>
    </div>
  );
};

// Weight Selector
const WeightSelector: React.FC<{ label: string; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => {
  const weights = [
    { value: 100, label: 'Thin (100)' },
    { value: 300, label: 'Light (300)' },
    { value: 400, label: 'Normal (400)' },
    { value: 500, label: 'Medium (500)' },
    { value: 600, label: 'Semibold (600)' },
    { value: 700, label: 'Bold (700)' },
    { value: 900, label: 'Black (900)' }
  ];

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
      >
        {weights.map(w => (
          <option key={w.value} value={w.value}>{w.label}</option>
        ))}
      </select>
    </div>
  );
};

// Letter Spacing Selector
const LetterSpacingSelector: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => {
  const spacings = [
    { value: '-0.05em', label: 'Çok Dar (-0.05em)' },
    { value: '-0.02em', label: 'Dar (-0.02em)' },
    { value: '-0.01em', label: 'Hafif Dar (-0.01em)' },
    { value: '0', label: 'Normal (0)' },
    { value: '0.02em', label: 'Hafif Geniş (0.02em)' },
    { value: '0.05em', label: 'Geniş (0.05em)' },
    { value: '0.1em', label: 'Çok Geniş (0.1em)' },
    { value: '0.2em', label: 'Ultra Geniş (0.2em)' }
  ];

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
      >
        {spacings.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
};

// Line Height Selector
const LineHeightSelector: React.FC<{ label: string; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => {
  const lineHeights = [
    { value: 1, label: 'Sıkı (1)' },
    { value: 1.1, label: 'Çok Dar (1.1)' },
    { value: 1.2, label: 'Dar (1.2)' },
    { value: 1.3, label: 'Hafif Dar (1.3)' },
    { value: 1.4, label: 'Normal-Dar (1.4)' },
    { value: 1.5, label: 'Normal (1.5)' },
    { value: 1.6, label: 'Rahat (1.6)' },
    { value: 1.75, label: 'Geniş (1.75)' },
    { value: 2, label: 'Çok Geniş (2)' }
  ];

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900"
      >
        {lineHeights.map(lh => (
          <option key={lh.value} value={lh.value}>{lh.label}</option>
        ))}
      </select>
    </div>
  );
};

// Color Picker
const ColorPicker: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-900 font-mono"
        />
      </div>
    </div>
  );
};

// Collapsible Section
const CollapsibleSection: React.FC<{ title: string; isExpanded: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isExpanded, onToggle, children }) => {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-dark-900 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
      >
        <span className="text-sm font-bold text-gray-900 dark:text-white">{title}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
};

// Typography Scale Preview
const TypographyScalePreview: React.FC<{ settings: TypographySettings }> = ({ settings }) => {
  return (
    <div className="space-y-4">
      <h1 style={{
        fontFamily: `${settings.h1Font.family}, ${settings.h1Font.fallback}`,
        fontSize: settings.fontSize.h1.desktop,
        fontWeight: settings.elementWeights.h1,
        letterSpacing: settings.elementLetterSpacing.h1,
        lineHeight: settings.elementLineHeight.h1
      }}>
        H1: Sade Chocolate
      </h1>
      <h2 style={{
        fontFamily: `${settings.h2Font.family}, ${settings.h2Font.fallback}`,
        fontSize: settings.fontSize.h2.desktop,
        fontWeight: settings.elementWeights.h2,
        letterSpacing: settings.elementLetterSpacing.h2,
        lineHeight: settings.elementLineHeight.h2
      }}>
        H2: Bean-to-Bar Excellence
      </h2>
      <h3 style={{
        fontFamily: `${settings.h3Font.family}, ${settings.h3Font.fallback}`,
        fontSize: settings.fontSize.h3.desktop,
        fontWeight: settings.elementWeights.h3,
        letterSpacing: settings.elementLetterSpacing.h3,
        lineHeight: settings.elementLineHeight.h3
      }}>
        H3: Tadım Koleksiyonu
      </h3>
      <h4 style={{
        fontFamily: `${settings.h4Font.family}, ${settings.h4Font.fallback}`,
        fontSize: settings.fontSize.h4.desktop,
        fontWeight: settings.elementWeights.h4,
        letterSpacing: settings.elementLetterSpacing.h4,
        lineHeight: settings.elementLineHeight.h4
      }}>
        H4: Premium Selection
      </h4>
      <p style={{
        fontFamily: `${settings.bodyFont.family}, ${settings.bodyFont.fallback}`,
        fontSize: settings.fontSize.body.desktop,
        fontWeight: settings.elementWeights.body,
        letterSpacing: settings.elementLetterSpacing.body,
        lineHeight: settings.elementLineHeight.body
      }}>
        Body: Bean-to-bar çikolata yapımında kusursuzluğu hedefleyen, Türkiye'nin en ince zevkli çikolata markası.
      </p>
      <p style={{ fontFamily: `${settings.captionFont.family}, ${settings.captionFont.fallback}`, fontSize: settings.fontSize.small.desktop }}>
        Small: Küçük açıklama metni
      </p>
    </div>
  );
};

// Component Preview
const ComponentPreview: React.FC<{ settings: TypographySettings }> = ({ settings }) => {
  return (
    <div className="space-y-6">
      {/* Buttons */}
      <div>
        <p className="text-xs font-bold text-gray-500 mb-2">BUTONLAR</p>
        <div className="flex gap-3">
          <button
            style={{
              fontFamily: `${settings.buttonFont.family}, ${settings.buttonFont.fallback}`,
              fontSize: settings.fontSize.button.desktop,
              fontWeight: settings.elementWeights.button,
              letterSpacing: settings.elementLetterSpacing.button,
              lineHeight: settings.elementLineHeight.button,
              backgroundColor: settings.hoverColors.primary
            }}
            className="px-6 py-3 text-white rounded-xl transition-colors"
          >
            Primary Hover
          </button>
          <button
            style={{
              fontFamily: `${settings.buttonFont.family}, ${settings.buttonFont.fallback}`,
              fontSize: settings.fontSize.button.desktop,
              fontWeight: settings.elementWeights.button,
              letterSpacing: settings.elementLetterSpacing.button,
              lineHeight: settings.elementLineHeight.button,
              backgroundColor: settings.hoverColors.secondary
            }}
            className="px-6 py-3 text-white rounded-xl transition-colors"
          >
            Secondary Hover
          </button>
        </div>
      </div>

      {/* Product Card */}
      <div>
        <p className="text-xs font-bold text-gray-500 mb-2">ÜRÜN KARTI</p>
        <div className="bg-cream-50 dark:bg-dark-900 p-4 rounded-xl max-w-xs">
          <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-lg mb-3"></div>
          <h3
            style={{
              fontFamily: `${settings.h4Font.family}, ${settings.h4Font.fallback}`,
              fontSize: settings.fontSize.h5.desktop,
              fontWeight: settings.elementWeights.h4,
              letterSpacing: settings.elementLetterSpacing.h4,
              lineHeight: settings.elementLineHeight.h4
            }}
            className="mb-1"
          >
            Madagascar 70%
          </h3>
          <p
            style={{
              fontFamily: `${settings.bodyFont.family}, ${settings.bodyFont.fallback}`,
              fontSize: settings.fontSize.small.desktop,
              fontWeight: settings.elementWeights.body,
              letterSpacing: settings.elementLetterSpacing.body,
              lineHeight: settings.elementLineHeight.body
            }}
            className="text-gray-500 mb-3"
          >
            Egzotik meyvemsi notalar
          </p>
          <div className="flex items-center justify-between">
            <span style={{
              fontSize: settings.fontSize.body.desktop,
              fontWeight: settings.elementWeights.body,
              letterSpacing: settings.elementLetterSpacing.body
            }} className="font-bold">₺399.00</span>
            <button className="w-9 h-9 bg-gold text-white rounded-full">+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page Preview - Mini E-ticaret Sayfası Mockup
const PagePreview: React.FC<{ settings: TypographySettings }> = ({ settings }) => {
  return (
    <div className="bg-cream-100 dark:bg-dark-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Mini Header/Nav */}
      <div className="bg-white dark:bg-dark-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div style={{
          fontFamily: `${settings.logoFont.family}, ${settings.logoFont.fallback}`,
          fontSize: '18px',
          fontWeight: 700
        }}>
          Sade Chocolate
        </div>
        <div className="flex gap-4 text-xs" style={{
          fontFamily: `${settings.navFont.family}, ${settings.navFont.fallback}`,
          fontWeight: settings.elementWeights.nav,
          letterSpacing: settings.elementLetterSpacing.nav
        }}>
          <span>Ürünler</span>
          <span>Hakkımızda</span>
          <span>İletişim</span>
        </div>
      </div>

      {/* Mini Hero Section */}
      <div className="bg-gradient-to-br from-cream-50 to-mocha-50 dark:from-dark-900 dark:to-dark-800 px-6 py-8 text-center">
        <h1 style={{
          fontFamily: `${settings.h1Font.family}, ${settings.h1Font.fallback}`,
          fontSize: settings.fontSize.h2.desktop,
          fontWeight: settings.elementWeights.h1,
          letterSpacing: settings.elementLetterSpacing.h1,
          lineHeight: settings.elementLineHeight.h1
        }} className="mb-2">
          Bean-to-Bar Ustalığı
        </h1>
        <p style={{
          fontFamily: `${settings.bodyFont.family}, ${settings.bodyFont.fallback}`,
          fontSize: settings.fontSize.body.desktop,
          fontWeight: settings.elementWeights.body,
          letterSpacing: settings.elementLetterSpacing.body,
          lineHeight: settings.elementLineHeight.body
        }} className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          Dünya çapında seçilmiş kakao çekirdeklerinden üretilen premium çikolatalar
        </p>
        <button style={{
          fontFamily: `${settings.buttonFont.family}, ${settings.buttonFont.fallback}`,
          fontSize: settings.fontSize.button.desktop,
          fontWeight: settings.elementWeights.button,
          letterSpacing: settings.elementLetterSpacing.button,
          lineHeight: settings.elementLineHeight.button,
          backgroundColor: settings.hoverColors.primary
        }} className="px-5 py-2 text-white rounded-lg text-sm">
          Keşfet
        </button>
      </div>

      {/* Mini Product Grid */}
      <div className="px-4 py-6">
        <h3 style={{
          fontFamily: `${settings.h3Font.family}, ${settings.h3Font.fallback}`,
          fontSize: settings.fontSize.h4.desktop,
          fontWeight: settings.elementWeights.h3,
          letterSpacing: settings.elementLetterSpacing.h3,
          lineHeight: settings.elementLineHeight.h3
        }} className="mb-4">
          Öne Çıkan Ürünler
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-800 rounded-lg p-2">
              <div className="bg-gray-200 dark:bg-gray-700 h-20 rounded mb-2"></div>
              <h4 style={{
                fontFamily: `${settings.h4Font.family}, ${settings.h4Font.fallback}`,
                fontSize: '11px',
                fontWeight: settings.elementWeights.h4,
                letterSpacing: settings.elementLetterSpacing.h4,
                lineHeight: settings.elementLineHeight.h4
              }} className="mb-1 truncate">
                Madagascar 70%
              </h4>
              <p style={{
                fontFamily: `${settings.bodyFont.family}, ${settings.bodyFont.fallback}`,
                fontSize: '9px',
                fontWeight: settings.elementWeights.body,
                letterSpacing: settings.elementLetterSpacing.body
              }} className="text-gray-500 dark:text-gray-400 text-[9px] mb-2">
                Egzotik meyvemsi
              </p>
              <div className="flex items-center justify-between">
                <span style={{
                  fontSize: '10px',
                  fontWeight: settings.elementWeights.body
                }} className="font-bold">₺399</span>
                <button className="w-5 h-5 bg-gold text-white rounded-full text-[10px]">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Footer */}
      <div className="bg-mocha-900 dark:bg-black px-4 py-3 text-center">
        <p style={{
          fontFamily: `${settings.bodyFont.family}, ${settings.bodyFont.fallback}`,
          fontSize: '9px',
          fontWeight: settings.elementWeights.body
        }} className="text-white/70">
          © 2024 Sade Chocolate. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
};
