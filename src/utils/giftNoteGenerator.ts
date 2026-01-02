import { Product, GiftNoteTemplate } from '../types';
import { giftNoteTemplates, Emotion, Persona } from '../constants/giftNoteTemplates';

// Tadım notlarını "ahududu, nane ve paçuli" gibi daha okunaklı bir formata getiren yardımcı fonksiyon.
const formatTastingNotes = (notes: string | undefined): string => {
  if (!notes) return 'eşsiz';
  const notesArray = notes.split(',').map(n => n.trim());
  if (notesArray.length > 1) {
    const last = notesArray.pop();
    return `${notesArray.join(', ')} ve ${last}`;
  }
  return notesArray[0] || 'belirgin';
};

// Orijinal fonksiyon (fallback olarak kullanılır)
export const generateGiftNotes = (product: Product | undefined, emotion: Emotion): Record<Persona, string> => {
  const templates = giftNoteTemplates[emotion];
  const personalizedNotes: Partial<Record<Persona, string>> = {};

  if (!product) {
    return templates as Record<Persona, string>;
  }

  for (const persona in templates) {
    let note = templates[persona as Persona];

    // Yer tutucuları ürün verileriyle doldur
    note = note.replace(/\[ürün_adı\]/g, product.title);
    note = note.replace(/\[köken\]/g, product.origin || 'Artisan');
    note = note.replace(/\[tadım_notları\]/g, formatTastingNotes(product.tastingNotes));

    personalizedNotes[persona as Persona] = note;
  }

  return personalizedNotes as Record<Persona, string>;
};

// Firebase şablonlarını kullanarak not üreten yeni fonksiyon
export const generateGiftNotesFromFirebase = (
  product: Product | undefined,
  template: GiftNoteTemplate
): Record<Persona, string> => {
  const personalizedNotes: Partial<Record<Persona, string>> = {};

  if (!product) {
    return template.personas as Record<Persona, string>;
  }

  for (const persona in template.personas) {
    let note = template.personas[persona as Persona];

    // Yer tutucuları ürün verileriyle doldur
    note = note.replace(/\[ürün_adı\]/g, product.title);
    note = note.replace(/\[köken\]/g, product.origin || 'Artisan');
    note = note.replace(/\[tadım_notları\]/g, formatTastingNotes(product.tastingNotes));

    personalizedNotes[persona as Persona] = note;
  }

  return personalizedNotes as Record<Persona, string>;
};
