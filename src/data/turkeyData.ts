// src/data/turkeyData.ts
// Türkiye şehir ve ilçe verileri - MNG API çalışmadığında fallback olarak kullanılır

export interface City {
  code: string;
  name: string;
}

export interface District {
  cityCode: string;
  cityName: string;
  code: string; // MNG district code - API'den alınacak, şimdilik boş
  name: string;
}

// Türkiye 81 il listesi (plaka koduna göre sıralı)
export const TURKEY_CITIES: City[] = [
  { code: '01', name: 'Adana' },
  { code: '02', name: 'Adıyaman' },
  { code: '03', name: 'Afyonkarahisar' },
  { code: '04', name: 'Ağrı' },
  { code: '05', name: 'Amasya' },
  { code: '06', name: 'Ankara' },
  { code: '07', name: 'Antalya' },
  { code: '08', name: 'Artvin' },
  { code: '09', name: 'Aydın' },
  { code: '10', name: 'Balıkesir' },
  { code: '11', name: 'Bilecik' },
  { code: '12', name: 'Bingöl' },
  { code: '13', name: 'Bitlis' },
  { code: '14', name: 'Bolu' },
  { code: '15', name: 'Burdur' },
  { code: '16', name: 'Bursa' },
  { code: '17', name: 'Çanakkale' },
  { code: '18', name: 'Çankırı' },
  { code: '19', name: 'Çorum' },
  { code: '20', name: 'Denizli' },
  { code: '21', name: 'Diyarbakır' },
  { code: '22', name: 'Edirne' },
  { code: '23', name: 'Elazığ' },
  { code: '24', name: 'Erzincan' },
  { code: '25', name: 'Erzurum' },
  { code: '26', name: 'Eskişehir' },
  { code: '27', name: 'Gaziantep' },
  { code: '28', name: 'Giresun' },
  { code: '29', name: 'Gümüşhane' },
  { code: '30', name: 'Hakkari' },
  { code: '31', name: 'Hatay' },
  { code: '32', name: 'Isparta' },
  { code: '33', name: 'Mersin' },
  { code: '34', name: 'İstanbul' },
  { code: '35', name: 'İzmir' },
  { code: '36', name: 'Kars' },
  { code: '37', name: 'Kastamonu' },
  { code: '38', name: 'Kayseri' },
  { code: '39', name: 'Kırklareli' },
  { code: '40', name: 'Kırşehir' },
  { code: '41', name: 'Kocaeli' },
  { code: '42', name: 'Konya' },
  { code: '43', name: 'Kütahya' },
  { code: '44', name: 'Malatya' },
  { code: '45', name: 'Manisa' },
  { code: '46', name: 'Kahramanmaraş' },
  { code: '47', name: 'Mardin' },
  { code: '48', name: 'Muğla' },
  { code: '49', name: 'Muş' },
  { code: '50', name: 'Nevşehir' },
  { code: '51', name: 'Niğde' },
  { code: '52', name: 'Ordu' },
  { code: '53', name: 'Rize' },
  { code: '54', name: 'Sakarya' },
  { code: '55', name: 'Samsun' },
  { code: '56', name: 'Siirt' },
  { code: '57', name: 'Sinop' },
  { code: '58', name: 'Sivas' },
  { code: '59', name: 'Tekirdağ' },
  { code: '60', name: 'Tokat' },
  { code: '61', name: 'Trabzon' },
  { code: '62', name: 'Tunceli' },
  { code: '63', name: 'Şanlıurfa' },
  { code: '64', name: 'Uşak' },
  { code: '65', name: 'Van' },
  { code: '66', name: 'Yozgat' },
  { code: '67', name: 'Zonguldak' },
  { code: '68', name: 'Aksaray' },
  { code: '69', name: 'Bayburt' },
  { code: '70', name: 'Karaman' },
  { code: '71', name: 'Kırıkkale' },
  { code: '72', name: 'Batman' },
  { code: '73', name: 'Şırnak' },
  { code: '74', name: 'Bartın' },
  { code: '75', name: 'Ardahan' },
  { code: '76', name: 'Iğdır' },
  { code: '77', name: 'Yalova' },
  { code: '78', name: 'Karabük' },
  { code: '79', name: 'Kilis' },
  { code: '80', name: 'Osmaniye' },
  { code: '81', name: 'Düzce' },
];

// İlçe verileri - en çok sipariş gelen şehirler için
// Not: MNG ilçe kodları API'den alınmalı, şimdilik isim bazlı eşleşme yapılıyor
export const TURKEY_DISTRICTS: Record<string, District[]> = {
  '07': [ // Antalya
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Akseki' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Aksu' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Alanya' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Demre' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Döşemealtı' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Elmalı' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Finike' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Gazipaşa' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Gündoğmuş' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'İbradı' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Kaş' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Kemer' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Kepez' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Konyaaltı' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Korkuteli' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Kumluca' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Manavgat' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Muratpaşa' },
    { cityCode: '07', cityName: 'Antalya', code: '', name: 'Serik' },
  ],
  '34': [ // İstanbul
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Adalar' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Arnavutköy' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Ataşehir' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Avcılar' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Bağcılar' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Bahçelievler' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Bakırköy' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Başakşehir' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Bayrampaşa' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Beşiktaş' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Beykoz' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Beylikdüzü' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Beyoğlu' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Büyükçekmece' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Çatalca' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Çekmeköy' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Esenler' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Esenyurt' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Eyüpsultan' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Fatih' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Gaziosmanpaşa' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Güngören' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Kadıköy' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Kağıthane' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Kartal' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Küçükçekmece' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Maltepe' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Pendik' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Sancaktepe' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Sarıyer' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Silivri' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Sultanbeyli' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Sultangazi' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Şile' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Şişli' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Tuzla' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Ümraniye' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Üsküdar' },
    { cityCode: '34', cityName: 'İstanbul', code: '', name: 'Zeytinburnu' },
  ],
  '06': [ // Ankara
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Akyurt' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Altındağ' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Ayaş' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Balâ' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Beypazarı' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Çamlıdere' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Çankaya' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Çubuk' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Elmadağ' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Etimesgut' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Evren' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Gölbaşı' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Güdül' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Haymana' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Kahramankazan' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Kalecik' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Keçiören' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Kızılcahamam' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Mamak' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Nallıhan' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Polatlı' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Pursaklar' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Sincan' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Şereflikoçhisar' },
    { cityCode: '06', cityName: 'Ankara', code: '', name: 'Yenimahalle' },
  ],
  '35': [ // İzmir
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Aliağa' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Balçova' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Bayındır' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Bayraklı' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Bergama' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Beydağ' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Bornova' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Buca' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Çeşme' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Çiğli' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Dikili' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Foça' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Gaziemir' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Güzelbahçe' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Karabağlar' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Karaburun' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Karşıyaka' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Kemalpaşa' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Kınık' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Kiraz' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Konak' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Menderes' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Menemen' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Narlıdere' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Ödemiş' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Seferihisar' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Selçuk' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Tire' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Torbalı' },
    { cityCode: '35', cityName: 'İzmir', code: '', name: 'Urla' },
  ],
  '16': [ // Bursa
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Büyükorhan' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Gemlik' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Gürsu' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Harmancık' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'İnegöl' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'İznik' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Karacabey' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Keles' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Kestel' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Mudanya' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Mustafakemalpaşa' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Nilüfer' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Orhaneli' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Orhangazi' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Osmangazi' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Yenişehir' },
    { cityCode: '16', cityName: 'Bursa', code: '', name: 'Yıldırım' },
  ],
};

// Sabit kargo ücreti - MNG API çalışmadığında kullanılır
export const DEFAULT_SHIPPING_COST = 75; // TL

// Şehir kodundan şehir adı bulma
export const getCityNameByCode = (code: string): string => {
  const city = TURKEY_CITIES.find(c => c.code === code);
  return city?.name || '';
};

// Şehir adından şehir kodu bulma
export const getCityCodeByName = (name: string): string => {
  const normalized = name.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  const city = TURKEY_CITIES.find(c => {
    const cityNormalized = c.name.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    return cityNormalized === normalized;
  });

  return city?.code || '';
};
