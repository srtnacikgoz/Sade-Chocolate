// KVKK Madde 17 (silme hakkı) ve Madde 20 (veri taşınabilirliği) uyumu
import { db, auth } from '../lib/firebase';
import {
  collection, query, where, getDocs, doc, getDoc,
  writeBatch, updateDoc
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

// Kullanıcının tüm kişisel verilerini JSON olarak indir
export async function downloadUserData(uid: string, email: string): Promise<void> {
  const data: Record<string, unknown> = {
    indirmeTarihi: new Date().toISOString(),
    kvkkBilgi: 'KVKK Madde 20 kapsamında kişisel veri taşınabilirliği hakkınız gereği oluşturulmuştur.'
  };

  // 1. Profil bilgileri
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const profile = userDoc.data();
    data.profil = {
      ad: profile.firstName,
      soyad: profile.lastName,
      email: profile.email,
      telefon: profile.phone,
      dogumTarihi: profile.birthDate,
      adresler: profile.addresses,
      faturaProfileri: profile.invoiceProfiles
    };
  }

  // 2. Siparişler
  const ordersSnap = await getDocs(
    query(collection(db, 'orders'), where('customer.email', '==', email))
  );
  data.siparisler = ordersSnap.docs.map(d => {
    const o = d.data();
    return {
      siparisNo: o.id || d.id,
      durum: o.status,
      tarih: o.createdAt,
      urunler: o.items,
      odeme: { toplam: o.payment?.total, yontem: o.payment?.method },
      teslimat: { adres: o.shipping?.address, sehir: o.shipping?.city }
    };
  });

  // 3. Yorumlar
  const reviewsSnap = await getDocs(
    query(collection(db, 'reviews'), where('userId', '==', uid))
  );
  data.yorumlar = reviewsSnap.docs.map(d => {
    const r = d.data();
    return { urunId: r.productId, puan: r.rating, yorum: r.comment, tarih: r.createdAt };
  });

  // 4. Bülten aboneliği
  const newsletterSnap = await getDocs(
    query(collection(db, 'newsletter_subscribers'), where('email', '==', email))
  );
  data.bultenAboneligi = newsletterSnap.docs.map(d => d.data());

  // 5. Favoriler
  const favDoc = await getDoc(doc(db, 'favorites', uid));
  if (favDoc.exists()) {
    data.favoriler = favDoc.data();
  }

  // 6. Referans kodları
  const referralSnap = await getDocs(
    query(collection(db, 'referral_codes'), where('userId', '==', uid))
  );
  data.referansKodlari = referralSnap.docs.map(d => d.data());

  // JSON dosyasını indir
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `sade-chocolate-verilerim-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Hesabı kalıcı olarak sil, siparişleri anonimleştir (TTK 10 yıl saklama)
export async function deleteAccount(uid: string, email: string): Promise<void> {
  // 1. Siparişleri anonimleştir (silinmez, TTK gereği saklanır)
  const ordersSnap = await getDocs(
    query(collection(db, 'orders'), where('customer.email', '==', email))
  );
  for (const orderDoc of ordersSnap.docs) {
    await updateDoc(orderDoc.ref, {
      'customer.name': 'Silinmiş Kullanıcı',
      'customer.email': '',
      'customer.phone': '',
      'customer.address': '',
      userId: ''
    });
  }

  // 2-6: Diğer koleksiyonları sil (batch ile)
  const batch = writeBatch(db);

  // 2. Yorumları sil
  const reviewsSnap = await getDocs(
    query(collection(db, 'reviews'), where('userId', '==', uid))
  );
  reviewsSnap.docs.forEach(d => batch.delete(d.ref));

  // 3. Bülten aboneliğini sil
  const newsletterSnap = await getDocs(
    query(collection(db, 'newsletter_subscribers'), where('email', '==', email))
  );
  newsletterSnap.docs.forEach(d => batch.delete(d.ref));

  // 4. Oturumları sil
  const sessionsSnap = await getDocs(
    query(collection(db, 'sessions'), where('customerEmail', '==', email))
  );
  sessionsSnap.docs.forEach(d => batch.delete(d.ref));

  // 5. Favorileri sil
  const favRef = doc(db, 'favorites', uid);
  const favDoc = await getDoc(favRef);
  if (favDoc.exists()) {
    batch.delete(favRef);
  }

  // 6. Referans kodlarını sil
  const referralSnap = await getDocs(
    query(collection(db, 'referral_codes'), where('userId', '==', uid))
  );
  referralSnap.docs.forEach(d => batch.delete(d.ref));

  // 7. Kullanıcı dokümanını sil
  batch.delete(doc(db, 'users', uid));

  await batch.commit();

  // 8. Firebase Auth hesabını sil (en son)
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
}
