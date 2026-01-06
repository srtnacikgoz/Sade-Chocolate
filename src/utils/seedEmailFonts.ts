/**
 * Email Font Seed Data
 * İlk kurulumda veya reset işleminde Firestore'a yüklenecek varsayılan fontlar
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { EmailFont } from '../types';

export const DEFAULT_EMAIL_FONTS: EmailFont[] = [
  // Serif Fonts
  { id: 'georgia', value: 'Georgia, serif', label: 'Georgia (Serif - Klasik)', category: 'serif', isActive: true, order: 1 },
  { id: 'times', value: 'Times New Roman, serif', label: 'Times New Roman (Serif - Geleneksel)', category: 'serif', isActive: true, order: 2 },
  { id: 'palatino', value: 'Palatino, serif', label: 'Palatino (Serif - Zarif)', category: 'serif', isActive: true, order: 3 },
  { id: 'garamond', value: 'Garamond, serif', label: 'Garamond (Serif - İnce)', category: 'serif', isActive: true, order: 4 },
  { id: 'baskerville', value: 'Baskerville, serif', label: 'Baskerville (Serif - Lüks)', category: 'serif', isActive: true, order: 5 },
  { id: 'book-antiqua', value: 'Book Antiqua, serif', label: 'Book Antiqua (Serif - Kitap)', category: 'serif', isActive: true, order: 6 },

  // Sans-serif Fonts
  { id: 'arial', value: 'Arial, sans-serif', label: 'Arial (Sans - Modern)', category: 'sans-serif', isActive: true, order: 10 },
  { id: 'helvetica', value: 'Helvetica, sans-serif', label: 'Helvetica (Sans - Minimalist)', category: 'sans-serif', isActive: true, order: 11 },
  { id: 'verdana', value: 'Verdana, sans-serif', label: 'Verdana (Sans - Okunabilir)', category: 'sans-serif', isActive: true, order: 12 },
  { id: 'trebuchet', value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS (Sans - Yuvarlak)', category: 'sans-serif', isActive: true, order: 13 },
  { id: 'tahoma', value: 'Tahoma, sans-serif', label: 'Tahoma (Sans - Net)', category: 'sans-serif', isActive: true, order: 14 },
  { id: 'century-gothic', value: 'Century Gothic, sans-serif', label: 'Century Gothic (Sans - Geometrik)', category: 'sans-serif', isActive: true, order: 15 },
  { id: 'calibri', value: 'Calibri, sans-serif', label: 'Calibri (Sans - Yumuşak)', category: 'sans-serif', isActive: true, order: 16 },
  { id: 'franklin-gothic', value: 'Franklin Gothic Medium, sans-serif', label: 'Franklin Gothic (Sans - Kalın)', category: 'sans-serif', isActive: true, order: 17 },

  // El Yazısı / Cursive Fonts
  { id: 'brush-script', value: 'Brush Script MT, cursive', label: '✍️ Brush Script (El Yazısı - Fırça)', category: 'cursive', isActive: true, order: 20 },
  { id: 'lucida-handwriting', value: 'Lucida Handwriting, cursive', label: '✍️ Lucida Handwriting (El Yazısı - Zarif)', category: 'cursive', isActive: true, order: 21 },
  { id: 'bradley-hand', value: 'Bradley Hand, cursive', label: '✍️ Bradley Hand (El Yazısı - Samimi)', category: 'cursive', isActive: true, order: 22 },
  { id: 'comic-sans', value: 'Comic Sans MS, cursive', label: '✍️ Comic Sans (El Yazısı - Rahat)', category: 'cursive', isActive: true, order: 23 },
  { id: 'freestyle-script', value: 'Freestyle Script, cursive', label: '✍️ Freestyle Script (El Yazısı - Akıcı)', category: 'cursive', isActive: true, order: 24 },

  // Monospace Fonts
  { id: 'courier', value: 'Courier New, monospace', label: 'Courier New (Monospace - Daktilo)', category: 'monospace', isActive: true, order: 30 },
  { id: 'monaco', value: 'Monaco, monospace', label: 'Monaco (Monospace - Kod)', category: 'monospace', isActive: true, order: 31 },
  { id: 'consolas', value: 'Consolas, monospace', label: 'Consolas (Monospace - Modern)', category: 'monospace', isActive: true, order: 32 },
];

/**
 * Firestore'a varsayılan fontları yükle
 */
export const seedEmailFonts = async () => {
  try {
    await setDoc(doc(db, 'email_settings', 'fonts'), {
      fonts: DEFAULT_EMAIL_FONTS,
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    });
    console.log('✅ Email fonts seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding email fonts:', error);
    return false;
  }
};
