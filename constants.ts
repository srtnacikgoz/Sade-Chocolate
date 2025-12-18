import { Product } from './types';

export const HERO_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCPsg3jC391kW1kEstLZOiXYJ4jKeH3Ert6-SapPNTbe7UBTW72yhpEVQxRGouZVEwRX-i7uX-GpwZ9neF6MrhK2LhPe6QLacGfceRfOdJ_K37BAQLTzLKt_h8sx6qhFiqVyw5uaRjTbWGfD6oCOVh_xQvZflmUXHakFaeSX4YdxsGfUBIP8_OuhOi-G3sU22UrQfU6LFC8NSCm6Mw9eemRL8gBfnlKax26WRn4jZX4-iYvm7G3kRAGdqFhRT98yXL0F2g2l_aL3cs";

export const COLLECTIONS = [
  {
    id: 'c1',
    title: 'Hediye Kutuları',
    description: 'Özel anlar için.',
    price: 450,
    currency: '₺',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbJ5QNuHRPNzmbTzlM8HiaIfvYQyUmHYZCGkGRzBLAZVBjrmg8muVn_uLTzyJ4IZkQyMGYpHWrMGELgzLI3g4sYocAwwqzrShnfi0RnF3bO2P-9fXxGy62mHftgN9AZPTGRXDzO44LuFUAFeKS2NxHavuan8eyO2FKk_JeejJKjb-Of8Z9TC2QHACMo7JkzHOOdHwPyL2pM_LiuZm8gY9RpqeBaaW98Br-Ga_W5yyq5TLBdG95zs2Tm6AGBNNYvymDyMM3x-NacKI'
  },
  {
    id: 'c2',
    title: 'Truffle Serisi',
    description: 'Yoğun lezzet.',
    price: 320,
    currency: '₺',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMLXTKh59g43vlTuyqgoPc4Fgnq-rl4s1r9tIBYoxCKuRqU2Bhd0TN9QRe0TpwD-KVpgQHcXo72voQm_k9l_slpZng3U1JmQayBKEAqK72PXEYyaRkF7a3PTVhVt3N8GosDykSHSeFYSQRRPo9ae3PSX9a_8Pd7mJw2ugm_qmy-Jq22CU37OWQP_7wcVayb0q_TT1Ae5yIBoDcgW7-9QIfVBMbQFiRNlqJAR61SABI7vuTvKppPVPzDEqah-Ar7h9wtBL3gEqtvCc'
  },
  {
    id: 'c3',
    title: 'Tablet Çikolata',
    description: '%70 Kakao.',
    price: 180,
    currency: '₺',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJnyCfUriN68tho5hC9VWjKb1kfNt1Kj8FOxRvN3SCkQiPBp0jvU7K3bGdKme7SAAmnGXhTt_pWaI2qOjjoyx0mQBxfMtT3rRjgss7YzIRyIEj6E0sJHGApBsoWHU11-xUZMaKcMOHgT1PPBL-64eQPkjQhJIE3-oDa-m4QYyK-gZZPCquLTIsu5OaFS9DWXAiQezNGwGRzLIywDN8eJ6w3c9X6m2i5n7SZOJDt1zMcF7nyZcDv5wMNSsok42LQ2zSKsHIrjq6vDs'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'El Yapımı Artizan Trüf Kutusu',
    description: 'Şeflerin elinden çıkan mücevherler',
    detailedDescription: 'Her biri Antalya\'daki atölyemizde, şeflerimizin ellerinde tek tek şekillenen mücevherler. Dışı çıtır Belçika çikolatası, içi ise taze krema ve gerçek meyve püreleriyle hazırlanan yumuşacık ganaj dolgusu. Boyasız, katkısız ve %100 el emeği. Bir kutu dolusu sanat.',
    origin: 'Antalya, Türkiye (Belçika Çikolatası ile)',
    tastingNotes: 'Çilek, Limon, Antep Fıstığı, Tuzlu Karamel',
    price: 450.00,
    currency: '₺',
    category: 'gift-box',
    tags: ['tag_fruity', 'tag_nuts', 'tag_silky'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP8SQLCG9bzwUDPvoC3mI9tIZufuHAmdwk_8jWe-2WwKpQuxgE-zgtT9BozBEWa0DG7sAOeTL3LKamJUYsJWJjLnowwYNWJlC379NA7qUBdCBNAfJNiWlL9BNcES92n78F5h16LGyRqJW_e8htTmf2Kk7LSKNsw_H8AI_gGCf8N0v--hFqsAdMl3SliSrubmfDPcAej4h8zn1Wx5SIreep1jZgm6p6jvXF5ER022v-2Q0VXvW0K3mvt1kXbcbwNZLY7kKFg1wEQY',
    video: 'https://videos.pexels.com/video-files/6090407/6090407-uhd_2560_1440_30fps.mp4',
    ingredients: 'Belçika çikolatası (kakao kitlesi, şeker, kakao yağı, süt tozu), taze krema, tereyağı, meyve püreleri (çilek, limon), kuruyemişler (fındık, fıstık), deniz tuzu.',
    allergens: 'Süt, soya, fındık, badem, antep fıstığı içerebilir. Glüten içerebilir.',
    sensory: { intensity: 60, sweetness: 70, creaminess: 90, fruitiness: 85, crunch: 40 }
  },
  {
    id: 'p2',
    title: 'Bitter Tablet (%70)',
    description: 'Dengeli güç, topraksı notalar',
    detailedDescription: 'Gerçek kakao tutkunları için bir saygı duruşu. Sade Patisserie\'nin imzası haline gelen bitter serimiz, acılık değil, kakaonun derinliğini sunar. Topraksı notalar, hafif meyvemsi bitiş ve tam kıvamında kavrulmuş çekirdeklerin gücü. Sadece çikolata değil, bir karakter.',
    origin: 'Venezuela',
    tastingNotes: 'Yoğun Kakao, Topraksı, Meyvemsi',
    price: 185.00,
    currency: '₺',
    category: 'tablet',
    tags: ['tag_intense', 'tag_vegan'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJnyCfUriN68tho5hC9VWjKb1kfNt1Kj8FOxRvN3SCkQiPBp0jvU7K3bGdKme7SAAmnGXhTt_pWaI2qOjjoyx0mQBxfMtT3rRjgss7YzIRyIEj6E0sJHGApBsoWHU11-xUZMaKcMOHgT1PPBL-64eQPkjQhJIE3-oDa-m4QYyK-gZZPCquLTIsu5OaFS9DWXAiQezNGwGRzLIywDN8eJ6w3c9X6m2i5n7SZOJDt1zMcF7nyZcDv5wMNSsok42LQ2zSKsHIrjq6vDs',
    video: 'https://videos.pexels.com/video-files/7036496/7036496-uhd_2560_1440_24fps.mp4',
    badge: 'New',
    ingredients: 'Kakao kitlesi, şeker, kakao yağı, emülgatör (soya lesitini), doğal vanilya aroması.',
    allergens: 'Soya ürünü içerir. Eser miktarda süt ürünü içerebilir.',
    sensory: { intensity: 95, sweetness: 20, creaminess: 30, acidity: 40, crunch: 80 }
  },
  {
    id: 'p3',
    title: 'Gold Çikolata Tablet',
    description: 'Karamelize senfoni',
    detailedDescription: 'Beyaz çikolatanın ateşteki dansı. İçindeki süt ve şekerin yavaşça karamelize edilmesiyle elde edilen, kehribar rengi bir başyapıt. Herhangi bir aroma verici değil, sadece ustalığın ve sabrın eseri olan o yoğun karamel, toffee ve hafif tuzlu tereyağı notaları damağınızı saracak.',
    origin: 'Belçika',
    tastingNotes: 'Karamel, Toffee, Tereyağı',
    price: 195.00,
    currency: '₺',
    category: 'tablet',
    tags: ['tag_silky'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjqOhvBngusto_92lMYI2KMz2NI9K7yatgV4HiHOZh1oqb0pkdBpagfgHulKLVbSrMUYws4KtZoLXn6LZWQarXSXc_J4UYz1jWKKHhpZsK6jtBaZVZ8OdmvlFCZhnSSJfLQh_Q-ydYBeBtFgMTTgrSfagxRNEhK7uz6-oNw_Mq2tlCmHCOCiR97SwVA9ntohNUpk1D2fDJnRSEJ718hpgDZeYEiKhHVEfAhCAVYYTiQDGo4k8VqxgBn2u6DQehNwIlMq6CbNl987c',
    video: 'https://videos.pexels.com/video-files/5091763/5091763-uhd_2560_1440_24fps.mp4',
    ingredients: 'Kakao yağı, şeker, tam yağlı süt tozu, laktoz, peynir altı suyu tozu, yağsız süt tozu, karamelize şeker (%2), emülgatör (soya lesitini), doğal vanilya, tuz.',
    allergens: 'Süt ürünü (laktoz), soya ürünü içerir. Eser miktarda sert kabuklu yemiş içerebilir.',
    isOutOfStock: true,
    sensory: { intensity: 40, sweetness: 80, creaminess: 95, crunch: 30 }
  },
  {
    id: 'p4',
    title: 'Velvet Beyaz Tablet',
    description: 'Beyazın en ipeksi hali',
    detailedDescription: 'Sıradan bir beyaz çikolata değil; o bir "Kadife". Yoğun süt notalarının, taze vanilya çubuklarının ferahlığıyla buluşması. Şekerin baskın olduğu o keskin tat yerine, damağınızda yavaşça eriyen, az şekerli ve kremsi bir doku hayal edin. Saf kakao yağının hafifliğiyle tanışın.',
    origin: 'Belçika',
    tastingNotes: 'Taze Süt, Vanilya, Kremsi',
    price: 195.00,
    currency: '₺',
    category: 'tablet',
    tags: ['tag_silky'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC3lWEV-WeRIfV4nzWK9bZ664ajoZ3eoDrtplgj2yNtEqgt7uu24jic9ClBvVsFOl-uBxe--L0jb5gPV5u2OTOc3ACorl0AQ_X5WtS1wX-lozSBj48E4gJgnNkdv_4f3ALQdlEiZTTNVbzRyJ5z6RArRH9SQSQFvwa3ogJn3DvGmCyIYUBfZ79ShH_U-gN27aEEvZDByzZwPGvkCPKXAAh5D74yzZS_KmxOR-DVFhr5peRmZOIX1iTLjU1D2gW_QViRlgqON2qaCc',
    video: 'https://videos.pexels.com/video-files/6849495/6849495-uhd_2560_1440_24fps.mp4',
    ingredients: 'Şeker, kakao yağı, tam yağlı süt tozu, emülgatör (soya lesitini), doğal vanilya aroması.',
    allergens: 'Süt ürünü (laktoz), soya ürünü içerir.',
    sensory: { intensity: 20, sweetness: 60, creaminess: 100, crunch: 20 }
  },
  {
    id: 'p5',
    title: 'Ruby Tablet',
    description: 'Doğanın pembe mucizesi',
    detailedDescription: 'Gıda boyası yok, illüzyon yok; sadece doğa var. Rengini ve o eşsiz mayhoşluğunu, özel Ruby kakao çekirdeğinden alan 4. tür çikolata. Kırmızı orman meyvelerini andıran tazeleyici asiditesi ve ipeksi dokusuyla, çikolata dünyasında ezber bozan bir deneyim.',
    origin: 'Brezilya / Ekvador',
    tastingNotes: 'Kırmızı Meyveler, Mayhoş, Taze',
    price: 210.00,
    currency: '₺',
    category: 'tablet',
    tags: ['tag_fruity'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC3lWEV-WeRIfV4nzWK9bZ664ajoZ3eoDrtplgj2yNtEqgt7uu24jic9ClBvVsFOl-uBxe--L0jb5gPV5u2OTOc3ACorl0AQ_X5WtS1wX-lozSBj48E4gJgnNkdv_4f3ALQdlEiZTTNVbzRyJ5z6RArRH9SQSQFvwa3ogJn3DvGmCyIYUBfZ79ShH_U-gN27aEEvZDByzZwPGvkCPKXAAh5D74yzZS_KmxOR-DVFhr5peRmZOIX1iTLjU1D2gW_QViRlgqON2qaCc',
    video: 'https://videos.pexels.com/video-files/5649179/5649179-uhd_2560_1440_24fps.mp4',
    ingredients: 'Şeker, kakao yağı, yağsız süt tozu, tam yağlı süt tozu, kakao kitlesi, emülgatör (soya lesitini), asit (sitrik asit), doğal vanilya aroması.',
    allergens: 'Süt ürünü (laktoz), soya ürünü içerir.',
    sensory: { intensity: 50, sweetness: 50, acidity: 85, fruitiness: 90, creaminess: 60 }
  },
  {
    id: 'p6',
    title: 'Sütlü Fındıklı Tablet',
    description: 'Klasik lezzet, bol fındık',
    detailedDescription: 'Geleneksel sütlü çikolatanın, Karadeniz\'in en kaliteli fındıklarıyla buluşması. Güvenli liman arayanlar, klasikten vazgeçmeyenler ve çocuklar için en doğru tercih. Her ısırıkta çıtır fındık parçaları ve yumuşak çikolata uyumu.',
    origin: 'Türkiye / Belçika',
    tastingNotes: 'Fındık, Süt, Kakao',
    price: 180.00,
    originalPrice: 200.00,
    currency: '₺',
    category: 'tablet',
    tags: ['tag_nuts', 'tag_silky'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqwXB7Y_gNcfsgG4MCYzUA6Xz4ZdAfaOVKfW5YPKKAHRIm4H3X159xE92MdqDa0jMpXy5Z2lE-rh0tr763aFEaD5PitL2ACsBIdBH0LMXrjkFbQuoPMKwQ659VVAhqs_zCEgi2mCHLCnXICSBP_Oaq-0NSjlXH2RWB82h-Law3czOU5AbRzU-eWZR78fm3TWZJ1LKxp7uaV-Nsn4WSDeYDCUsT5QmHZUr0Matr2mIQiYR2EmqkxFHnUWa2gSb9MtJxGlPtZr3QSxQ',
    video: 'https://videos.pexels.com/video-files/4110336/4110336-uhd_2560_1440_30fps.mp4',
    badge: 'Sale',
    ingredients: 'Şeker, kakao yağı, tam yağlı süt tozu, kakao kitlesi, fındık (%20), emülgatör (soya lesitini), doğal vanilya aroması.',
    allergens: 'Süt ürünü, soya, fındık içerir.',
    sensory: { intensity: 50, sweetness: 65, crunch: 90, creaminess: 70 }
  }
];

export const FEATURED_PRODUCT: Product = {
  id: 'featured',
  title: 'Special Karışık Kutu',
  description: 'Sade\'nin en sevilenlerinin birleşimi. Kararsızlar için mükemmel seçim.',
  price: 650,
  currency: '₺',
  category: 'gift-box',
  tags: ['tag_fruity', 'tag_nuts', 'tag_silky', 'tag_intense'],
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZczwKf5voGVSZ7Ysr3Mi6zR_p7ZiwwS06oIjdi_NS1FBV5mNJrZydaIQY4p3zdJABhzonyJx3hBP_jsYC_MKAmsWH2XYEjNr-HK-Bd19b3uhvT_zuhO5R6bw4xF7MePdhW6zIYskcHEB2HzG4FA7eMSK9K8Tj4QTlEvFOjWUWHu7NV36TfBrS_t-ubgL7zqH-uRNINJviAJxVMCUz3CWa1ESfajTarCel5KmcrWu6_PygICbM0_knskpk2lBY-7N5ygj-lsHuA38',
  video: 'https://videos.pexels.com/video-files/4553250/4553250-uhd_2560_1440_30fps.mp4',
  ingredients: 'Ürün çeşitliliğine göre değişir. Kutu içeriğinde Gold, Bitter, Sütlü ve Ruby çeşitleri bulunur.',
  allergens: 'Süt, soya, sert kabuklu yemişler içerir.',
  sensory: { intensity: 65, sweetness: 60, fruitiness: 50, crunch: 60, creaminess: 50 }
};