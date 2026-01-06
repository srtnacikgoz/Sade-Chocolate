import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TastingQuiz as TastingQuizComponent } from '../components/TastingQuiz';
import { useTasteProfileStore } from '../stores/tasteProfileStore';
import { useUser } from '../context/UserContext';

export const TastingQuiz: React.FC = () => {
  const { user } = useUser();
  const { loadProfile, profile } = useTasteProfileStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Kullanıcı giriş yapmışsa mevcut profili yükle
    if (user?.uid) {
      loadProfile(user.uid);
    }
  }, [user?.uid, loadProfile]);

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-24 md:pt-32 lg:pt-36 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen animate-fade-in">
      {/* Back Button */}
      <div className="flex items-center gap-6 mb-12 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-dark-800 rounded-2xl hover:bg-gold hover:text-white dark:hover:text-black transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-display text-4xl lg:text-5xl font-bold dark:text-white italic tracking-tight">Damak Tadı Quiz</h2>
      </div>

      {/* Intro section if no profile exists */}
      {!profile && (
        <div className="max-w-2xl mx-auto text-center mb-12 p-8 bg-gray-50 dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700">
          <span className="inline-block text-5xl mb-4">🍫</span>
          <h3 className="font-display text-3xl md:text-4xl font-bold text-brown-900 dark:text-gold mb-4 italic">
            Damak Tadınızı Keşfedin
          </h3>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-2">
            Kısa bir anket ile çikolata tercihlerinizi öğrenelim.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI Sommelier'imiz size özel öneriler sunacak.
          </p>
        </div>
      )}

      {/* Quiz Component */}
      <div className="max-w-4xl mx-auto">
        <TastingQuizComponent />
      </div>

      {/* Profile Summary if exists */}
      {profile && (
        <div className="max-w-4xl mx-auto mt-12 p-8 bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">
            Mevcut Profiliniz
          </h3>

          {/* Segments */}
          {profile.segments.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">Kategoriniz:</p>
              <div className="flex flex-wrap gap-2">
                {profile.segments.map((segment) => (
                  <span
                    key={segment}
                    className="px-4 py-2 bg-gold/10 border border-gold/20 text-brown-900 dark:text-gold rounded-full text-sm font-bold"
                  >
                    {getSegmentLabel(segment)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {profile.aiSummary && (
            <div className="p-6 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "{profile.aiSummary}"
              </p>
            </div>
          )}

          {/* Last updated */}
          <p className="text-xs text-gray-400 mt-6 uppercase tracking-widest font-bold">
            Son güncelleme: {new Date(profile.updatedAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
      )}
    </main>
  );
};

// Segment label helper
function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    high_cacao_lover: 'Yüksek Kakao Sever',
    fruity_aroma_seeker: 'Meyvemsi Aroma Arayıcısı',
    praline_enthusiast: 'Pralin Tutkunu',
    classic_milk_fan: 'Klasik Sütlü Sever',
    adventurous_taster: 'Maceracı Tadımcı',
    sweet_tooth: 'Tatlı Sever',
    dark_purist: 'Bitter Puristi'
  };
  return labels[segment] || segment;
}

export default TastingQuiz;
