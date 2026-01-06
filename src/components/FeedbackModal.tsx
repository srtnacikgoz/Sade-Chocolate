import React, { useState } from 'react';
import { X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { Input } from './ui/Input';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'suggestion' as 'suggestion' | 'complaint' | 'request' | 'other',
    message: ''
  });

  const feedbackTypes = [
    { value: 'suggestion', label: 'Öneri' },
    { value: 'complaint', label: 'Şikayet' },
    { value: 'request', label: 'İstek' },
    { value: 'other', label: 'Diğer' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      toast.error('Lütfen mesajınızı yazın.');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData = {
        ...formData,
        userId: auth.currentUser?.uid || null,
        createdAt: serverTimestamp(),
        status: 'new'
      };

      await addDoc(collection(db, 'feedback'), feedbackData);

      toast.success('Geri bildiriminiz alındı! Teşekkür ederiz. 🙏');

      // Reset form and close
      setFormData({ name: '', email: '', type: 'suggestion', message: '' });
      onClose();
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brown-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-900 w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 rounded-[40px] animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative px-10 pt-10 pb-6 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-dark-800"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gold/10 dark:bg-gold/20 flex items-center justify-center rounded-2xl">
              <MessageSquare size={28} className="text-gold" />
            </div>
            <div>
              <h3 className="font-display text-4xl font-bold dark:text-white italic uppercase tracking-tighter">
                Geri Bildirim
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Fikirleriniz bizim için değerli
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ADINIZ (Opsiyonel)"
              placeholder="Can Yılmaz"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="E-POSTA (Opsiyonel)"
              type="email"
              placeholder="can@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Feedback Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              GERİ BİLDİRİM TÜRÜ
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {feedbackTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                  className={`h-14 px-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === type.value
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              MESAJINIZ *
            </label>
            <textarea
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              placeholder="Düşüncelerinizi bizimle paylaşın..."
              rows={6}
              required
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-gold dark:focus:border-gold focus:outline-none transition-all resize-none"
            />
            <p className="text-[9px] text-gray-400 ml-2">
              * Zorunlu alan
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.message.trim()}
            className="w-full h-20 rounded-[30px] bg-brown-900 dark:bg-gold text-white dark:text-black font-black text-[11px] tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                GÖNDERİLİYOR...
              </>
            ) : (
              <>
                <Send size={18} />
                GERİ BİLDİRİMİ GÖNDER
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
