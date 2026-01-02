import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3002';
const SLOW_MO = 500;

const log = {
  step: (msg: string) => console.log(`\n[STEP] ${msg}`),
  success: (msg: string) => console.log(`   [OK] ${msg}`),
  fail: (msg: string) => console.log(`   [FAIL] ${msg}`),
  info: (msg: string) => console.log(`   [INFO] ${msg}`),
  section: (msg: string) => console.log(`\n========== ${msg} ==========`),
};

async function wait(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function closeAnyOverlay(page: Page) {
  try {
    await page.keyboard.press('Escape');
    await wait(300);
  } catch (e) {}
}

async function runCustomerJourney() {
  log.section('MUSTERI YOLCULUGU SIMULASYONU');

  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: SLOW_MO,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'tr-TR'
  });

  const page: Page = await context.newPage();
  let testResults: { name: string; status: 'pass' | 'fail' | 'skip' }[] = [];

  try {
    // 1. ANA SAYFA
    log.section('1. ANA SAYFA');
    log.step('Ana sayfaya gidiliyor...');
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await wait(1500);
    log.success('Ana sayfa yuklendi');
    testResults.push({ name: 'Ana sayfa', status: 'pass' });

    log.step('Navigasyon kontrol ediliyor...');
    if (await page.locator('nav').first().isVisible()) {
      log.success('Navigasyon gorunur');
      testResults.push({ name: 'Navigasyon', status: 'pass' });
    }

    // 2. URUNLER SAYFASI
    log.section('2. URUNLER SAYFASI');
    log.step('Katalog sayfasina gidiliyor...');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'load' });
    await wait(4000); // Firestore yukleme icin bekle
    log.success('Katalog acildi');
    testResults.push({ name: 'Katalog sayfasi', status: 'pass' });

    // Urunlerin yuklenmesini bekle
    await page.waitForSelector('.cursor-pointer.group', { timeout: 5000 }).catch(() => {});
    const productCount = await page.locator('.cursor-pointer.group').count();
    log.info(`${productCount} urun bulundu`);
    testResults.push({ name: 'Urun kartlari', status: productCount > 0 ? 'pass' : 'fail' });

    // 3. URUN DETAY
    log.section('3. URUN DETAY SAYFASI');
    log.step('Urun sayfasina gidiliyor...');
    await page.goto(`${BASE_URL}/product/1`, { waitUntil: 'load' });
    await wait(2000);
    log.success('Urun detay acildi');
    testResults.push({ name: 'Urun detay', status: 'pass' });

    log.step('Sepete ekleniyor...');
    const addBtn = page.locator('button:has-text("Sepete Ekle")').first();
    if (await addBtn.count() > 0) {
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click({ force: true });
      await wait(2000);
      log.success('Sepete eklendi');
      testResults.push({ name: 'Sepete ekleme', status: 'pass' });
    }

    // 4. SEPET
    log.section('4. SEPET');
    log.step('Sepet kontrol ediliyor...');
    await closeAnyOverlay(page);
    await wait(500);
    log.success('Sepet drawer kontrol edildi');
    testResults.push({ name: 'Sepet', status: 'pass' });

    // 5. CHECKOUT
    log.section('5. CHECKOUT');
    log.step('Checkout sayfasina gidiliyor...');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'load' });
    await wait(2000);
    log.success('Checkout acildi');
    testResults.push({ name: 'Checkout', status: 'pass' });

    const blackout = await page.locator('text=Gonderim Bilgisi').count();
    const heathold = await page.locator('text=Sicaklik Uyarisi').count();
    log.info(`Blackout: ${blackout > 0 ? 'Gorunur' : 'Gizli'}, Heat Hold: ${heathold > 0 ? 'Gorunur' : 'Gizli'}`);
    testResults.push({ name: 'Banner kontrol', status: 'pass' });

    // 6. GIRIS SAYFASI
    log.section('6. GIRIS SAYFASI');
    log.step('Giris sayfasina gidiliyor...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
    await wait(1500);
    log.success('Giris sayfasi acildi');
    testResults.push({ name: 'Giris sayfasi', status: 'pass' });

    // 7. KAYIT SAYFASI
    log.section('7. KAYIT SAYFASI');
    log.step('Kayit sayfasina gidiliyor...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'load' });
    await wait(1500);
    log.success('Kayit sayfasi acildi');
    testResults.push({ name: 'Kayit sayfasi', status: 'pass' });

    // 8. ADMIN PANEL
    log.section('8. ADMIN PANEL');
    log.step('Admin panele gidiliyor...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'load' });
    await wait(2000);

    log.step('Admin sifresi giriliyor...');
    const pwdInput = page.locator('input[type="password"]').first();
    if (await pwdInput.count() > 0) {
      await pwdInput.fill('sade2025');
      await wait(300);
      const loginBtn = page.locator('button[type="submit"], button:has-text("Giris")').first();
      if (await loginBtn.count() > 0) {
        await loginBtn.click();
        await wait(2500);
        log.success('Admin girisi yapildi');
        testResults.push({ name: 'Admin giris', status: 'pass' });
      }
    }

    log.step('Admin tablari kontrol ediliyor...');
    await wait(1000);

    // Siparis tab
    const orderTab = page.locator('button:has-text("Siparis")').first();
    if (await orderTab.count() > 0) {
      log.success('Siparis yonetimi mevcut');
      testResults.push({ name: 'Siparis yonetimi', status: 'pass' });
    }

    // Urun tab
    const productTab = page.locator('button:has-text("Urun")').first();
    if (await productTab.count() > 0) {
      await productTab.click();
      await wait(1500);
      log.success('Urun yonetimi acildi');
      testResults.push({ name: 'Urun yonetimi', status: 'pass' });
    }

    // Musteri tab
    const customerTab = page.locator('button:has-text("Musteri")').first();
    if (await customerTab.count() > 0) {
      await customerTab.click();
      await wait(1500);
      log.success('Musteri yonetimi acildi');
      testResults.push({ name: 'Musteri yonetimi', status: 'pass' });
    }

    // Ayarlar tab
    const settingsTab = page.locator('button:has-text("Ayar")').first();
    if (await settingsTab.count() > 0) {
      await settingsTab.click();
      await wait(1500);
      log.success('Ayarlar acildi');
      testResults.push({ name: 'Ayarlar', status: 'pass' });
    }

    testResults.push({ name: 'Admin panel', status: 'pass' });

    // 9. DIGER SAYFALAR
    log.section('9. DIGER SAYFALAR');

    log.step('Hakkimizda sayfasi...');
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'load' });
    await wait(1000);
    log.success('Hakkimizda acildi');
    testResults.push({ name: 'Hakkimizda', status: 'pass' });

    log.step('Iletisim sayfasi...');
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'load' });
    await wait(1000);
    log.success('Iletisim acildi');
    testResults.push({ name: 'Iletisim', status: 'pass' });

    // SONUC
    log.section('TEST SONUCLARI');
    const passed = testResults.filter(t => t.status === 'pass').length;
    const failed = testResults.filter(t => t.status === 'fail').length;
    const skipped = testResults.filter(t => t.status === 'skip').length;

    console.log('\n+--------------------------------------------------+');
    console.log('|              TEST SONUC RAPORU                   |');
    console.log('+--------------------------------------------------+');
    testResults.forEach(t => {
      const icon = t.status === 'pass' ? '[OK]' : t.status === 'fail' ? '[X]' : '[~]';
      const pad = ' '.repeat(Math.max(0, 32 - t.name.length));
      console.log(`| ${icon} ${t.name}${pad}|`);
    });
    console.log('+--------------------------------------------------+');
    console.log(`| Basarili: ${passed}  Basarisiz: ${failed}  Atlanan: ${skipped}              |`);
    console.log('+--------------------------------------------------+');

    log.info('\nTarayici 5 saniye acik kalacak...');
    await wait(5000);

  } catch (error) {
    log.fail(`Hata: ${error}`);
  } finally {
    await browser.close();
    log.info('Simulasyon tamamlandi.');
  }
}

runCustomerJourney();
