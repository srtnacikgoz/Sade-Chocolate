import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Sade Chocolate OMS - Örnek Müşteri Verileri
 * Her RFM segmenti ve müşteri tipini test etmek için tasarlanmıştır
 */

export const seedOrders = async () => {
  const ordersRef = collection(db, 'orders');

  // Helper: Tarih oluştur (gün sayısı kadar geriye)
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return Timestamp.fromDate(date);
  };

  const sampleOrders = [
    // 🏆 1. VIP MÜŞTERİ - Ayşe Demir (>5000₺, Mükemmel RFM: 92)
    // Son sipariş: 2 gün önce, 12 sipariş, 7.500₺
    // Taste DNA: Bitter Aşığı, Ambassador: 7 referral
    ...Array.from({ length: 12 }, (_, i) => ({
      customerInfo: {
        name: 'Ayşe Demir',
        email: 'ayse.demir@example.com',
        phone: '+90 532 111 2233',
        address: 'Konyaaltı Mah. Atatürk Blv. No:45 D:8, Antalya',
        referralCount: 7, // Marka Elçisi
      },
      items: [
        {
          id: 'prod-1',
          title: '%85 Ecuador Single Origin',
          price: i % 3 === 0 ? 450 : 380,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1511381939415-e44015466834',
          isLimitedEdition: i === 11, // Son sipariş limited edition
          stockRemaining: i === 11 ? 12 : undefined,
          attributes: ['Bitter', 'Yoğun', 'Meyvemsi'], // Taste DNA
        },
      ],
      total: i % 3 === 0 ? 900 : 760,
      status: i === 11 ? 'pending' : i > 9 ? 'delivered' : 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(i === 11 ? 2 : (i * 15) + 2),
      updatedAt: daysAgo(i === 11 ? 2 : (i * 15) + 2),
      giftDetails: i === 11 ? { isGift: true, note: 'Annem için özel bir hediye' } : undefined,
    })),

    // 💜 2. SADIK MÜŞTERİ - Mehmet Yılmaz (5 sipariş, İyi RFM: 65)
    // Son sipariş: 10 gün önce, 5 sipariş, 2.100₺
    // Taste DNA: Kuruyemişli + Sütlü
    ...Array.from({ length: 5 }, (_, i) => ({
      customerInfo: {
        name: 'Mehmet Yılmaz',
        email: 'mehmet.yilmaz@example.com',
        phone: '+90 533 444 5566',
        address: 'Lara Mah. Güzeloba Cad. No:12, Antalya',
        referralCount: 3, // Rising Star
      },
      items: [
        {
          id: 'prod-2',
          title: 'Fındıklı Sütlü Çikolata Tablet',
          price: 285,
          quantity: i === 4 ? 2 : 1,
          image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b',
          attributes: ['Kuruyemişli', 'Sütlü', 'Çıtır'], // Taste DNA
        },
      ],
      total: i === 4 ? 570 : 285,
      status: i === 4 ? 'preparing' : 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(i === 4 ? 10 : (i * 30) + 10),
      updatedAt: daysAgo(i === 4 ? 10 : (i * 30) + 10),
    })),

    // 🌟 3. YENİ MÜŞTERİ - Zeynep Kaya (İlk sipariş)
    // Son sipariş: 1 gün önce, 1 sipariş, 320₺
    {
      customerInfo: {
        name: 'Zeynep Kaya',
        email: 'zeynep.kaya@example.com',
        phone: '+90 534 777 8899',
        address: 'Kepez Mah. Meltem Sok. No:23 D:5, Antalya',
      },
      items: [
        {
          id: 'prod-3',
          title: '%70 Bitter Çikolata',
          price: 320,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1606312619070-d48b4a00686f',
        },
      ],
      total: 320,
      status: 'shipped',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },

    // 🚨 4. RİSK ALTINDA - Can Öztürk (90+ gün önce, Düşük RFM: 28)
    // Son sipariş: 120 gün önce, 4 sipariş, 1.800₺
    ...Array.from({ length: 4 }, (_, i) => ({
      customerInfo: {
        name: 'Can Öztürk',
        email: 'can.ozturk@example.com',
        phone: '+90 535 222 3344',
        address: 'Muratpaşa Mah. Fener Cad. No:67, Antalya',
      },
      items: [
        {
          id: 'prod-4',
          title: 'Antep Fıstıklı Bitter Tablet',
          price: 450,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1511381939415-e44015466834',
        },
      ],
      total: 450,
      status: 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(i === 0 ? 120 : (i * 40) + 120),
      updatedAt: daysAgo(i === 0 ? 120 : (i * 40) + 120),
    })),

    // 🎉 5. MİLESTONE MÜŞTERİ - Elif Arslan (Tam 10. sipariş!)
    // Son sipariş: 3 gün önce, 10 sipariş, 3.200₺
    // Taste DNA: Karamelli Aşığı, Ambassador: 12 referral (Süper Ambassador!)
    ...Array.from({ length: 10 }, (_, i) => ({
      customerInfo: {
        name: 'Elif Arslan',
        email: 'elif.arslan@example.com',
        phone: '+90 536 888 9900',
        address: 'Kemer Mah. Sahil Blv. No:89, Antalya',
        referralCount: 12, // Süper Ambassador!
      },
      items: [
        {
          id: 'prod-5',
          title: i % 2 === 0 ? 'Badem Ezmeli Sütlü Çikolata' : 'Karamel Dolgulu Tablet',
          price: 320,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2',
          attributes: i % 2 === 0 ? ['Kuruyemişli', 'Sütlü'] : ['Karamelli', 'Sütlü'], // Taste DNA
        },
      ],
      total: 320,
      status: i === 9 ? 'pending' : 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(i === 9 ? 3 : (i * 20) + 3),
      updatedAt: daysAgo(i === 9 ? 3 : (i * 20) + 3),
      giftDetails: i === 5 ? { isGift: true, note: 'Doğum günü hediyesi' } : undefined,
    })),

    // 💌 6. GERİ DÖNEN MÜŞTERİ - Ahmet Şahin (100 gün sonra geri döndü)
    // İlk sipariş: 250 gün önce, son sipariş: 5 gün önce
    {
      customerInfo: {
        name: 'Ahmet Şahin',
        email: 'ahmet.sahin@example.com',
        phone: '+90 537 333 4455',
        address: 'Aksu Mah. Deniz Cad. No:34, Antalya',
      },
      items: [
        {
          id: 'prod-6',
          title: 'Portakallı Bitter Çikolata',
          price: 380,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1511381939415-e44015466834',
        },
      ],
      total: 760,
      status: 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(250),
      updatedAt: daysAgo(250),
    },
    {
      customerInfo: {
        name: 'Ahmet Şahin',
        email: 'ahmet.sahin@example.com',
        phone: '+90 537 333 4455',
        address: 'Aksu Mah. Deniz Cad. No:34, Antalya',
      },
      items: [
        {
          id: 'prod-7',
          title: 'Çilek Dolgulu Beyaz Çikolata',
          price: 340,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2',
        },
      ],
      total: 340,
      status: 'pending',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },

    // ⚡ 7. SINIRLI ÜRETİM SİPARİŞİ - Selin Aydın (Limited Edition ürünler)
    // Taste DNA: Bitter + Yoğun, Ambassador: 5 referral
    {
      customerInfo: {
        name: 'Selin Aydın',
        email: 'selin.aydin@example.com',
        phone: '+90 538 666 7788',
        address: 'Manavgat Mah. Çınar Sok. No:56, Antalya',
        referralCount: 5, // Marka Elçisi
      },
      items: [
        {
          id: 'prod-8',
          title: 'Özel Üretim Madagascar %90 Bitter',
          price: 680,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1606312619070-d48b4a00686f',
          isLimitedEdition: true,
          stockRemaining: 8,
          attributes: ['Bitter', 'Yoğun', 'Meyvemsi'], // Taste DNA
        },
        {
          id: 'prod-9',
          title: 'Himalaya Tuzu & Karamel Limited',
          price: 520,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1511381939415-e44015466834',
          isLimitedEdition: true,
          stockRemaining: 15,
          attributes: ['Karamelli', 'Yoğun'], // Taste DNA
        },
      ],
      total: 1880,
      status: 'preparing',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },

    // 🍷 8. SOMMELIER MESAJI BEKLİYOR - Deniz Yurt (48 saat önce teslim edildi)
    {
      customerInfo: {
        name: 'Deniz Yurt',
        email: 'deniz.yurt@example.com',
        phone: '+90 539 999 0011',
        address: 'Alanya Mah. Palmiye Sok. No:45, Antalya',
      },
      items: [
        {
          id: 'prod-10',
          title: '%75 Peru Single Origin',
          price: 420,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1606312619070-d48b4a00686f',
        },
      ],
      total: 420,
      status: 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2), // 2 gün önce teslim edildi
    },

    // 🎁 9. HEDİYE PAKETİ - Burak Tekin
    {
      customerInfo: {
        name: 'Burak Tekin',
        email: 'burak.tekin@example.com',
        phone: '+90 531 555 6677',
        address: 'Side Mah. Apollon Cad. No:78, Antalya',
      },
      items: [
        {
          id: 'prod-11',
          title: 'Özel Hediye Koleksiyonu (6lı)',
          price: 890,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b',
        },
      ],
      total: 890,
      status: 'shipped',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      giftDetails: {
        isGift: true,
        note: 'Sevgilim için yıldönümü hediyesi. Lütfen özel paket yapın.',
        recipientName: 'Aylin Tekin',
      },
    },

    // 🟡 10. SADAKATİ AZALIYOR - Gizem Kılıç (RFM: 45, 60 gün önce)
    ...Array.from({ length: 6 }, (_, i) => ({
      customerInfo: {
        name: 'Gizem Kılıç',
        email: 'gizem.kilic@example.com',
        phone: '+90 532 777 8899',
        address: 'Belek Mah. Golf Cad. No:12, Antalya',
      },
      items: [
        {
          id: 'prod-12',
          title: 'Çikolata Kaplı Badem',
          price: 240,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2',
        },
      ],
      total: 240,
      status: i === 0 ? 'pending' : 'delivered',
      paymentMethod: 'credit_card',
      createdAt: daysAgo(i === 0 ? 60 : (i * 25) + 60),
      updatedAt: daysAgo(i === 0 ? 60 : (i * 25) + 60),
    })),
  ];

  console.log('🌱 Örnek müşteri verileri ekleniyor...');

  for (const order of sampleOrders) {
    try {
      await addDoc(ordersRef, order);
    } catch (error) {
      console.error('Sipariş eklenirken hata:', error);
    }
  }

  console.log('✅ Toplam', sampleOrders.length, 'sipariş eklendi!');
  console.log('\n📊 Müşteri Tipleri:');
  console.log('🏆 VIP: Ayşe Demir (12 sipariş, 7.500₺, RFM: ~92, 🍫 Bitter DNA, 📣 7 referral)');
  console.log('💜 Sadık: Mehmet Yılmaz (5 sipariş, 2.100₺, RFM: ~65, 🥜 Kuruyemişli DNA, ⭐ 3 referral)');
  console.log('🌟 Yeni: Zeynep Kaya (1 sipariş, 320₺)');
  console.log('🚨 Risk: Can Öztürk (4 sipariş, 120 gün önce, RFM: ~28)');
  console.log('🎉 Milestone: Elif Arslan (10. sipariş!, 🍯 Karamelli DNA, 👑 12 referral - Süper Ambassador)');
  console.log('💌 Geri Dönen: Ahmet Şahin (100 gün sonra)');
  console.log('⚡ Limited Edition: Selin Aydın (🍫 Bitter DNA, 📣 5 referral)');
  console.log('🍷 Sommelier: Deniz Yurt (48 saat önce teslim)');
  console.log('🎁 Hediye: Burak Tekin');
  console.log('🟡 Sadakati Azalıyor: Gizem Kılıç (60 gün önce, RFM: ~45)');
};
