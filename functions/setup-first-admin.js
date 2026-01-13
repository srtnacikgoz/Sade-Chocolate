const admin = require('firebase-admin');

// Firebase Admin SDK'yı application default credentials ile başlat
admin.initializeApp({
  projectId: 'sade-chocolate-prod'
});

const targetEmail = 'bilgi@sadechocolate.com';

async function setupAdmin() {
  try {
    // Kullanıcıyı bul
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log('✓ Kullanıcı bulundu:', user.email);
    console.log('  UID:', user.uid);

    // Admin claim ekle
    await admin.auth().setCustomUserClaims(user.uid, {
      ...user.customClaims,
      admin: true,
      adminGrantedAt: new Date().toISOString()
    });

    console.log('✓ Admin yetkisi eklendi!');

    // Firestore'a kaydet
    const db = admin.firestore();
    await db.collection('admin_users').doc(user.uid).set({
      email: targetEmail,
      uid: user.uid,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: 'setup_script',
      active: true
    });

    console.log('✓ Firestore kaydı oluşturuldu!');
    console.log('\n🎉 Admin kurulumu tamamlandı!');
    console.log('\nŞimdi siteye gidip admin girişi yapabilirsiniz.');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ Kullanıcı bulunamadı!');
      console.error('   Önce', targetEmail, 'ile siteye kayıt olun.');
    } else {
      console.error('❌ Hata:', error.message);
    }
  }

  process.exit(0);
}

setupAdmin();
