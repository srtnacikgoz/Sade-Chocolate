/**
 * Web Font Seed Data
 * Tipografi yönetimi için varsayılan web fontları
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { WebFont } from '../types';

export const DEFAULT_WEB_FONTS: WebFont[] = [
  // Custom Fonts
  {
    id: 'santana',
    family: 'Santana',
    source: 'custom',
    category: 'serif',
    weights: [400, 700],
    fallback: 'Cormorant Garamond, Georgia, serif',
    isActive: true,
    order: 1
  },

  // Google Fonts - Sans-serif
  {
    id: 'inter',
    family: 'Inter',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 10
  },
  {
    id: 'roboto',
    family: 'Roboto',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 500, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 11
  },
  {
    id: 'open-sans',
    family: 'Open Sans',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 12
  },
  {
    id: 'lato',
    family: 'Lato',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 700, 900],
    fallback: 'sans-serif',
    isActive: true,
    order: 13
  },
  {
    id: 'montserrat',
    family: 'Montserrat',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 14
  },
  {
    id: 'poppins',
    family: 'Poppins',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 15
  },
  {
    id: 'raleway',
    family: 'Raleway',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 16
  },
  {
    id: 'nunito',
    family: 'Nunito',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 17
  },
  {
    id: 'work-sans',
    family: 'Work Sans',
    source: 'google',
    category: 'sans-serif',
    weights: [300, 400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 18
  },
  {
    id: 'dm-sans',
    family: 'DM Sans',
    source: 'google',
    category: 'sans-serif',
    weights: [400, 500, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 19
  },
  {
    id: 'plus-jakarta-sans',
    family: 'Plus Jakarta Sans',
    source: 'google',
    category: 'sans-serif',
    weights: [400, 600, 700],
    fallback: 'sans-serif',
    isActive: true,
    order: 20
  },

  // Google Fonts - Serif
  {
    id: 'playfair-display',
    family: 'Playfair Display',
    source: 'google',
    category: 'display',
    weights: [400, 700],
    fallback: 'serif',
    isActive: true,
    order: 30
  },
  {
    id: 'merriweather',
    family: 'Merriweather',
    source: 'google',
    category: 'serif',
    weights: [300, 400, 700],
    fallback: 'serif',
    isActive: true,
    order: 31
  },
  {
    id: 'cormorant',
    family: 'Cormorant',
    source: 'google',
    category: 'serif',
    weights: [300, 400, 600, 700],
    fallback: 'serif',
    isActive: true,
    order: 32
  },
  {
    id: 'crimson-text',
    family: 'Crimson Text',
    source: 'google',
    category: 'serif',
    weights: [400, 600, 700],
    fallback: 'serif',
    isActive: true,
    order: 33
  },
  {
    id: 'lora',
    family: 'Lora',
    source: 'google',
    category: 'serif',
    weights: [400, 600, 700],
    fallback: 'serif',
    isActive: true,
    order: 34
  },
  {
    id: 'source-serif-pro',
    family: 'Source Serif Pro',
    source: 'google',
    category: 'serif',
    weights: [400, 600, 700],
    fallback: 'serif',
    isActive: true,
    order: 35
  },

  // System Fonts
  {
    id: 'arial',
    family: 'Arial',
    source: 'system',
    category: 'sans-serif',
    fallback: 'sans-serif',
    isActive: true,
    order: 40
  },
  {
    id: 'helvetica',
    family: 'Helvetica',
    source: 'system',
    category: 'sans-serif',
    fallback: 'sans-serif',
    isActive: true,
    order: 41
  },
  {
    id: 'times-new-roman',
    family: 'Times New Roman',
    source: 'system',
    category: 'serif',
    fallback: 'serif',
    isActive: true,
    order: 42
  },
  {
    id: 'georgia',
    family: 'Georgia',
    source: 'system',
    category: 'serif',
    fallback: 'serif',
    isActive: true,
    order: 43
  },
  {
    id: 'verdana',
    family: 'Verdana',
    source: 'system',
    category: 'sans-serif',
    fallback: 'sans-serif',
    isActive: true,
    order: 44
  },
  {
    id: 'trebuchet-ms',
    family: 'Trebuchet MS',
    source: 'system',
    category: 'sans-serif',
    fallback: 'sans-serif',
    isActive: true,
    order: 45
  },
  {
    id: 'gill-sans',
    family: 'Gill Sans',
    source: 'system',
    category: 'sans-serif',
    fallback: 'sans-serif',
    isActive: true,
    order: 46
  },
  {
    id: 'courier-new',
    family: 'Courier New',
    source: 'system',
    category: 'monospace',
    fallback: 'monospace',
    isActive: true,
    order: 47
  },
  {
    id: 'serif',
    family: 'serif',
    source: 'system',
    category: 'serif',
    fallback: 'serif',
    isActive: true,
    order: 48
  },
  {
    id: 'sans-serif',
    family: 'sans-serif',
    source: 'system',
    category: 'sans-serif',
    fallback: 'sans-serif',
    isActive: true,
    order: 49
  },
  {
    id: 'monospace',
    family: 'monospace',
    source: 'system',
    category: 'monospace',
    fallback: 'monospace',
    isActive: true,
    order: 50
  },
];

/**
 * Firestore'a varsayılan web fontlarını yükle
 */
export const seedWebFonts = async () => {
  try {
    await setDoc(doc(db, 'site_settings', 'web_fonts'), {
      fonts: DEFAULT_WEB_FONTS,
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    });
    console.log('✅ Web fonts seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding web fonts:', error);
    return false;
  }
};
