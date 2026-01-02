import React, { useEffect } from 'react';
import { TastingQuiz as TastingQuizComponent } from '../components/TastingQuiz';
import { useTasteProfileStore } from '../stores/tasteProfileStore';
import { useUser } from '../context/UserContext';

export const TastingQuiz: React.FC = () => {
  const { user } = useUser();
  const { loadProfile, profile } = useTasteProfileStore();

  useEffect(() => {
    // Kullanıcı giriş yapmışsa mevcut profili yükle
    if (user?.uid) {
      loadProfile(user.uid);
    }
  }, [user?.uid, loadProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 dark:from-dark-900 dark:to-dark-800 pt-36 pb-40">
      <div className="container mx-auto px-4">
        {/* Intro section if no profile exists */}
        {!profile && (
          <div className="max-w-2xl mx-auto text-center mb-8 mt-4">
            <span className="inline-block text-5xl mb-3">🍫</span>
            <h1 className="text-3xl md:text-4xl font-serif text-chocolate-800 dark:text-cream-100 mb-4">
              Damak Tadınızı Keşfedin
            </h1>
            <p className="text-lg text-chocolate-600 dark:text-cream-300 mb-2">
              Kısa bir anket ile çikolata tercihlerinizi öğrenelim.
            </p>
            <p className="text-chocolate-500 dark:text-cream-400">
              AI Sommelier'imiz size özel öneriler sunacak.
            </p>
          </div>
        )}

        {/* Quiz Component */}
        <TastingQuizComponent />

        {/* Profile Summary if exists */}
        {profile && (
          <div className="max-w-xl mx-auto mt-12 p-6 bg-white dark:bg-dark-800 rounded-2xl shadow-lg">
            <h3 className="text-lg font-serif text-chocolate-800 dark:text-cream-100 mb-4">
              Mevcut Profiliniz
            </h3>

            {/* Segments */}
            {profile.segments.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-chocolate-500 dark:text-cream-400 mb-2">Kategoriniz:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.segments.map((segment) => (
                    <span
                      key={segment}
                      className="px-3 py-1 bg-chocolate-100 dark:bg-chocolate-900/30 text-chocolate-700 dark:text-cream-200 rounded-full text-sm"
                    >
                      {getSegmentLabel(segment)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {profile.aiSummary && (
              <div className="p-4 bg-cream-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-chocolate-600 dark:text-cream-300 italic">
                  "{profile.aiSummary}"
                </p>
              </div>
            )}

            {/* Last updated */}
            <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-4">
              Son güncelleme: {new Date(profile.updatedAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        )}
      </div>
    </div>
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
