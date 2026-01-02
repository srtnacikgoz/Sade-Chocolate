import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TasteProfile,
  TastingQuizAnswers,
  CustomerSegment,
  FlavorNote,
  IntensityLevel,
  SensoryEvaluation
} from '../types/tasteProfile';
import {
  saveTasteProfile,
  getTasteProfile,
  addSensoryEvaluation,
  calculateSegments,
  generateAISummary
} from '../services/tasteProfileService';

interface TasteProfileStore {
  // State
  profile: TasteProfile | null;
  quizAnswers: TastingQuizAnswers;
  currentStep: number;
  isLoading: boolean;
  isQuizComplete: boolean;
  error: string | null;

  // Quiz Actions
  setQuizAnswer: <K extends keyof TastingQuizAnswers>(key: K, value: TastingQuizAnswers[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetQuiz: () => void;

  // Profile Actions
  loadProfile: (userId: string) => Promise<void>;
  saveProfile: (userId: string) => Promise<void>;
  addEvaluation: (evaluation: SensoryEvaluation) => Promise<void>;

  // Getters
  getRecommendedProducts: () => string[];
  getSegmentLabels: () => { segment: CustomerSegment; label: string }[];
}

// Segment label mapping (TR)
const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  high_cacao_lover: 'Yüksek Kakao Sever',
  fruity_aroma_seeker: 'Meyvemsi Aroma Arayıcısı',
  praline_enthusiast: 'Pralin Tutkunu',
  classic_milk_fan: 'Klasik Sütlü Sever',
  adventurous_taster: 'Maceracı Tadımcı',
  sweet_tooth: 'Tatlı Sever',
  dark_purist: 'Bitter Puristi'
};

export const useTasteProfileStore = create<TasteProfileStore>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      quizAnswers: {},
      currentStep: 0,
      isLoading: false,
      isQuizComplete: false,
      error: null,

      // Quiz Actions
      setQuizAnswer: (key, value) => {
        set((state) => ({
          quizAnswers: { ...state.quizAnswers, [key]: value }
        }));
      },

      nextStep: () => {
        const totalSteps = 6; // Total quiz steps
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, totalSteps - 1),
          isQuizComplete: state.currentStep + 1 >= totalSteps
        }));
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0)
        }));
      },

      resetQuiz: () => {
        set({
          quizAnswers: {},
          currentStep: 0,
          isQuizComplete: false
        });
      },

      // Profile Actions
      loadProfile: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const profile = await getTasteProfile(userId);
          set({ profile, isLoading: false });
        } catch (error) {
          set({ error: 'Profil yüklenemedi', isLoading: false });
        }
      },

      saveProfile: async (userId: string) => {
        const { quizAnswers } = get();
        set({ isLoading: true, error: null });

        try {
          // Calculate segments from answers
          const segments = calculateSegments({
            cacaoIntensity: quizAnswers.cacaoIntensity || 3,
            sweetnessLevel: quizAnswers.sweetnessLevel || 3,
            flavorNotes: quizAnswers.flavorNotes || [],
            adventurousness: quizAnswers.adventurousness || 3
          });

          // Generate AI summary
          const aiSummary = generateAISummary(quizAnswers, segments);

          // Create full profile
          const newProfile: TasteProfile = {
            id: userId,
            oderId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            preferences: {
              cacaoIntensity: quizAnswers.cacaoIntensity || 3,
              sweetnessLevel: quizAnswers.sweetnessLevel || 3,
              flavorNotes: quizAnswers.flavorNotes || [],
              texturePreference: quizAnswers.texturePreference || 'smooth',
              adventurousness: quizAnswers.adventurousness || 3
            },
            preferredOrigins: quizAnswers.preferredOrigins || [],
            avoidIngredients: quizAnswers.avoidIngredients || [],
            segments,
            evaluations: [],
            aiSummary
          };

          await saveTasteProfile(userId, newProfile);
          set({ profile: newProfile, isLoading: false, isQuizComplete: true });
        } catch (error) {
          set({ error: 'Profil kaydedilemedi', isLoading: false });
        }
      },

      addEvaluation: async (evaluation: SensoryEvaluation) => {
        const { profile } = get();
        if (!profile) return;

        set({ isLoading: true });
        try {
          await addSensoryEvaluation(profile.id, evaluation);
          set((state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  evaluations: [...state.profile.evaluations, evaluation],
                  updatedAt: new Date().toISOString()
                }
              : null,
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Değerlendirme kaydedilemedi', isLoading: false });
        }
      },

      // Getters
      getRecommendedProducts: () => {
        const { profile } = get();
        if (!profile) return [];

        // Bu fonksiyon ürün ID'lerini döndürür
        // Gerçek implementasyonda ProductContext ile entegre edilecek
        const recommendations: string[] = [];

        // Segmente göre öneriler
        if (profile.segments.includes('high_cacao_lover')) {
          recommendations.push('dark-85', 'single-origin-tanzania');
        }
        if (profile.segments.includes('fruity_aroma_seeker')) {
          recommendations.push('madagascar-red-fruit', 'ecuador-floral');
        }
        if (profile.segments.includes('praline_enthusiast')) {
          recommendations.push('hazelnut-praline', 'almond-crunch');
        }

        return recommendations;
      },

      getSegmentLabels: () => {
        const { profile } = get();
        if (!profile) return [];

        return profile.segments.map((segment) => ({
          segment,
          label: SEGMENT_LABELS[segment]
        }));
      }
    }),
    {
      name: 'taste-profile-storage',
      partialize: (state) => ({
        profile: state.profile,
        quizAnswers: state.quizAnswers
      })
    }
  )
);
