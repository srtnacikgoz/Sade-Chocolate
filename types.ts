export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  video?: string; // URL for the looping video
  category: 'tablet' | 'truffle' | 'gift-box' | 'other';
  badge?: 'New' | 'Sale' | string;
  originalPrice?: number;
  detailedDescription?: string;
  origin?: string;
  tastingNotes?: string;
  tags?: string[];
  ingredients?: string;
  allergens?: string;
  isOutOfStock?: boolean;
  sensory?: {
    intensity?: number; // 0-100
    sweetness?: number; // 0-100
    creaminess?: number; // 0-100
    fruitiness?: number; // 0-100
    acidity?: number;   // 0-100
    crunch?: number;    // 0-100
  };
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  LIST_QTY = 'LIST_QTY'
}