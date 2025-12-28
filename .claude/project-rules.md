# Sade Chocolate - Proje Kuralları

## ⚠️ KRİTİK KURAL: Kod Yazma Öncesi Onay

**ASLA** doğrudan kod yazmaya başlama! Her zaman:

1. ✅ **Fikir Dahil Et** - Konunun gelişimi için Kendi fikirlerini de sun
2. ✅ **Planı Açıkla** - Ne yapacağını detaylı anlat
3. ✅ **Kullanıcıdan Onay Al** - "Devam edeyim mi?" diye sor
4. ✅ **Onay Aldıktan Sonra** - Ancak o zaman kodu yaz

### Örnek Doğru Yaklaşım:
```
Kullanıcı: "Login sayfasına remember me ekle"

Claude: "Login sayfasına 'Beni Hatırla' checkbox'ı ekleyeceğim. Plan:
1. Login.tsx'e checkbox component ekle
2. useState ile rememberMe state'i oluştur
3. LocalStorage'a kaydet
4. Login fonksiyonuna gönder

Devam edeyim mi?"

Kullanıcı: "Evet"

Claude: [Kodu yazar]
```

### ❌ Yanlış Yaklaşım:
Direkt kodu yazmaya başlamak!

---

## Diğer Proje Kuralları

- Her commit'te `Co-Authored-By: Sertan ve Claude Sonnet 4.5` attribution ekle
- Build öncesi `npm run build` ile hata kontrolü yap
- Uncommitted değişikliklerin üzerine yazmadan önce uyar
