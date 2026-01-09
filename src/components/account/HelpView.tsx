import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, ChevronDown, ExternalLink, Clock, MapPin } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Siparişim ne zaman teslim edilir?',
    answer: 'Siparişleriniz genellikle 1-3 iş günü içinde kargoya verilir. Teslimat süresi bulunduğunuz şehre göre 1-3 gün arasında değişmektedir. Sıcak havalarda çikolatalarımız özel soğutuculu paketlerle gönderilir.'
  },
  {
    question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    answer: 'Kredi kartı (Visa, Mastercard, American Express) ve Havale/EFT ile ödeme yapabilirsiniz. EFT ile ödemelerde %5 indirim uygulanmaktadır.'
  },
  {
    question: 'Siparişimi iptal edebilir miyim?',
    answer: 'Siparişiniz kargoya verilmeden önce iptal edebilirsiniz. Bunun için destek ekibimizle iletişime geçmeniz yeterlidir.'
  },
  {
    question: 'İade politikanız nedir?',
    answer: 'Hasarlı veya hatalı ürünlerde koşulsuz iade yapılmaktadır. Ürünün teslim alınmasından itibaren 14 gün içinde bizimle iletişime geçmeniz gerekmektedir.'
  },
  {
    question: 'Çikolatalar ne kadar süre dayanır?',
    answer: 'Çikolatalarımız serin ve kuru bir yerde saklandığında üretim tarihinden itibaren 6-12 ay taze kalır. Her ürünün üzerinde son tüketim tarihi belirtilmiştir.'
  },
  {
    question: 'Hediye paketi seçeneği var mı?',
    answer: 'Evet! Sipariş sırasında hediye çantası seçeneğini aktifleştirebilir ve kişisel bir not ekleyebilirsiniz. Hediye paketleme ücretsizdir.'
  }
];

export const HelpView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* İletişim Bilgileri */}
      <section className="bg-gradient-to-br from-brown-900 to-brown-800 dark:from-gold/20 dark:to-gold/10 rounded-3xl p-8 text-white dark:text-white">
        <h3 className="font-display text-2xl font-bold mb-6">Bize Ulaşın</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="mailto:bilgi@sadechocolate.com"
            className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70">E-posta</p>
              <p className="font-medium">bilgi@sadechocolate.com</p>
            </div>
          </a>

          <a
            href="tel:+908508408282"
            className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70">Telefon</p>
              <p className="font-medium">0850 840 82 82</p>
            </div>
          </a>

          <a
            href="https://wa.me/905338420493"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70">WhatsApp</p>
              <p className="font-medium flex items-center gap-1">
                Hızlı Destek <ExternalLink size={12} />
              </p>
            </div>
          </a>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm opacity-70">
          <Clock size={14} />
          <span>Pazartesi - Cumartesi: 09:00 - 18:00</span>
        </div>
      </section>

      {/* Sıkça Sorulan Sorular */}
      <section className="bg-gray-50 dark:bg-dark-800 rounded-3xl p-8">
        <h3 className="font-display text-2xl font-bold dark:text-white mb-6">Sıkça Sorulan Sorular</h3>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-900 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
              >
                <span className="font-medium dark:text-white pr-4">{item.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mağaza Bilgileri */}
      <section className="bg-gray-50 dark:bg-dark-800 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-brown-900 dark:bg-gold rounded-2xl flex items-center justify-center">
            <MapPin className="text-white dark:text-black" size={20} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold dark:text-white">Adresimiz</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Merkez ofisimiz</p>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6">
          <p className="dark:text-white font-medium">Sade Chocolate</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
            Yeşilbahçe Mah. Çınarlı Cd. No:47/A<br />
            Muratpaşa / Antalya
          </p>
        </div>
      </section>
    </div>
  );
};
