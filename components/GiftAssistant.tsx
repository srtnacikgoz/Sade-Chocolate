import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

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
  product_name?: string;
  reason?: string;
  image_keyword?: string;
  price?: string;
}

// Ürün görsellerini Firestore products'tan keyword eşleştirmesiyle çeker
const buildImageMap = (products: Product[]): Record<string, string> => {
  const findImage = (keywords: string[]) => {
    const found = products.find(p =>
      keywords.some(kw => p.title.toLowerCase().includes(kw))
    );
    return found?.image || products[0]?.image || '';
  };

  return {
    'ruby_tablet': findImage(['ruby', 'pembe']),
    'gold_tablet': findImage(['gold', 'altın', 'karamel']),
    'bitter_tablet': findImage(['bitter', 'dark', '%70']),
    'milk_tablet': findImage(['sütlü', 'milk', 'fındık']),
    'mixed_box': findImage(['karışık', 'mixed', 'kutu']),
    'velvet': findImage(['velvet', 'beyaz', 'white']),
    'truffle_box': findImage(['truffle', 'trüf']),
  };
};

const getSystemInstruction = (language: string) => `You are the "Sade Chocolate Gift Assistant". You act as a smart sales algorithm for a high-end chocolate brand based in Antalya.
Language: ${language === 'tr' ? 'Turkish' : language === 'ru' ? 'Russian' : 'English'}.
Goal: Guide the user to a purchase in exactly 3 interactions using a decision tree based on FLAVOR PROFILES.

Inventory & Flavor Profiles:
1. "Yoğun Bitter" (Intense Dark) -> Product: Bitter Tablet (%70). Keywords: Purists, healthy, strong character.
2. "İpeksi Beyaz" (Silky White) -> Product: Velvet Beyaz or Gold Çikolata. Keywords: Sweet tooth, creamy, caramel notes.
3. "Meyve Nüanslı" (Fruity Nuances) -> Product: Ruby Tablet or Truffle Box (if fruity options). Keywords: Sour, fresh, innovative.
4. "Kuruyemiş Sevenler" (Nut Lovers) -> Product: Sütlü Fındıklı Tablet. Keywords: Crunchy, traditional, safe choice.
5. "Kararsız/Hepsi" (Undecided) -> Product: Special Karışık Kutu (Mixed Box).

Output Format:
You must ALWAYS respond in strict JSON format. Do not write conversational text outside the JSON.
There are only two types of responses: "question" or "recommendation".

Format 1: Asking a Question
{
  "type": "question",
  "text": "Here is the question to the user in ${language === 'tr' ? 'Turkish' : language === 'ru' ? 'Russian' : 'English'}...",
  "options": ["Option A", "Option B", "Option C"]
}

Format 2: Making a Recommendation (Final Step)
{
  "type": "recommendation",
  "product_name": "Product Name (Keep it fancy)",
  "reason": "Short, catchy reason why this fits in ${language === 'tr' ? 'Turkish' : language === 'ru' ? 'Russian' : 'English'}.",
  "image_keyword": "Use specific keyword: ruby_tablet, gold_tablet, bitter_tablet, milk_tablet, mixed_box, velvet, truffle_box",
  "price": "XXX TL"
}

Decision Tree Script (Adapt to Language):
Step 1 (Start):
Question: "Sade Chocolate dünyasına hoş geldiniz. Bugün damağınızda nasıl bir iz bırakmak istersiniz?" (Welcome. What kind of trace would you like to leave on your palate today?)
Options: 
A: "Yumuşak, tatlı ve beni şımartacak bir lezzet." (Soft, sweet, pampering) -> Leads to Gold/Velvet
B: "Çikolatanın en saf ve karakterli halini seviyorum." (Purest, character) -> Leads to Bitter
C: "Sıradışı, meyvemsi ve yenilikçi bir şeyler." (Unusual, fruity, innovative) -> Leads to Ruby/Truffle
D: "Kararsızım, her şeyden biraz olsun!" (Undecided, a bit of everything) -> Leads to Mixed Box

Step 2 (Refinement - Only if needed, otherwise recommend):
* If A (Soft/Sweet): Recommend Gold (Caramel notes) or Velvet (Silky white).
* If B (Pure): Recommend Bitter Tablet.
* If C (Fruity): Recommend Ruby Tablet.
* If D (Mixed): Recommend Special Karışık Kutu.

Step 3 (Recommendation Logic):
* Map choices to inventory logic above.`;

export const GiftAssistant: React.FC<GiftAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart, setIsCartOpen } = useCart();
  const { products } = useProducts();
  const { t, language } = useLanguage();
  const imageMap = useMemo(() => buildImageMap(products), [products]);
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
      const systemInstruction = getSystemInstruction(language);
      
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
      // Construct a temporary product object
      const priceNumber = parseFloat(response.price?.replace(/[^0-9.]/g, '') || '0');
      const product: Product = {
          id: `ai-${Date.now()}`,
          title: response.product_name || 'Özel Seçim',
          description: response.reason || 'Sizin için özel olarak seçildi.',
          price: priceNumber || 0,
          currency: '₺',
          image: imageMap[response.image_keyword || 'mixed_box'] || imageMap['mixed_box'] || products[0]?.image || '',
          badge: 'Special',
          category: 'gift-box'
      };
      addToCart(product);
      
      // Inject success message
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: { 
            type: 'success', 
            text: language === 'tr' ? 'Harika seçim! Ürün sepetinize eklendi. 🎁' : language === 'ru' ? 'Отличный выбор! Товар добавлен в корзину. 🎁' : 'Great choice! Added to your cart. 🎁'
        } 
      }]);
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
      <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-20 md:w-[400px] h-[85vh] md:h-[600px] bg-[#FDFBF7] dark:bg-dark-900 z-[95] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
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
                                                        src={IMAGE_MAP[botResponse.image_keyword || 'mixed_box']} 
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