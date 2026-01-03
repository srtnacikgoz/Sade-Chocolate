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