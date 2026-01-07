import React from 'react';

interface BuyerInfo {
  fullName: string;
  address: string;
  phone: string;
  email: string;
}

interface SellerInfo {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  taxOffice?: string;
  taxNumber?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceInfo {
  type: 'individual' | 'corporate';
  fullName?: string;
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  tcKimlikNo?: string;
  address: string;
  phone: string;
  email: string;
}

interface DistanceSalesAgreementProps {
  buyer: BuyerInfo;
  seller: SellerInfo;
  orderPerson?: BuyerInfo; // Sipariş veren kişi (alıcıdan farklıysa)
  items: OrderItem[];
  shippingCost: number;
  totalAmount: number;
  invoice: InvoiceInfo;
  orderDate?: Date;
}

export const DistanceSalesAgreement: React.FC<DistanceSalesAgreementProps> = ({
  buyer,
  seller,
  orderPerson,
  items,
  shippingCost,
  totalAmount,
  invoice,
  orderDate = new Date()
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
      <h1 className="text-xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        MESAFELİ SATIŞ SÖZLEŞMESİ
      </h1>

      {/* MADDE 1 - TARAFLAR */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">1. TARAFLAR</h2>
        <p className="mb-4">
          İşbu Sözleşme aşağıdaki taraflar arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde imzalanmıştır.
        </p>

        <div className="bg-cream-50 dark:bg-dark-800 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">ALICI:</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium w-32">Ad-Soyad:</td>
                <td className="py-1">{buyer.fullName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Adres:</td>
                <td className="py-1">{buyer.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Telefon:</td>
                <td className="py-1">{buyer.phone}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">E-posta:</td>
                <td className="py-1">{buyer.email}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-cream-50 dark:bg-dark-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">SATICI:</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium w-32">Ünvan:</td>
                <td className="py-1">{seller.companyName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Adres:</td>
                <td className="py-1">{seller.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Telefon:</td>
                <td className="py-1">{seller.phone}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">E-posta:</td>
                <td className="py-1">{seller.email}</td>
              </tr>
              {seller.taxOffice && seller.taxNumber && (
                <tr>
                  <td className="py-1 pr-4 font-medium">Vergi Bilgisi:</td>
                  <td className="py-1">{seller.taxOffice} V.D. / {seller.taxNumber}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm italic">
          İş bu sözleşmeyi kabul etmekle ALICI, sözleşme konusu siparişi onayladığı takdirde sipariş konusu bedeli ve varsa kargo ücreti, vergi gibi belirtilen ek ücretleri ödeme yükümlülüğü altına gireceğini ve bu konuda bilgilendirildiğini peşinen kabul eder.
        </p>
      </section>

      {/* MADDE 2 - TANIMLAR */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">2. TANIMLAR</h2>
        <p className="mb-2">İşbu sözleşmenin uygulanmasında ve yorumlanmasında aşağıda yazılı terimler karşılarındaki yazılı açıklamaları ifade edeceklerdir.</p>
        <ul className="list-none space-y-1 text-sm">
          <li><strong>BAKAN:</strong> Ticaret Bakanı'nı,</li>
          <li><strong>BAKANLIK:</strong> Ticaret Bakanlığı'nı,</li>
          <li><strong>KANUN:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun'u,</li>
          <li><strong>YÖNETMELİK:</strong> Mesafeli Sözleşmeler Yönetmeliği'ni,</li>
          <li><strong>HİZMET:</strong> Bir ücret veya menfaat karşılığında yapılan ya da yapılması taahhüt edilen mal sağlama dışındaki her türlü tüketici işlemini,</li>
          <li><strong>SATICI:</strong> Ticari veya mesleki faaliyetleri kapsamında tüketiciye mal sunan veya mal sunan adına veya hesabına hareket eden şirketi,</li>
          <li><strong>ALICI:</strong> Bir mal veya hizmeti ticari veya mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek ya da tüzel kişiyi,</li>
          <li><strong>SİTE:</strong> SATICI'ya ait internet sitesini,</li>
          <li><strong>SİPARİŞ VEREN:</strong> Bir mal veya hizmeti SATICI'ya ait internet sitesi üzerinden talep eden gerçek ya da tüzel kişiyi,</li>
          <li><strong>TARAFLAR:</strong> SATICI ve ALICI'yı,</li>
          <li><strong>SÖZLEŞME:</strong> SATICI ve ALICI arasında akdedilen işbu sözleşmeyi,</li>
          <li><strong>MAL:</strong> Alışverişe konu olan taşınır eşyayı ve elektronik ortamda kullanılmak üzere hazırlanan yazılım, ses, görüntü ve benzeri gayri maddi malları,</li>
        </ul>
      </section>

      {/* MADDE 3 - KONU */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">3. KONU</h2>
        <p>
          İşbu Sözleşme, ALICI'nın, SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
        </p>
        <p className="mt-2">
          Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
        </p>
      </section>

      {/* MADDE 4 - SATICI BİLGİLERİ */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">4. SATICI BİLGİLERİ</h2>
        <div className="bg-cream-50 dark:bg-dark-800 p-4 rounded-lg">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium w-32">Ünvanı:</td>
                <td className="py-1">{seller.companyName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Adres:</td>
                <td className="py-1">{seller.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Telefon:</td>
                <td className="py-1">{seller.phone}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">E-posta:</td>
                <td className="py-1">{seller.email}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* MADDE 5 - ALICI BİLGİLERİ */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">5. ALICI BİLGİLERİ</h2>
        <div className="bg-cream-50 dark:bg-dark-800 p-4 rounded-lg">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium w-40">Teslim Edilecek Kişi:</td>
                <td className="py-1">{buyer.fullName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Teslimat Adresi:</td>
                <td className="py-1">{buyer.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Telefon:</td>
                <td className="py-1">{buyer.phone}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">E-posta:</td>
                <td className="py-1">{buyer.email}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* MADDE 6 - SİPARİŞ VEREN KİŞİ BİLGİLERİ */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">6. SİPARİŞ VEREN KİŞİ BİLGİLERİ</h2>
        <div className="bg-cream-50 dark:bg-dark-800 p-4 rounded-lg">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium w-40">Ad/Soyad/Unvan:</td>
                <td className="py-1">{orderPerson?.fullName || buyer.fullName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Adres:</td>
                <td className="py-1">{orderPerson?.address || buyer.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Telefon:</td>
                <td className="py-1">{orderPerson?.phone || buyer.phone}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">E-posta:</td>
                <td className="py-1">{orderPerson?.email || buyer.email}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* MADDE 7 - SÖZLEŞME KONUSU ÜRÜN/ÜRÜNLER BİLGİLERİ */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">7. SÖZLEŞME KONUSU ÜRÜN/ÜRÜNLER BİLGİLERİ</h2>

        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">7.1. Ürün Bilgileri</h3>
        <p className="text-sm mb-4">
          Malın/Ürün/Ürünlerin/Hizmetin temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi) SATICI'ya ait internet sitesinde yayınlanmaktadır. Satıcı tarafından kampanya düzenlenmiş ise ilgili ürünün temel özelliklerini kampanya süresince inceleyebilirsiniz.
        </p>

        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">7.2. Fiyatlar</h3>
        <p className="text-sm mb-4">
          Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
        </p>

        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">7.3. Vergiler ve Ödemeler</h3>
        <p className="text-sm mb-4">
          Sözleşme konusu mal ya da hizmetin tüm vergiler dâhil satış fiyatı aşağıda gösterilmiştir.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-cream-100 dark:bg-dark-700">
                <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">Ürün Açıklaması</th>
                <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">Adet</th>
                <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Birim Fiyatı</th>
                <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Ara Toplam (KDV Dahil)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">{item.name}</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-cream-50 dark:bg-dark-800">
                <td colSpan={3} className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-medium">Kargo Tutarı:</td>
                <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">{shippingCost === 0 ? 'Ücretsiz' : formatCurrency(shippingCost)}</td>
              </tr>
              <tr className="bg-brown-100 dark:bg-brown-900/30">
                <td colSpan={3} className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold">Toplam:</td>
                <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold">{formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* MADDE 8 - FATURA BİLGİLERİ */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">8. FATURA BİLGİLERİ</h2>
        <div className="bg-cream-50 dark:bg-dark-800 p-4 rounded-lg">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium w-40">
                  {invoice.type === 'corporate' ? 'Ünvan:' : 'Ad/Soyad:'}
                </td>
                <td className="py-1">
                  {invoice.type === 'corporate' ? invoice.companyName : invoice.fullName}
                </td>
              </tr>
              {invoice.type === 'corporate' && invoice.taxOffice && (
                <tr>
                  <td className="py-1 pr-4 font-medium">Vergi Dairesi:</td>
                  <td className="py-1">{invoice.taxOffice}</td>
                </tr>
              )}
              {invoice.type === 'corporate' && invoice.taxNumber && (
                <tr>
                  <td className="py-1 pr-4 font-medium">Vergi No:</td>
                  <td className="py-1">{invoice.taxNumber}</td>
                </tr>
              )}
              {invoice.type === 'individual' && invoice.tcKimlikNo && (
                <tr>
                  <td className="py-1 pr-4 font-medium">TC Kimlik No:</td>
                  <td className="py-1">{invoice.tcKimlikNo}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 pr-4 font-medium">Adres:</td>
                <td className="py-1">{invoice.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Telefon:</td>
                <td className="py-1">{invoice.phone}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">E-posta:</td>
                <td className="py-1">{invoice.email}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          <strong>Fatura teslim:</strong> Fatura sipariş teslimatı sırasında fatura adresine sipariş ile birlikte teslim edilecektir.
        </p>
      </section>

      {/* MADDE 9 - GENEL HÜKÜMLER */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">9. GENEL HÜKÜMLER</h2>

        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">9.1. Bilgilendirme ve Kabul</h3>
        <p className="text-sm mb-4">
          ALICI, SATICI'ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup, bilgi sahibi olduğunu, elektronik ortamda gerekli teyidi verdiğini kabul, beyan ve taahhüt eder.
        </p>

        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">9.2. Teslim Süresi</h3>
        <p className="text-sm">
          Sözleşme konusu her bir ürün, 30 günlük yasal süreyi aşmamak kaydı ile ALICI'nın yerleşim yeri uzaklığına bağlı olarak internet sitesindeki ön bilgiler kısmında belirtilen süre zarfında teslim edilir.
        </p>
      </section>

      {/* MADDE 10 - CAYMA HAKKI */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">10. CAYMA HAKKI</h2>
        <p className="text-sm">
          ALICI, mesafeli sözleşmenin mal satışına ilişkin olması durumunda, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren <strong>14 (on dört) gün</strong> içerisinde, SATICI'ya bildirmek şartıyla hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkını kullanabilir.
        </p>
      </section>

      {/* MADDE 11 - CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">11. CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER</h2>
        <p className="text-sm mb-2">
          Aşağıdaki ürünlerde cayma hakkı kullanılamaz:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek mallar (gıda ürünleri dahil)</li>
          <li>ALICI'nın isteği veya açıkça kişisel ihtiyaçları doğrultusunda hazırlanan ürünler</li>
          <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan gıda maddeleri</li>
          <li>Niteliği itibariyle geri gönderilmeye elverişli olmayan ürünler</li>
        </ul>
        <p className="text-sm mt-3 p-3 bg-gold-50 dark:bg-gold-900/20 rounded-lg border border-gold-200 dark:border-gold-800">
          <strong>Önemli Not:</strong> Çikolata ve şekerleme ürünleri, gıda güvenliği nedeniyle cayma hakkı kapsamı dışındadır. Ancak hasarlı veya hatalı ürünlerde değişim/iade işlemi yapılmaktadır.
        </p>
      </section>

      {/* MADDE 12 - TEMERRÜT HALİ VE HUKUKİ SONUÇLARI */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">12. TEMERRÜT HALİ VE HUKUKİ SONUÇLARI</h2>
        <p className="text-sm">
          ALICI, ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düştüğü takdirde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını kabul, beyan ve taahhüt eder. Bu durumda ilgili banka hukuki yollara başvurabilir; doğacak masrafları ve vekâlet ücretini ALICI'dan talep edebilir ve her koşulda ALICI'nın borcundan dolayı temerrüde düşmesi halinde, ALICI, borcun gecikmeli ifasından dolayı SATICI'nın uğradığı zarar ve ziyanı ödemeyi kabul, beyan ve taahhüt eder.
        </p>
      </section>

      {/* MADDE 13 - YETKİLİ MAHKEME */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">13. YETKİLİ MAHKEME</h2>
        <p className="text-sm">
          İşbu sözleşmeden doğan uyuşmazlıklarda şikayet ve itirazlar, aşağıdaki kanunlarda belirtilen parasal sınırlar dahilinde tüketicinin yerleşim yerinin bulunduğu veya tüketici işleminin yapıldığı yerdeki <strong>Tüketici Sorunları Hakem Heyetine</strong> veya <strong>Tüketici Mahkemesine</strong> yapılacaktır.
        </p>
      </section>

      {/* MADDE 14 - YÜRÜRLÜK */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">14. YÜRÜRLÜK</h2>
        <p className="text-sm">
          ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş sayılır. SATICI, siparişin gerçekleşmesi öncesinde işbu sözleşmenin sitede ALICI tarafından okunup kabul edildiğine dair onay alacak şekilde gerekli yazılımsal düzenlemeleri yapmakla yükümlüdür.
        </p>
      </section>

      {/* İMZA / ONAY */}
      <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div className="text-sm">
            <p className="font-semibold mb-1">SATICI</p>
            <p>{seller.companyName}</p>
          </div>
          <div className="text-sm text-right">
            <p className="font-semibold mb-1">ALICI</p>
            <p>{buyer.fullName}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{formatDate(orderDate)}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DistanceSalesAgreement;
