// Türkiye İl ve İlçe Veritabanı (81 İl - Tam Liste)
export interface City {
  id: number;
  name: string;
  districts: string[];
}

export const TURKEY_CITIES: City[] = [
  {
    id: 1,
    name: "Adana",
    districts: ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"]
  },
  {
    id: 2,
    name: "Adıyaman",
    districts: ["Adıyaman", "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Samsat", "Sincik", "Tut"]
  },
  {
    id: 3,
    name: "Afyonkarahisar",
    districts: ["Afyon", "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Sandıklı", "Sincanlı", "Şuhut", "Sultandağı"]
  },
  {
    id: 4,
    name: "Ağrı",
    districts: ["Ağrı", "Diyadin", "Doğubeyazıt", "Eleşkirt", "Hamur", "Patnos", "Taşlıçay", "Tutak"]
  },
  {
    id: 5,
    name: "Amasya",
    districts: ["Amasya", "Göynücek", "Gümüşhacıköy", "Hamamözü", "Merzifon", "Suluova", "Taşova"]
  },
  {
    id: 6,
    name: "Ankara",
    districts: ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Şereflikoçhisar", "Sincan", "Yenimahalle"]
  },
  {
    id: 7,
    name: "Antalya",
    districts: ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"]
  },
  {
    id: 8,
    name: "Artvin",
    districts: ["Ardanuç", "Arhavi", "Artvin", "Borçka", "Hopa", "Murgul", "Şavşat", "Yusufeli"]
  },
  {
    id: 9,
    name: "Aydın",
    districts: ["Aydın", "Bozdoğan", "Buharkent", "Çine", "Didim", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"]
  },
  {
    id: 10,
    name: "Balıkesir",
    districts: ["Ayvalık", "Balıkesir", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"]
  },
  {
    id: 11,
    name: "Bilecik",
    districts: ["Bilecik", "Bozüyük", "Gölpazarı", "İnhisar", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"]
  },
  {
    id: 12,
    name: "Bingöl",
    districts: ["Adaklı", "Bingöl", "Genç", "Karlıova", "Kiğı", "Solhan", "Yayladere", "Yedisu"]
  },
  {
    id: 13,
    name: "Bitlis",
    districts: ["Adilcevaz", "Ahlat", "Bitlis", "Güroymak", "Hizan", "Mutki", "Tatvan"]
  },
  {
    id: 14,
    name: "Bolu",
    districts: ["Bolu", "Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Mudurnu", "Seben", "Yeniçağa"]
  },
  {
    id: 15,
    name: "Burdur",
    districts: ["Ağlasun", "Altınyayla", "Bucak", "Burdur", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Tefenni", "Yeşilova"]
  },
  {
    id: 16,
    name: "Bursa",
    districts: ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"]
  },
  {
    id: 17,
    name: "Çanakkale",
    districts: ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Çanakkale", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Yenice"]
  },
  {
    id: 18,
    name: "Çankırı",
    districts: ["Atkaracalar", "Bayramören", "Çankırı", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Orta", "Şabanözü", "Yapraklı"]
  },
  {
    id: 19,
    name: "Çorum",
    districts: ["Alaca", "Bayat", "Boğazkale", "Çorum", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"]
  },
  {
    id: 20,
    name: "Denizli",
    districts: ["Acıpayam", "Akköy", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Denizli", "Güney", "Honaz", "Kale", "Sarayköy", "Serinhisar", "Tavas"]
  },
  {
    id: 21,
    name: "Diyarbakır",
    districts: ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"]
  },
  {
    id: 22,
    name: "Edirne",
    districts: ["Edirne", "Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Süloğlu", "Uzunköprü"]
  },
  {
    id: 23,
    name: "Elazığ",
    districts: ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Elazığ", "Karakoçan", "Keban", "Kovancılar", "Maden", "Palu", "Sivrice"]
  },
  {
    id: 24,
    name: "Erzincan",
    districts: ["Çayırlı", "Erzincan", "Ilıç", "Kemah", "Kemaliye", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"]
  },
  {
    id: 25,
    name: "Erzurum",
    districts: ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"]
  },
  {
    id: 26,
    name: "Eskişehir",
    districts: ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"]
  },
  {
    id: 27,
    name: "Gaziantep",
    districts: ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"]
  },
  {
    id: 28,
    name: "Giresun",
    districts: ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Giresun", "Görele", "Güce", "Keşap", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"]
  },
  {
    id: 29,
    name: "Gümüşhane",
    districts: ["Gümüşhane", "Kelkit", "Köse", "Kürtün", "Şiran", "Torul"]
  },
  {
    id: 30,
    name: "Hakkari",
    districts: ["Çukurca", "Hakkari", "Şemdinli", "Yüksekova"]
  },
  {
    id: 31,
    name: "Hatay",
    districts: ["Altınözü", "Antakya", "Belen", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Reyhanlı", "Samandağ", "Yayladağı"]
  },
  {
    id: 32,
    name: "Isparta",
    districts: ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Isparta", "Keçiborlu", "Şarkikaraağaç", "Senirkent", "Sütçüler", "Uluborlu", "Yalvaç", "Yenişarbademli"]
  },
  {
    id: 33,
    name: "Mersin",
    districts: ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"]
  },
  {
    id: 34,
    name: "İstanbul",
    districts: ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüp", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Şile", "Silivri", "Şişli", "Sultanbeyli", "Sultangazi", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"]
  },
  {
    id: 35,
    name: "İzmir",
    districts: ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"]
  },
  {
    id: 36,
    name: "Kars",
    districts: ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Kars", "Sarıkamış", "Selim", "Susuz"]
  },
  {
    id: 37,
    name: "Kastamonu",
    districts: ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Çatalzeytin", "Cide", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Kastamonu", "Küre", "Pınarbaşı", "Şenpazar", "Seydiler", "Taşköprü", "Tosya"]
  },
  {
    id: 38,
    name: "Kayseri",
    districts: ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"]
  },
  {
    id: 39,
    name: "Kırklareli",
    districts: ["Babaeski", "Demirköy", "Kırklareli", "Kofçaz", "Lüleburgaz", "Pehlivanköy", "Pınarhisar", "Vize"]
  },
  {
    id: 40,
    name: "Kırşehir",
    districts: ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Kırşehir", "Mucur"]
  },
  {
    id: 41,
    name: "Kocaeli",
    districts: ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"]
  },
  {
    id: 42,
    name: "Konya",
    districts: ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Çeltik", "Cihanbeyli", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"]
  },
  {
    id: 43,
    name: "Kütahya",
    districts: ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Kütahya", "Pazarlar", "Şaphane", "Simav", "Tavşanlı"]
  },
  {
    id: 44,
    name: "Malatya",
    districts: ["Akçadağ", "Arapkir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Malatya", "Pütürge", "Yazıhan", "Yeşilyurt"]
  },
  {
    id: 45,
    name: "Manisa",
    districts: ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Manisa", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Turgutlu"]
  },
  {
    id: 46,
    name: "Kahramanmaraş",
    districts: ["Afşin", "Andırın", "Çağlıyancerit", "Ekinözü", "Elbistan", "Göksun", "Kahramanmaraş", "Nurhak", "Pazarcık", "Türkoğlu"]
  },
  {
    id: 47,
    name: "Mardin",
    districts: ["Dargeçit", "Derik", "Kızıltepe", "Mardin", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"]
  },
  {
    id: 48,
    name: "Muğla",
    districts: ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Milas", "Muğla", "Ortaca", "Ula", "Yatağan"]
  },
  {
    id: 49,
    name: "Muş",
    districts: ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Muş", "Varto"]
  },
  {
    id: 50,
    name: "Nevşehir",
    districts: ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Nevşehir", "Ürgüp"]
  },
  {
    id: 51,
    name: "Niğde",
    districts: ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Niğde", "Ulukışla"]
  },
  {
    id: 52,
    name: "Ordu",
    districts: ["Akkuş", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Ordu", "Perşembe", "Ulubey", "Ünye"]
  },
  {
    id: 53,
    name: "Rize",
    districts: ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Pazar", "Rize"]
  },
  {
    id: 54,
    name: "Sakarya",
    districts: ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"]
  },
  {
    id: 55,
    name: "Samsun",
    districts: ["Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"]
  },
  {
    id: 56,
    name: "Siirt",
    districts: ["Aydınlar", "Baykan", "Eruh", "Kurtalan", "Pervari", "Siirt", "Şirvan"]
  },
  {
    id: 57,
    name: "Sinop",
    districts: ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Saraydüzü", "Sinop", "Türkeli"]
  },
  {
    id: 58,
    name: "Sivas",
    districts: ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Şarkışla", "Sivas", "Suşehri", "Ulaş", "Yıldızeli", "Zara"]
  },
  {
    id: 59,
    name: "Tekirdağ",
    districts: ["Çerkezköy", "Çorlu", "Hayrabolu", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Şarköy", "Tekirdağ"]
  },
  {
    id: 60,
    name: "Tokat",
    districts: ["Almus", "Artova", "Başçiftlik", "Erbaa", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Tokat", "Turhal", "Yeşilyurt", "Zile"]
  },
  {
    id: 61,
    name: "Trabzon",
    districts: ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Şalpazarı", "Sürmene", "Tonya", "Trabzon", "Vakfıkebir", "Yomra"]
  },
  {
    id: 62,
    name: "Tunceli",
    districts: ["Çemişgezek", "Hozat", "Mazgirt", "Nazımiye", "Ovacık", "Pertek", "Pülümür", "Tunceli"]
  },
  {
    id: 63,
    name: "Şanlıurfa",
    districts: ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Halfeti", "Harran", "Hilvan", "Şanlıurfa", "Siverek", "Suruç", "Viranşehir"]
  },
  {
    id: 64,
    name: "Uşak",
    districts: ["Banaz", "Eşme", "Karahallı", "Sivaslı", "Ulubey", "Uşak"]
  },
  {
    id: 65,
    name: "Van",
    districts: ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "Muradiye", "Özalp", "Saray", "Van"]
  },
  {
    id: 66,
    name: "Yozgat",
    districts: ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Saraykent", "Sarıkaya", "Şefaatli", "Sorgun", "Yenifakılı", "Yerköy", "Yozgat"]
  },
  {
    id: 67,
    name: "Zonguldak",
    districts: ["Alaplı", "Çaycuma", "Devrek", "Gökçebey", "Karadenizereğli", "Zonguldak"]
  },
  {
    id: 68,
    name: "Aksaray",
    districts: ["Ağaçören", "Aksaray", "Eskil", "Gülağaç", "Güzelyurt", "Ortaköy", "Sarıyahşi"]
  },
  {
    id: 69,
    name: "Bayburt",
    districts: ["Aydıntepe", "Bayburt", "Demirözü"]
  },
  {
    id: 70,
    name: "Karaman",
    districts: ["Ayrancı", "Başyayla", "Ermenek", "Karaman", "Kazımkarabekir", "Sarıveliler"]
  },
  {
    id: 71,
    name: "Kırıkkale",
    districts: ["Bahşili", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Kırıkkale", "Sulakyurt", "Yahşihan"]
  },
  {
    id: 72,
    name: "Batman",
    districts: ["Batman", "Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Sason"]
  },
  {
    id: 73,
    name: "Şırnak",
    districts: ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Silopi", "Şırnak", "Uludere"]
  },
  {
    id: 74,
    name: "Bartın",
    districts: ["Amasra", "Bartın", "Kurucaşile", "Ulus"]
  },
  {
    id: 75,
    name: "Ardahan",
    districts: ["Ardahan", "Çıldır", "Damal", "Göle", "Hanak", "Posof"]
  },
  {
    id: 76,
    name: "Iğdır",
    districts: ["Aralık", "Iğdır", "Karakoyunlu", "Tuzluca"]
  },
  {
    id: 77,
    name: "Yalova",
    districts: ["Altınova", "Armutlu", "Çiftlikköy", "Çınarcık", "Termal", "Yalova"]
  },
  {
    id: 78,
    name: "Karabük",
    districts: ["Eflani", "Eskipazar", "Karabük", "Ovacık", "Safranbolu", "Yenice"]
  },
  {
    id: 79,
    name: "Kilis",
    districts: ["Elbeyli", "Kilis", "Musabeyli", "Polateli"]
  },
  {
    id: 80,
    name: "Osmaniye",
    districts: ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Osmaniye", "Sumbas", "Toprakkale"]
  },
  {
    id: 81,
    name: "Düzce",
    districts: ["Akçakoca", "Çilimli", "Cumayeri", "Düzce", "Gölyaka", "Gümüşova", "Kaynaşlı", "Yığılca"]
  }
];

// Tüm Türkiye illeri (alfabetik sıralı, tam liste)
export const ALL_TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
  "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];
