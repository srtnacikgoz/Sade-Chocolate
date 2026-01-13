/**
 * İlk Admin Kurulum Scripti
 *
 * Bu script, Firebase Custom Claims kullanarak ilk admin kullanıcısını oluşturur.
 *
 * KULLANIM:
 * 1. Firebase Console'da admin yapılacak kullanıcı hesabı olmalı
 * 2. Cloud Functions deploy edilmiş olmalı
 * 3. ADMIN_MASTER_KEY environment variable set edilmiş olmalı
 *
 * Firebase Console'dan manuel kurulum:
 * - Firebase Console > Functions > setAdminClaim
 * - Test sekmesinde şu parametreleri girin:
 *   {
 *     "data": {
 *       "targetEmail": "admin@sadechocolate.com",
 *       "masterKey": "YOUR_MASTER_KEY"
 *     }
 *   }
 *
 * VEYA
 *
 * Client-side'dan (geçici):
 *
 * import { getFunctions, httpsCallable } from 'firebase/functions';
 *
 * const functions = getFunctions();
 * const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
 *
 * setAdminClaim({
 *   targetEmail: 'admin@sadechocolate.com',
 *   masterKey: 'YOUR_MASTER_KEY'
 * }).then(result => {
 *   console.log('Admin oluşturuldu:', result);
 * }).catch(error => {
 *   console.error('Hata:', error);
 * });
 */

// Bu dosya sadece dokümantasyon amaçlıdır.
// Gerçek kurulum Firebase Console veya client-side'dan yapılmalıdır.

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           SADE CHOCOLATE - ADMIN KURULUM KILAVUZU            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. Cloud Functions'ı deploy edin:                            ║
║     $ cd functions && firebase deploy --only functions        ║
║                                                               ║
║  2. ADMIN_MASTER_KEY'i Firebase'de ayarlayın:                 ║
║     $ firebase functions:secrets:set ADMIN_MASTER_KEY         ║
║     (Güçlü bir şifre girin, örn: 32 karakterlik random)       ║
║                                                               ║
║  3. Admin kullanıcı oluşturun (Firebase Console'da):          ║
║     - Firebase Console > Authentication > Users               ║
║     - "Add user" ile admin email/password oluşturun           ║
║                                                               ║
║  4. setAdminClaim fonksiyonunu çağırın:                       ║
║     Firebase Console > Functions > setAdminClaim > Test       ║
║     {                                                         ║
║       "data": {                                                ║
║         "targetEmail": "admin@example.com",                   ║
║         "masterKey": "YOUR_MASTER_KEY"                        ║
║       }                                                       ║
║     }                                                         ║
║                                                               ║
║  5. Admin paneline giriş yapın:                               ║
║     - Site footer'da Sade logosuna tıklayın                   ║
║     - Admin email ve şifresiyle giriş yapın                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

export {};
