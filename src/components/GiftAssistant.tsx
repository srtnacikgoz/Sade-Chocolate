import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';

interface GiftAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  content: string | ChatResponse;
}

interface ChatResponse {
  type: 'question' | 'recommendation' | 'success';
  text?: string;
  options?: string[];
  product_id?: string; // ✅ Gerçek ürün ID'si için
  product_name?: string;
  reason?: string;
  price?: string;
}

const IMAGE_MAP: Record<string, string> = {
  'ruby_tablet': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC3lWEV-WeRIfV4nzWK9bZ664ajoZ3eoDrtplgj2yNtEqgt7uu24jic9ClBvVsFOl-uBxe--L0jb5gPV5u2OTOc3ACorl0AQ_X5WtS1wX-lozSBj48E4gJgnNkdv_4f3ALQdlEiZTTNVbzRyJ5z6RArRH9SQSQFvwa3ogJn3DvGmCyIYUBfZ79ShH_U-gN27aEEvZDByzZwPGvkCPKXAAh5D74yzZS_KmxOR-DVFhr5peRmZOIX1iTLjU1D2gW_QViRlgqON2qaCc',
  'gold_tablet': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjqOhvBngusto_92lMYI2KMz2NI9K7yatgV4HiHOZh1oqb0pkdBpagfgHulKLVbSrMUYws4KtZoLXn6LZWQarXSXc_J4UYz1jWKKHhpZsK6jtBaZVZ8OdmvlFCZhnSSJfLQh_Q-ydYBeBtFgMTTgrSfagxRNEhK7uz6-oNw_Mq2tlCmHCOCiR97SwVA9ntohNUpk1D2fDJnRSEJ718hpgDZeYEiKhHVEfAhCAVYYTiQDGo4k8VqxgBn2u6DQehNwIlMq6CbNl987c',
  'bitter_tablet': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJnyCfUriN68tho5hC9VWjKb1kfNt1Kj8FOxRvN3SCkQiPBp0jvU7K3bGdKme7SAAmnGXhTt_pWaI2qOjjoyx0mQBxfMtT3rRjgss7YzIRyIEj6E0sJHGApBsoWHU11-xUZMaKcMOHgT1PPBL-64eQPkjQhJIE3-oDa-m4QYyK-gZZPCquLTIsu5OaFS9DWXAiQezNGwGRzLIywDN8eJ6w3c9X6m2i5n7SZOJDt1zMcF7nyZcDv5wMNSsok42LQ2zSKsHIrjq6vDs',
  'milk_tablet': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqwXB7Y_gNcfsgG4MCYzUA6Xz4ZdAfaOVKfW5YPKKAHRIm4H3X159xE92MdqDa0jMpXy5Z2lE-rh0tr763aFEaD5PitL2ACsBIdBH0LMXrjkFbQuoPMKwQ659VVAhqs_zCEgi2mCHLCnXICSBP_Oaq-0NSjlXH2RWB82h-Law3czOU5AbRzU-eWZR78fm3TWZJ1LKxp7uaV-Nsn4WSDeYDCUsT5QmHZUr0Matr2mIQiYR2EmqkxFHnUWa2gSb9MtJxGlPtZr3QSxQ',
  'mixed_box': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZczwKf5voGVSZ7Ysr3Mi6zR_p7ZiwwS06oIjdi_NS1FBV5mNJrZydaIQY4p3zdJABhzonyJx3hBP_jsYC_MKAmsWH2XYEjNr-HK-Bd19b3uhvT_zuhO5R6bw4xF7MePdhW6zIYskcHEB2HzG4FA7eMSK9K8Tj4QTlEvFOjWUWHu7NV36TfBrS_t-ubgL7zqH-uRNINJviAJxVMCUz3CWa1ESfajTarCel5KmcrWu6_PygICbM0_knskpk2lBY-7N5ygj-lsHuA38',
  'velvet': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC3lWEV-WeRIfV4nzWK9bZ664ajoZ3eoDrtplgj2yNtEqgt7uu24jic9ClBvVsFOl-uBxe--L0jb5gPV5u2OTOc3ACorl0AQ_X5WtS1wX-lozSBj48E4gJgnNkdv_4f3ALQdlEiZTTNVbzRyJ5z6RArRH9SQSQFvwa3ogJn3DvGmCyIYUBfZ79ShH_U-gN27aEEvZDByzZwPGvkCPKXAAh5D74yzZS_KmxOR-DVFhr5peRmZOIX1iTLjU1D2gW_QViRlgqON2qaCc',
  'truffle_box': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP8SQLCG9bzwUDPvoC3mI9tIZufuHAmdwk_8jWe-2WwKpQuxgE-zgtT9BozBEWa0DG7sAOeTL3LKamJUYsJWJjLnowwYNWJlC379NA7qUBdCBNAfJNiWlL9BNcES92n78F5h16LGyRqJW_e8htTmf2Kk7LSKNsw_H8AI_gGCf8N0v--hFqsAdMl3SliSrubmfDPcAej4h8zn1Wx5SIreep1jZgm6p6jvXF5ER022v-2Q0VXvW0K3mvt1kXbcbwNZLY7kKFg1wEQY'
};

const getSystemInstruction = (language: string, inventory: Product[]) => {
  const productList = inventory.map(p => 
    `- ID: ${p.id}, İsim: ${p.title}, Fiyat: ${p.price}${p.currency}, 
      Profil: Yoğunluk %${p.sensory?.intensity}, Tatlılık %${p.sensory?.sweetness}, 
      Asidite %${p.sensory?.acidity}, Çıtırlık %${p.sensory?.crunch}`
  ).join('\n');

  return `Siz "Sade Chocolate" Sommelierisiniz. 
  Elinizdeki Güncel Envanter:
  ${productList}

  GÖREV: Kullanıcı tercihlerine göre envanterdeki en uygun Ürün ID'sini belirleyin.
  YANIT FORMATI: Sadece JSON. 
  Örn: {"type": "recommendation", "product_id": "gercek-id-buraya", "product_name": "...", "reason": "...", "price": "..."}`;
};

export const GiftAssistant: React.FC<GiftAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart, setIsCartOpen } = useCart();
  const { t, language } = useLanguage();
  const { products: allProducts } = useProducts();
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Initialize Chat
  useEffect(() => {
    if (isOpen) {
      // Reset chat on open to ensure language freshness or just start fresh
      setMessages([]);
      startChat();
    }
  }, [isOpen, language]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startChat = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = getSystemInstruction(language, allProducts);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Start the conversation.",
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json"
        }
      });
      
      const responseText = response.text;
      if (responseText) {
          const content = JSON.parse(responseText) as ChatResponse;
          setMessages([{ role: 'model', content }]);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      setMessages([{ role: 'model', content: { type: 'question', text: 'Connection error. Please try again later.', options: [] } }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    // Add user message locally
    const newMessages: Message[] = [...messages, { role: 'user', content: option }];
    setMessages(newMessages);
    setLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = getSystemInstruction(language);

        // Construct history for the API
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
            },
            history: newMessages.slice(0, -1).map(m => ({
                role: m.role,
                parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
            }))
        });

        const result = await chat.sendMessage({ message: option });
        const responseText = result.text;
        
        if (responseText) {
            const content = JSON.parse(responseText) as ChatResponse;
            setMessages(prev => [...prev, { role: 'model', content }]);
        }

    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        setLoading(false);
    }
  };

const handleAddToCart = (response: ChatResponse) => {
    const realProduct = allProducts.find(p => p.id === response.product_id);
    if (realProduct) {
        addToCart(realProduct);
        setMessages(prev => [...prev, { 
          role: 'model', 
          content: { 
              type: 'success', 
              text: language === 'tr' ? 'Harika seçim! Ürün sepetinize eklendi. 🎁' : 'Great choice! Added to your cart. 🎁'
          } 
        }]);
    }
};

  const handleViewCart = () => {
    onClose();
    setTimeout(() => setIsCartOpen(true), 300);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 right-0 left-0 md:left-auto md:right-8 md:bottom-24 md:w-[400px] h-[85vh] md:h-[650px] h-[85vh] md:h-[600px] bg-[#FDFBF7] dark:bg-dark-900 z-[95] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-4 bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shadow-sm relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brown-400 to-brown-900 rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="material-icons-outlined text-xl">auto_awesome</span>
                </div>
                <div>
                    <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white leading-tight">{t('gift_assistant')}</h3>
                    <p className="font-sans text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('gift_subtitle')}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
                <span className="material-icons-outlined">close</span>
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FDFBF7] dark:bg-dark-900 scroll-smooth">
            {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const content = msg.content;
                
                if (isUser) {
                    return (
                        <div key={idx} className="flex justify-end animate-fade-in">
                            <div className="bg-brown-900 text-white dark:bg-white dark:text-black py-3 px-5 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                                <p className="font-sans text-sm">{content as string}</p>
                            </div>
                        </div>
                    );
                } else {
                    const botResponse = content as ChatResponse;
                    return (
                        <div key={idx} className="flex flex-col items-start gap-2 animate-fade-in">
                            {/* Avatar */}
                            <div className="flex items-end gap-2 max-w-[90%]">
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 mb-1"></div>
                                <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl rounded-tl-none shadow-soft border border-gray-100 dark:border-gray-700">
                                    {botResponse.type === 'question' && (
                                        <p className="font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                            {botResponse.text}
                                        </p>
                                    )}
                                    {botResponse.type === 'recommendation' && (
                                        <div className="flex flex-col">
                                            <p className="font-sans text-sm text-gray-800 dark:text-gray-200 mb-3">
                                                {language === 'tr' ? 'Harika bir seçim! İşte önerim:' : language === 'ru' ? 'Отличный выбор! Вот моя рекомендация:' : 'Great choice! Here is my recommendation:'}
                                            </p>
                                            <div className="bg-[#F9F9F9] dark:bg-black/20 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                                <div className="aspect-video w-full bg-gray-200">
                                                    <img 
                                                        src={allProducts.find(p => p.id === botResponse.product_id)?.image} 
                                                        alt={botResponse.product_name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-1">{botResponse.product_name}</h4>
                                                    <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-2 italic">{botResponse.reason}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="font-bold text-brown-900 dark:text-white">{botResponse.price}</span>
                                                        <button 
                                                            onClick={() => handleAddToCart(botResponse)}
                                                            className="bg-gold text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-opacity"
                                                        >
                                                            {t('add_to_cart')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {botResponse.type === 'success' && (
                                        <div className="flex flex-col gap-3">
                                            <p className="font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                                {botResponse.text}
                                            </p>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={onClose}
                                                    className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-dark-700"
                                                >
                                                    {language === 'tr' ? 'Alışverişe Devam Et' : language === 'ru' ? 'Продолжить покупки' : 'Continue Shopping'}
                                                </button>
                                                <button 
                                                    onClick={handleViewCart}
                                                    className="px-4 py-2 bg-brown-900 dark:bg-white text-white dark:text-black border border-transparent text-xs font-medium rounded-lg transition-colors hover:opacity-90"
                                                >
                                                    {t('cart')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Options */}
                            {botResponse.type === 'question' && botResponse.options && (
                                <div className="pl-8 flex flex-wrap gap-2 mt-1">
                                    {botResponse.options.map((opt, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleOptionClick(opt)}
                                            className="px-4 py-2 bg-white dark:bg-dark-800 border border-gold/30 hover:border-gold text-brown-900 dark:text-gold text-xs font-medium rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }
            })}
            
            {loading && (
                <div className="flex items-center gap-2 pl-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
};