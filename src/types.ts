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

export interface BoxItem {
  id: string;
  name: string;
  description: string;
  image: string;
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

export interface Product {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  price: number;
  currency: string;
  image: string;
  alternateImage?: string; // Hover için alternatif görsel
  category: string;
  tags?: string[];
  badge?: string;
  isOutOfStock?: boolean;
  video?: string;
  origin?: string;
  
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
  boxItems?: BoxItem[];
  locationStock?: {
    yesilbahce: number;
  };
  tastingNotes?: string;
  ingredients?: string;
  allergens?: string;
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