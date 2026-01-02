# 🎯 Konuşma Senaryoları (Conversation Flows) - Tam Rehber

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Admin Paneli Kullanımı](#admin-paneli-kullanımı)
4. [Teknik Detaylar](#teknik-detaylar)
5. [Örnekler](#örnekler)
6. [En İyi Pratikler](#en-iyi-praktikler)

---

## 🎬 Genel Bakış

**Konuşma Senaryoları**, müşterilerle AI Sommelier arasında interaktif, çok adımlı diyaloglar oluşturmanızı sağlar. Tıpkı bir telefon menüsü gibi, kullanıcı seçimlerine göre farklı yollar izler.

### ❓ Ne İşe Yarar?

- **Hediye Seçim Asistanı**: Kullanıcıya sorular sorarak ideal hediyeyi bul
- **Tat Profili Keşfi**: Kullanıcının lezzet tercihlerini öğren, ürün öner
- **Bütçe Bazlı Yönlendirme**: Fiyat aralığına göre filtrele ve öner
- **Alerjen/Diyet Filtreleme**: Vegan, glutensiz vb. ihtiyaçlara göre öner

### 🆚 Diğer Sistemlerden Farkı

| Özellik | Soru-Cevap (Bilgi Bankası) | Konuşma Senaryoları |
|---------|---------------------------|---------------------|
| Tek soru → Tek cevap | ✅ | ❌ |
| Çok adımlı diyalog | ❌ | ✅ |
| Dallanma (if/else mantığı) | ❌ | ✅ |
| Dinamik ürün önerisi | Kısıtlı | ✅ |
| Kullanıcı tercihlerini takip | ❌ | ✅ |

---

## 🏗️ Sistem Mimarisi

### 1. **Veri Yapısı**

Her senaryo şu bileşenlerden oluşur:

```typescript
ConversationFlow {
  id: string                  // Benzersiz kimlik
  name: string                // "Hediye Seçim Asistanı"
  trigger: string             // "hediye, armağan, sevgilime"
  startStepId: string         // "step1"
  steps: ConversationStep[]   // Adımlar dizisi
  active: boolean             // Aktif/Pasif
}

ConversationStep {
  id: string                  // "step1", "step2", "result1"
  type: 'question' | 'result' // Soru mu, sonuç mu?

  // Eğer type = 'question':
  question?: string           // "Bitter mi sütlü mü seversiniz?"
  options?: StepOption[]      // Cevap seçenekleri

  // Eğer type = 'result':
  resultMessage?: string      // Final mesajı
  productRecommendations?: string[] // Önerilen ürün ID'leri
}

StepOption {
  label: string               // "Bitter"
  nextStepId: string | null   // Bir sonraki adım ID'si (null = bitir)
}
```

### 2. **Akış Mantığı**

```
[Kullanıcı Mesajı]
    ↓
[Tetikleyici Eşleşti mi?] → Hayır → [Normal AI Yanıt]
    ↓ Evet
[Flow Başlat: İlk Soruyu Sor]
    ↓
[Kullanıcı Seçim Yapar]
    ↓
[Seçime Göre nextStepId'yi Bul]
    ↓
[nextStepId null mu?] → Evet → [Sonuç Göster & Flow Bitir]
    ↓ Hayır
[Sonraki Soruyu Sor]
    ↓
[Döngü Devam...]
```

### 3. **State Yönetimi**

Her kullanıcının konuşması için bir **ConversationState** tutulur:

```typescript
ConversationState {
  flowId: string              // Hangi senaryo aktif?
  currentStepId: string       // Hangi adımdayız?
  history: Array<{            // Geçmiş seçimler
    stepId: string
    question: string
    answer: string
  }>
}
```

Bu state, kullanıcı flow içindeyken saklanır ve her mesajda güncellenir.

---

## 🎮 Admin Paneli Kullanımı

### Adım 1: Admin Paneline Giriş
1. Admin paneline git
2. **SENARYOLAR** sekmesine tıkla

### Adım 2: Yeni Senaryo Oluştur
1. **"Yeni Senaryo"** butonuna bas
2. Temel bilgileri doldur:

```
Senaryo Adı: Hediye Seçim Asistanı
Açıklama: Müşterilere hediye seçiminde yardımcı olur
Tetikleyici: hediye, sevgilime hediye, armağan
```

**💡 Tetikleyici İpuçları:**
- Virgülle ayırarak birden fazla tetikleyici ekle
- Her tetikleyici bağımsız olarak eşleşir
- Çok kelimeli tetikleyiciler: tüm kelimeler geçmeli
  - ✅ "sevgilime hediye" → "Sevgilime" VE "hediye" geçmeli
  - ✅ "hediye" → Sadece "hediye" geçmeli

### Adım 3: Adımları Ekle

#### Soru Adımı Ekle
1. **"+ Soru Ekle"** butonuna tıkla
2. Soruyu yaz: `"Sevgiliniz için hediye paketinin şık olması önemli mi?"`
3. Seçenekleri ekle:
   - `"Evet, lüks paket istiyorum"` → **step2** (sonraki adım)
   - `"Hayır, içerik önemli"` → **step3** (farklı adım)

#### Sonuç Adımı Ekle
1. **"+ Sonuç Ekle"** butonuna tıkla
2. Sonuç mesajını yaz:
```
Harika seçim! Dark Truffle Collection (₺450) tam size göre.

✨ Lüks hediye kutusu
🍫 12 adet el yapımı truffle
💝 Özel hediye notu kartı dahil
```

### Adım 4: Akışı Bağla

Adımlar arasında bağlantı kurarken:
- Her seçeneğin **nextStepId** değeri var
- `step2`, `step3`, `result1` gibi ID'ler kullan
- **"Sonuç (Bitir)"** seçeneği → Flow sona erer

**Örnek Akış:**
```
step1 (Soru: Lüks paket önemli mi?)
  ├─ Evet → step2 (Soru: Dolgulu mu tablet mi?)
  │           ├─ Dolgulu → result1 (Sonuç: Truffle öner)
  │           └─ Tablet → result2 (Sonuç: Tablet set öner)
  └─ Hayır → step3 (Soru: Bitter mi sütlü mü?)
              ├─ Bitter → result3 (Sonuç: Dark öner)
              └─ Sütlü → result4 (Sonuç: Milk öner)
```

### Adım 5: Kaydet ve Aktif Et
1. **"Senaryoyu Kaydet"** butonuna bas
2. Senaryo otomatik olarak **aktif** olur
3. Ana ekrana dön, senaryo listesinde görünür

---

## 🔧 Teknik Detaylar

### Firestore Koleksiyonları

**`conversation_flows`** koleksiyonu:
```json
{
  "id": "flow_123",
  "name": "Hediye Seçim Asistanı",
  "trigger": "hediye, armağan",
  "startStepId": "step1",
  "steps": [
    {
      "id": "step1",
      "type": "question",
      "question": "Lüks paket önemli mi?",
      "options": [
        { "label": "Evet", "nextStepId": "step2" },
        { "label": "Hayır", "nextStepId": "step3" }
      ]
    },
    {
      "id": "step2",
      "type": "result",
      "resultMessage": "Truffle Collection öneriyorum!"
    }
  ],
  "active": true,
  "createdAt": "2025-12-28T10:00:00Z"
}
```

### Kod Akışı

#### 1. **Tetikleyici Eşleşmesi** (`aiResponseGenerator.ts:findMatchingFlow`)

```typescript
// Kullanıcı: "Sevgilime hediye almak istiyorum"
// Tetikleyici: "hediye, sevgilime hediye"

const triggers = "hediye, sevgilime hediye".split(',').map(t => t.trim());
// → ["hediye", "sevgilime hediye"]

// Her tetikleyiciyi kontrol et:
triggers.some(trigger => {
  const words = trigger.split(' '); // ["sevgilime", "hediye"]
  return words.every(word => userMessage.includes(word)); // true
});
// → EŞLEŞME! Flow başlat
```

#### 2. **Adım İşleme** (`aiResponseGenerator.ts:processFlowStep`)

```typescript
// step1'i işle
const step = flow.steps.find(s => s.id === 'step1');

if (step.type === 'question') {
  let message = "Lüks paket önemli mi?";
  message += "\n\n1. Evet\n2. Hayır";
  message += "\n\n💡 'Başa dön' yazarak yeniden başlayabilirsiniz.";

  // State'e kaydet: Şu an step1'deyiz
  setConversationState({
    flowId: flow.id,
    currentStepId: 'step1',
    history: []
  });

  return message;
}
```

#### 3. **Kullanıcı Yanıtı İşleme** (`aiResponseGenerator.ts:findNextStep`)

```typescript
// Kullanıcı: "1" veya "Evet" yazdı
// currentStepId: "step1"

const step = flow.steps.find(s => s.id === 'step1');

// Rakam kontrolü
if (userMessage === "1") {
  return step.options[0].nextStepId; // "step2"
}

// Metin eşleşmesi
if (userMessage.toLowerCase().includes("evet")) {
  const option = step.options.find(opt => opt.label.includes("Evet"));
  return option.nextStepId; // "step2"
}
```

#### 4. **Flow Sonu** (`aiResponseGenerator.ts`)

```typescript
// nextStepId === null → Flow bitti

if (!nextStepId) {
  // State'i temizle
  setConversationState(null);

  // Sonuç mesajını göster
  return resultMessage + "\n\n💡 Başka bir konuda yardım almak için 'başa dön' yazabilirsiniz.";
}
```

### Özel Özellikler

#### **🔄 Başa Dön**
Kullanıcı şunları yazarsa flow resetlenir:
- "başa dön"
- "yeniden başla"
- "reset"
- "iptal"
- "baştan"

```typescript
if (containsKeywords(userMessage, ['başa dön', 'yeniden başla', ...])) {
  setConversationState(null);
  return "Tamam, başa dönüyoruz. Size nasıl yardımcı olabilirim?";
}
```

#### **🚫 Kapsam Dışı Tespit**
Kullanıcı çikolata ile ilgili olmayan bir şey yazarsa:

```typescript
if (!isRelevantToChocolate(userMessage)) {
  return "Üzgünüm, ben sadece çikolata konusunda yardımcı olabilirim...";
}

// Çikolata ile ilgili anahtar kelimeler:
// çikolata, hediye, bitter, sütlü, fiyat, tat, kakao, vb.
```

---

## 💡 Örnekler

### Örnek 1: Basit Hediye Seçici

**Senaryo:**
```yaml
Ad: Hediye Seçici
Tetikleyici: hediye, armağan
```

**Akış:**
```
step1 (Soru): "Kime hediye alıyorsunuz?"
  ├─ Sevgiliye → result1: "Dark Truffle Collection öneriyorum"
  ├─ Anneye → result2: "Classic Collection Box öneriyorum"
  └─ Arkadaşa → result3: "Mini Truffle Set öneriyorum"
```

**Müşteri Deneyimi:**
```
Müşteri: "Hediye almak istiyorum"
AI: "Kime hediye alıyorsunuz?
1. Sevgiliye
2. Anneye
3. Arkadaşa

💡 'Başa dön' yazarak yeniden başlayabilirsiniz."

Müşteri: "1"
AI: "Dark Truffle Collection (₺450) öneriyorum!
[detaylar...]

💡 Başka bir konuda yardım almak için 'başa dön' yazabilirsiniz."
```

### Örnek 2: Çok Adımlı Tat Profili

**Senaryo:**
```yaml
Ad: Tat Profili Keşfi
Tetikleyici: hangi çikolata, ne alsam
```

**Akış:**
```
step1: "Daha önce artisan çikolata denediniz mi?"
  ├─ Evet → step2
  └─ Hayır → result_beginner

step2: "Hangi tat profilini seversiniz?"
  ├─ Yoğun bitter → step3a
  ├─ Dengeli → step3b
  └─ Kremsi tatlı → step3c

step3a: "Kakao oranı tercihiniz?"
  ├─ %70-75 → result_dark70
  ├─ %80-85 → result_dark85
  └─ %90+ → result_dark90
```

### Örnek 3: Bütçe Bazlı Filtreleme

**Akış:**
```
step1: "Hediye için ne kadar bütçe ayırdınız?"
  ├─ 200-300 TL → step2a
  ├─ 300-500 TL → step2b
  └─ 500+ TL → step2c

step2a: "Tek kişilik mi paylaşımlık mı?"
  ├─ Tek → result_mini
  └─ Paylaşımlık → result_medium

step2b: "Dolgulu çikolata mı tablet mi?"
  ├─ Dolgulu → result_truffle_medium
  └─ Tablet → result_tablet_premium

step2c: "Premium koleksiyonlar"
  → result_luxury
```

---

## ⭐ En İyi Praktikler

### ✅ Yapılması Gerekenler

1. **Kısa ve Net Sorular**
   - ❌ "Sizin için hangi özellikler önemli ve neye göre karar veriyorsunuz?"
   - ✅ "En önemli kriter nedir?"

2. **2-3 Seçenek**
   - Çok fazla seçenek kullanıcıyı bunaltır
   - İdeal: 2-4 arası

3. **Maksimum 5 Adım**
   - Uzun flow'lar sıkıcı olur
   - Hedef: 3-4 soru, 1 sonuç

4. **Açıklayıcı Seçenekler**
   - ❌ "Seçenek A" / "Seçenek B"
   - ✅ "Lüks paket" / "Sade paket"

5. **Sonuç Mesajlarına Detay**
   - Ürün adı, fiyat, özellikler
   - "Sepete eklemek ister misiniz?" gibi call-to-action

6. **Geniş Tetikleyiciler**
   - Tek kelime yerine birden fazla alternatif
   - ✅ "hediye, armağan, sürpriz, sevgilime"

### ❌ Kaçınılması Gerekenler

1. **10+ Adımlı Senaryolar**
   - Kullanıcı ilgisini kaybeder
   - 3-5 adımda tamamla

2. **Belirsiz Sorular**
   - "Ne istersiniz?" çok genel
   - Spesifik seçenekler sun

3. **Teknik Terimler**
   - "Cocoa butter content" yerine "Kakao yoğunluğu"
   - Sade dil kullan

4. **5+ Seçenekli Sorular**
   - Kullanıcı karar veremez
   - Maksimum 4 seçenek

5. **Döngüsel Akışlar**
   - step1 → step2 → step1 gibi sonsuz döngüler yasak
   - Her flow mutlaka bir **result** adımında bitmeli

---

## 🔍 Sorun Giderme

### "Senaryo Tetiklenmiyor"

**Olası Nedenler:**
1. Tetikleyici yanlış yazılmış
2. Senaryo **pasif** durumda
3. Kullanıcı mesajı tetikleyici ile eşleşmiyor

**Çözüm:**
```
1. Admin → SENARYOLAR → İlgili senaryoyu kontrol et
2. Tetikleyici: "hediye, armağan" gibi geniş tutun
3. Senaryo aktif mi? (Yeşil rozet olmalı)
```

### "Seçim Tanınmıyor"

**Olası Nedenler:**
1. Kullanıcı rakam yerine harf yazdı
2. Seçenek label'ı ile uyuşmuyor

**Sistem Şöyle Çalışır:**
- Kullanıcı **"1"** yazar → 1. seçenek
- Kullanıcı **"Evet"** yazar → "Evet" içeren seçenek
- Kullanıcı **"lüks paket"** yazar → "Lüks paket" içeren seçenek

### "Flow Ortasında Takılıyor"

**Çözüm:**
- Kullanıcıya "başa dön" yazmasını söyle
- Veya admin panelinden flow'u düzenle

---

## 📊 Performans & Analitik (Gelecek Özellikler)

Şu anda aktif değil, ama eklenebilir:

- **Senaryoların kaç kez çalıştığı**
- **Hangi dalların daha çok seçildiği**
- **Hangi adımda kullanıcıların %X'i ayrıldı**
- **Ortalama tamamlanma süresi**

---

## 🎓 Gemini/AI için Özet

Bu sistem, **decision tree (karar ağacı)** mantığıyla çalışan bir **konuşma yönetim sistemidir**.

**Ana Kavramlar:**
1. **Flow (Akış)**: Bir senaryonun tamamı (hediye seçimi, tat profili vb.)
2. **Step (Adım)**: Flow içindeki her bir soru veya sonuç
3. **Trigger (Tetikleyici)**: Flow'u başlatan anahtar kelimeler
4. **State (Durum)**: Kullanıcının flow içinde nerede olduğu bilgisi
5. **Option (Seçenek)**: Her sorunun olası cevapları

**Çalışma Prensibi:**
```
Kullanıcı Input → Tetikleyici Eşleşme → Flow Başlat →
Soru Sor → Kullanıcı Seçim → Eşleşen nextStepId Bul →
Sonraki Adım → ... → Sonuç Göster → Flow Bitir
```

**Veritabanı:**
- Firestore `conversation_flows` koleksiyonunda JSON olarak saklanır
- Her senaryo, adımlar dizisi ve seçenekler içerir
- Real-time senkronizasyon: Admin değişiklik yapar, anında yansır

**Ölçeklenebilirlik:**
- Sınırsız senaryo oluşturulabilir
- Her senaryo bağımsız çalışır
- Aynı anda birden fazla kullanıcı farklı flow'larda olabilir

---

## 📝 Lisans & Katkı

Bu sistem **Sade Chocolate** e-ticaret platformu için özel geliştirilmiştir.

**Geliştirme:** Claude Code (Anthropic) ile geliştirildi.
**Tarih:** Aralık 2025
**Versiyon:** 1.0.0
