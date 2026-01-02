import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chrome, Apple, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { useUser } from '../context/UserContext'; // ✅ Yeni eklendi
import { toast } from 'sonner';

export const LoginGateway: React.FC = () => {
  const { t } = useLanguage();
  const { login } = useUser(); // ✅ Context'teki lüks giriş fonksiyonu mühürlendi
  const navigate = useNavigate();
  const [email, setEmail] = React.useState(''); // ✅ React.useState olarak eklendi
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Lütfen tüm alanları doldurun.");
    
    setLoading(true);
    try {
      await login(email, password, true); // ✅ 'true' ile Beni Hatırla aktif edilir
      toast.success("Artisan dünyasına hoş geldiniz! ✨");
      navigate('/home');
    } catch (error: any) {
      toast.error("Giriş yapılamadı. Şifrenizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // ✅ Google Popup ile giriş başlatılır, UserContext otomatik yakalar
      await signInWithPopup(auth, provider);
      toast.success("Artisan dünyasına Google ile hoş geldiniz! ✨");
      navigate('/home');
    } catch (error: any) {
      console.error(error);
      toast.error("Google girişi sırasında bir hata oluştu.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return toast.error("Lütfen önce e-posta adresinizi girin.");
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Şifre sıfırlama linki e-posta adresinize gönderildi.");
    } catch (error: any) {
      toast.error("Şifre sıfırlama hatası. E-posta adresinizi kontrol edin.");
    }
  };


  return (
    <main className="w-full max-w-screen-xl mx-auto pt-40 pb-24 px-6 min-h-screen animate-fade-in bg-cream-100 dark:bg-dark-900">
      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        
        {/* Sol: Karşılama ve Misafir Girişi */}
        <div className="space-y-12">
           <div className="relative aspect-square rounded-[60px] overflow-hidden shadow-luxurious border border-gray-100 dark:border-gray-800">
              <img src="https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Sade Experience" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12">
                 <h2 className="text-white font-display text-4xl font-bold italic mb-4">Sade Dünyasına Hoş Geldiniz</h2>
                 <p className="text-white/80 text-[10px] uppercase font-bold tracking-[0.3em]">Gerçek Çikolata • Katkısız Artizan</p>
              </div>
           </div>
           
           <div className="p-10 bg-gray-50 dark:bg-dark-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-display text-2xl font-bold mb-4 italic dark:text-white">Hızlıca Tamamla</h3>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed italic">"Kayıt olmadan, misafir olarak devam ederek siparişini saniyeler içinde tamamlayabilirsin."</p>
              <button 
                onClick={() => navigate('/checkout')}
                className="flex items-center gap-3 text-brown-900 dark:text-gold font-black text-[11px] uppercase tracking-[0.3em] group border-b border-gold/20 pb-2"
              >
                MİSAFİR OLARAK DEVAM ET <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
           </div>
        </div>

        {/* Sağ: Giriş Formu ve Sosyal Login */}
        <div className="space-y-12">
          <div className="space-y-4">
             <h1 className="font-display text-5xl font-bold italic dark:text-white">Giriş Yap</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Sade Artisan Member Experience</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
             <Input 
                label="E-POSTA" 
                placeholder="email@sade.com" 
                className="h-16 rounded-2xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
             />
             <Input 
                label="ŞİFRE" 
                placeholder="••••••••" 
                type="password" 
                className="h-16 rounded-2xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
             />
             <Button
                type="submit"
                loading={loading}
                className="w-full h-18 rounded-[25px] text-[11px] tracking-[0.3em] shadow-xl bg-brown-900 text-white dark:bg-gold dark:text-black"
             >
                OTURUM AÇ
             </Button>

             <button
               type="button"
               onClick={handleForgotPassword}
               className="text-[10px] text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors font-bold uppercase tracking-widest text-center w-full"
             >
               Şifremi Unuttum
             </button>
          </form>

          <div className="flex items-center gap-4 text-gray-300">
             <div className="h-px flex-1 bg-gray-100 dark:bg-dark-800"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">veya hızlı bağlantı</span>
             <div className="h-px flex-1 bg-gray-100 dark:bg-dark-800"></div>
          </div>

          <div className="flex flex-col gap-4">
             <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-4 h-18 border border-gray-100 dark:border-gray-800 rounded-[25px] hover:bg-gray-50 dark:hover:bg-dark-800 transition-all group shadow-sm active:scale-95 w-full"
              >
                <Chrome size={20} className="text-[#4285F4] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest dark:text-gray-300">GOOGLE İLE DEVAM ET</span>
             </button>
          </div>

          <p className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Henüz hesabın yok mu? {' '}
            <button onClick={() => navigate('/register')} className="text-brown-900 dark:text-white underline decoration-gold/50 hover:decoration-gold transition-all underline-offset-4">
              KAYIT OL
            </button>
          </p>
        </div>
      </div>
    </main>
  );
};