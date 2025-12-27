
export const giftNoteTemplates = {
  love: {
    minimalist: "Zanaatın ve saflığın en tatlı haliyle... Tıpkı bizim gibi, yalın ve derin.",
    poetic: "Zamanla olgunlaşan, sabırla işlenen [ürün_adı] gibi... Her notada, paylaştığımız o eşsiz mirasın izleri var.",
    sensual: "[ürün_adı] tabletindeki [tadım_notları] notaları gibi, yerini bitişteki derin ve yoğun çikolata karakterine bırakan bir heyecan... Tıpkı seni tanıdığım o ilk andan bugüne dek derinleşen duygularım gibi.",
  },
  gratitude: {
    minimalist: "İnceliğin ve desteğin için küçük bir teşekkür. Tadı damağında, izi kalbimde.",
    poetic: "Bazı anlar, kelimelerin ötesinde bir zarafet hak eder. Hayatıma kattığın o tatlı dokunuş için minnettarım.",
    sensual: "Senin için seçtiğim [ürün_adı] içerisindeki [tadım_notları] aromaları, nezaketinin sıcaklığını temsil ediyor. Her bir parçasında teşekkürlerimin yankısını bulman dileğiyle.",
  },
  celebration: {
    minimalist: "Yeni bir zirve, yeni bir tat. Başarın daim, keyfin Sade olsun.",
    poetic: "Hayatın kutsal külliyatına altın harflerle yazılacak bir başarı. Bu anı, [köken] kökenli bu saf şaheserle taçlandırmak istedim.",
    sensual: "Damaktaki o enerjik ve [tadım_notları] aromaları, kutlamaya değer bu başarının ritmini tutuyor. Zirvenin tadını [ürün_adı] ile çıkar.",
  },
};

export type Emotion = keyof typeof giftNoteTemplates;
export type Persona = keyof typeof giftNoteTemplates[Emotion];
