export enum ViewMode {
  GRID = 'grid',
  LIST = 'list',
  LIST_QTY = 'list-qty'
}

export interface ProductVariant {
  id: string;
  size: string; 
  price: number;
  stock: number;
  sku: string;
}

// @deprecated - YENİ SİSTEM: Bonbonlar artık Product olarak yönetiliyor
// Migration sonrası silinecek
export interface BoxItem {
  id: string;
  name: string;
  description: string;
  image: string;
  // Dandelion tarzı zengin içerik alanları
  percentage?: number;      // Kakao yüzdesi (70, 85 vb.)
  origin?: string;          // Menşei ("India", "Tanzania" vb.)
  tastingNotes?: string[];  // Tadım notları ["kumquat", "hojicha milk tea"]
}

export interface ProductBadge {
  id: string;
  name: {
    tr: string;
    en: string;
    ru: string;
  };
  bgColor: string;
  textColor: string;
  icon?: string;
  active: boolean;
  priority: number; // Düşük numara = yüksek öncelik
  createdAt?: any;
}

// Ürün Tipi: Tablet vs Diğer (Dandelion tarzı ayrım)
export type ProductType = 'tablet' | 'filled' | 'box' | 'other';

export interface Product {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  price: number;
  currency: string;
  image: string;
  alternateImage?: string; // Hover için alternatif görsel
  images?: string[];       // Çoklu ürün görselleri (Dandelion tarzı galeri)
  category: string;
  tags?: string[];
  badge?: string;
  isOutOfStock?: boolean;
  video?: string;
  origin?: string;

  // 📊 STOK YÖNETİMİ (SaaS-Dostu)
  stock?: number;                    // Mevcut stok adedi
  minStock?: number;                 // Minimum stok eşiği (varsayılan: 5)
  stockAlertEnabled?: boolean;       // Bu ürün için stok uyarısı aktif mi?
  lastStockAlertAt?: string;         // Son stok uyarısı zamanı (ISO string)

  // Ürün tipi: tablet (Dandelion layout) vs filled/other (mevcut layout)
  productType?: ProductType;
  
  // ✅ Läderach Stil Dinamik Alanlar
  showSensory: boolean; // Duyusal profil aktif/pasif
  attributes: string[]; // ['Sütlü', 'Kuruyemişli'] vb.
  nutritionalValues?: string; // Besin değerleri metni

  sensory: {
    intensity: number;
    sweetness: number;
    creaminess: number;
    fruitiness: number;
    acidity: number;
    crunch: number;
  };
  variants?: ProductVariant[];
  boxItems?: BoxItem[];  // @deprecated - Yeni sistemde boxContentIds kullan
  locationStock?: {
    yesilbahce: number;
  };
  tastingNotes?: string;
  ingredients?: string;
  allergens?: string;

  // 🎁 YENİ KUTU İÇERİĞİ SİSTEMİ (Marcolini Stil)
  isBoxContent?: boolean;     // Bu ürün kutu içeriği olarak seçilebilir mi?
  boxContentIds?: string[];   // Kutunun içindeki bonbon Product ID'leri (aynı ID tekrar edebilir)
  boxSize?: number;           // Kutu kapasitesi (6, 9, 12, 16, vb.)

  // 👁️ KATALOG GÖRÜNÜRLÜĞÜ
  isVisibleInCatalog?: boolean; // false ise katalogda gösterilmez (varsayılan: true)

  // 📦 KARGO BİLGİLERİ
  weight?: number;              // Ürün ağırlığı (gram)
  dimensions?: {
    length: number;             // Uzunluk (cm)
    width: number;              // Genişlik (cm)
    height: number;             // Yükseklik (cm)
  };
  // Desi otomatik hesaplanır: (U × G × Y) / 3000

  // 📊 KATALOG SIRALAMA
  sortOrder?: number;           // Manuel sıralama için (düşük = önce)
}
export interface GiftOptions {
  isGift: boolean;
  recipientName: string;
  message: string;
  fontFamily: 'classic' | 'modern' | 'handwriting';
  includeCard: boolean;
  hidePrice: boolean; // "Zero Friction" gönderim için
}

export interface CartItem extends Product {
  selectedVariant?: ProductVariant;
  quantity: number;
  giftOptions?: GiftOptions; // Ürün bazlı hediye seçeneği
}

// AI Sommelier Hediye Notu Şablonları
export interface GiftNoteTemplate {
  id: string;
  emotion: 'love' | 'gratitude' | 'celebration';
  emotionLabel: {
    tr: string;
    en: string;
  };
  personas: {
    minimalist: string;
    poetic: string;
    sensual: string;
  };
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Şirket Künyesi - Şube Bilgileri
export interface Branch {
  id: string;
  name: string;
  address: string;
  district: string;     // Muratpaşa, Konyaaltı vb.
  city: string;         // Antalya
  phone: string;
  whatsapp?: string;
  email?: string;
  mapLink: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  workingHours: {
    weekdays: string;   // "09:00 - 21:00"
    saturday: string;
    sunday: string;
  };
  isActive: boolean;
  isPrimary?: boolean;  // Ana şube mi?
}

// Banka Hesap Bilgisi
export interface BankAccount {
  id: string;
  bankName: string;        // Ziraat Bankası, Garanti, vb.
  accountHolder: string;   // Hesap sahibi adı
  iban: string;            // TR...
  currency: 'TRY' | 'USD' | 'EUR';
  isActive: boolean;
}

// Havale/EFT Ödeme Ayarları
export interface BankTransferSettings {
  isEnabled: boolean;           // Havale/EFT aktif mi?
  discountPercent: number;      // İndirim oranı (varsayılan %2)
  paymentDeadlineHours: number; // Ödeme süresi (varsayılan 12 saat)
  autoCancel: boolean;          // Süre dolunca otomatik iptal?
  minOrderAmount?: number;      // Minimum sipariş tutarı (opsiyonel)
}

export interface CompanyInfo {
  id: string;
  // Genel Bilgiler
  companyName: string;
  brandName: string;
  slogan?: string;
  foundedYear: number;
  founderName: string;

  // İletişim
  generalEmail: string;
  supportEmail?: string;
  generalPhone: string;
  whatsappBusiness?: string;

  // Sosyal Medya
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };

  // Şubeler
  branches: Branch[];

  // Banka Hesapları
  bankAccounts?: BankAccount[];

  // Havale/EFT Ayarları
  bankTransferSettings?: BankTransferSettings;

  // Yasal Bilgiler
  taxOffice?: string;
  taxNumber?: string;
  tradeRegisterNo?: string;
  mersisNo?: string;

  updatedAt?: string;
  updatedBy?: string;
}

// Kutu Boyutu Yapılandırması
export interface BoxSizeOption {
  id: string;
  size: number;           // 4, 8, 16, 25 vb.
  label: string;          // "4'lü Kutu"
  description: string;    // "Deneme paketi"
  basePrice: number;      // Kutu maliyeti (bonbon fiyatlarına eklenir)
  enabled: boolean;       // Aktif/Pasif
  gridCols: number;       // Grid sütun sayısı (görsel için)
  gridRows: number;       // Grid satır sayısı
}

// Kendi Kutunu Oluştur Yapılandırması
export interface BoxConfig {
  id: string;
  enabled: boolean;               // Özellik aktif mi?

  // Kart Görünümü
  cardTitle: string;              // "Kendi Kutunu Oluştur"
  cardSubtitle: string;           // "Favori bonbonlarını seç"
  cardDescription: string;        // Uzun açıklama
  cardImage?: string;             // Özel görsel (yoksa ikon gösterilir)
  ctaText: string;                // "Kutuya Git" / "Başla"

  // Modal Görünümü
  modalTitle: string;             // Modal başlığı
  modalSubtitle: string;          // Modal alt başlığı

  // Kutu Boyutları
  boxSizes: BoxSizeOption[];

  updatedAt?: string;
  updatedBy?: string;
}

// Hazır Bonbon Kutuları Preset Sistemi
export interface BoxPreset {
  id: string;
  name: string;                    // "Meyvemsi Seçki"
  description: string;             // "Yaz meyvelerinin tatlı notaları"
  boxSize: number;                 // 8 - Kutu kapasitesi
  productIds: string[];            // Önceden seçilmiş bonbon ID'leri
  image?: string;                  // Preset görseli (opsiyonel)
  enabled: boolean;                // Aktif/Pasif
  sortOrder: number;               // Sıralama önceliği
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Typography (Font) Ayarları
export type FontSource = 'google' | 'custom' | 'system';

export interface FontConfig {
  family: string;          // "Inter", "Santana", vb.
  source: FontSource;      // Google Fonts, Custom Upload, veya System
  weights: number[];       // [300, 400, 600, 700]
  url?: string;           // Custom font URL (Firebase Storage)
  fallback?: string;      // Yedek font
}

// Responsive font size değeri
export interface ResponsiveFontSize {
  desktop: string;             // Desktop (lg+) - "72px", "4.5rem"
  tablet: string;              // Tablet (md) - "56px", "3.5rem"
  mobile: string;              // Mobile (sm) - "40px", "2.5rem"
}

// Font Preset (Hazır kombinasyon)
export interface FontPreset {
  id: string;
  name: string;
  description: string;
  headingFont: string;         // Font family adı
  bodyFont: string;
  displayFont: string;
  buttonFont: string;
  navFont: string;
}

export interface TypographySettings {
  id: string;

  // Başlık Fontları (Her seviye için ayrı)
  h1Font: FontConfig;          // H1 başlıklar
  h2Font: FontConfig;          // H2 başlıklar
  h3Font: FontConfig;          // H3 başlıklar
  h4Font: FontConfig;          // H4 başlıklar

  // Diğer Fontlar
  bodyFont: FontConfig;        // Normal metinler
  displayFont: FontConfig;     // Özel başlıklar (italic vb.)
  logoFont: FontConfig;        // Header logo
  signatureFont?: FontConfig;  // İmza fontu (opsiyonel, yoksa H1 kullanılır)
  buttonFont: FontConfig;      // Butonlar
  navFont: FontConfig;         // Navigation/Menu
  labelFont: FontConfig;       // Form labels
  captionFont: FontConfig;     // Küçük metinler

  // Font Ölçekleri (Responsive)
  fontSize: {
    h1: ResponsiveFontSize;
    h2: ResponsiveFontSize;
    h3: ResponsiveFontSize;
    h4: ResponsiveFontSize;
    h5: ResponsiveFontSize;
    h6: ResponsiveFontSize;
    body: ResponsiveFontSize;
    small: ResponsiveFontSize;
    tiny: ResponsiveFontSize;
    button: ResponsiveFontSize;
  };

  // Font Weights (Global presets)
  fontWeight: {
    thin: number;              // 100
    light: number;             // 300
    normal: number;            // 400
    medium: number;            // 500
    semibold: number;          // 600
    bold: number;              // 700
    black: number;             // 900
  };

  // Element-specific weights
  elementWeights: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    button: number;
    nav: number;
    label: number;
  };

  // Tipografi Ayarları (Global presets)
  letterSpacing: {
    tight: string;             // -0.05em
    normal: string;            // 0
    wide: string;              // 0.05em
    wider: string;             // 0.1em
    widest: string;            // 0.2em
  };

  // Element-specific letter spacing
  elementLetterSpacing: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    body: string;
    button: string;
    nav: string;
  };

  lineHeight: {
    tight: number;             // 1.25
    normal: number;            // 1.5
    relaxed: number;           // 1.75
    loose: number;             // 2
  };

  // Element-specific line height
  elementLineHeight: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    body: number;
    button: number;
  };

  // Hover Renkleri
  hoverColors: {
    primary: string;           // Ana hover rengi (varsayılan: gold)
    secondary: string;         // İkincil hover rengi (varsayılan: gray-900)
    accent: string;            // Vurgu rengi
  };

  updatedAt?: string;
  updatedBy?: string;
}

// Newsletter Email Template Yapılandırması
export interface NewsletterTemplate {
  id: string;

  // Logo Customization
  logoImageUrl?: string;          // Logo görseli URL (varsayılan: "/kakaologo.png")
  logoShowImage?: boolean;        // Logo görselini göster (varsayılan: true)
  logoImageSize?: number;         // Logo görsel boyutu px (varsayılan: 60)
  logoColor?: string;             // Logo rengi (hex) (varsayılan: "#C5A059" - gold)
  logoSadeText?: string;          // "SADE" metni (varsayılan: "SADE")
  logoChocolateText?: string;     // "Chocolate" metni (varsayılan: "Chocolate")
  logoSadeFont?: string;          // SADE font (varsayılan: "Santana")
  logoChocolateFont?: string;     // Chocolate font (varsayılan: "Santana")
  logoSadeSize?: number;          // SADE boyutu (varsayılan: 28)
  logoChocolateSize?: number;     // Chocolate boyutu (varsayılan: 11)

  // Header
  headerBadge: string;           // "✦ Hoş Geldin ✦"

  // Main Content
  mainTitle: string;             // "Artisan Çikolata\nDünyasına Adım Attın"
  welcomeText: string;           // Alt açıklama metni

  // Discount Section
  discountEnabled: boolean;      // İndirim gösterilsin mi?
  discountLabel: string;         // "İlk Siparişine Özel"
  discountPercent: number;       // 10
  discountCode: string;          // "HOSGELDIN10"

  // Benefits (2 sütun)
  benefit1Title: string;         // "Koleksiyonlar"
  benefit1Text: string;          // Açıklama
  benefit2Title: string;         // "Ayrıcalıklar"
  benefit2Text: string;          // Açıklama

  // CTA Button
  ctaText: string;               // "Koleksiyonu Keşfet"
  ctaUrl: string;                // "https://sadechocolate.com/catalog"

  // Email Subject
  emailSubject: string;          // "Hoş Geldin — İlk Siparişine %10 İndirim"

  // Styling (opsiyonel - varsayılanlar kullanılabilir)
  colors?: {
    headerBg: string;            // "#4B3832"
    bodyBg: string;              // "#FDFCF8"
    outerBg: string;             // "#E8E4DC"
    accent: string;              // "#C5A059" (gold)
    textPrimary: string;         // "#4B3832"
    textSecondary: string;       // "#666666"
  };

  // Tipografi (opsiyonel - varsayılanlar kullanılabilir)
  typography?: {
    headingFont: string;         // "Georgia, serif"
    bodyFont: string;            // "Arial, sans-serif"
    headingSize: number;         // 32
    bodySize: number;            // 15
    lineHeight: number;          // 1.8
  };

  updatedAt?: any;
  updatedBy?: string;
}

// Font Yönetimi
export interface EmailFont {
  id: string;
  value: string;              // "Georgia, serif"
  label: string;              // "Georgia (Serif - Klasik)"
  category: 'serif' | 'sans-serif' | 'cursive' | 'monospace';
  isActive?: boolean;         // Aktif/Pasif
  order?: number;             // Sıralama
}

export interface FontSettings {
  fonts: EmailFont[];
  updatedAt?: any;
  updatedBy?: string;
}

// Web Font Yönetimi (Tipografi için)
export interface WebFont {
  id: string;
  family: string;              // "Inter", "Santana", "Georgia"
  source: 'google' | 'custom' | 'system';
  category: 'serif' | 'sans-serif' | 'display' | 'monospace';
  weights?: number[];          // [300, 400, 600, 700]
  fallback?: string;           // "sans-serif", "serif"
  url?: string;                // Custom font URL (Firebase Storage)
  isActive?: boolean;
  order?: number;
}

export interface WebFontSettings {
  fonts: WebFont[];
  updatedAt?: any;
  updatedBy?: string;
}

// Değerlendirme (Review) Sistemi
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type Review = {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  token: string;
  status: ReviewStatus;
  createdAt: any;
  updatedAt: any;
};