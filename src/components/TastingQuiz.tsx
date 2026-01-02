import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasteProfileStore } from '../stores/tasteProfileStore';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FlavorNote, CacaoOrigin, TexturePreference, IntensityLevel, TastingQuestion } from '../types/tasteProfile';

// Default questions (fallback if Firestore config doesn't exist)
const DEFAULT_QUESTIONS: TastingQuestion[] = [
  {
    id: 'cacaoIntensity',
    type: 'slider',
    question: 'Kakao yoğunluğu tercihiniz nedir?',
    questionEn: 'What is your cacao intensity preference?',
    description: '1 = Hafif sütlü, 5 = Yoğun bitter',
    min: 1,
    max: 5
  },
  {
    id: 'sweetnessLevel',
    type: 'slider',
    question: 'Tatlılık seviyesi tercihiniz?',
    questionEn: 'What sweetness level do you prefer?',
    description: '1 = Minimum şeker, 5 = Tatlı',
    min: 1,
    max: 5
  },
  {
    id: 'flavorNotes',
    type: 'multiple',
    question: 'Hangi lezzet notalarını tercih edersiniz?',
    questionEn: 'Which flavor notes do you prefer?',
    description: 'Birden fazla seçebilirsiniz (en fazla 4)',
    options: [
      { value: 'fruity', label: 'Meyvemsi', labelEn: 'Fruity', icon: '🍒' },
      { value: 'nutty', label: 'Fındıksı', labelEn: 'Nutty', icon: '🌰' },
      { value: 'floral', label: 'Çiçeksi', labelEn: 'Floral', icon: '🌸' },
      { value: 'spicy', label: 'Baharatlı', labelEn: 'Spicy', icon: '🌶️' },
      { value: 'caramel', label: 'Karamelli', labelEn: 'Caramel', icon: '🍯' },
      { value: 'coffee', label: 'Kahvemsi', labelEn: 'Coffee', icon: '☕' },
      { value: 'vanilla', label: 'Vanilyalı', labelEn: 'Vanilla', icon: '🍦' },
      { value: 'citrus', label: 'Narenciye', labelEn: 'Citrus', icon: '🍊' }
    ]
  },
  {
    id: 'texturePreference',
    type: 'single',
    question: 'Doku tercihiniz nedir?',
    questionEn: 'What texture do you prefer?',
    options: [
      { value: 'smooth', label: 'Pürüzsüz & Kremsi', labelEn: 'Smooth & Creamy', icon: '✨' },
      { value: 'crunchy', label: 'Çıtır (Fındıklı/Karamelli)', labelEn: 'Crunchy', icon: '🥜' },
      { value: 'mixed', label: 'Karışık Doku', labelEn: 'Mixed Texture', icon: '🎭' }
    ]
  },
  {
    id: 'adventurousness',
    type: 'slider',
    question: 'Yeni tatlar denemeye ne kadar açıksınız?',
    questionEn: 'How open are you to trying new flavors?',
    description: '1 = Klasik severim, 5 = Her şeyi denerim',
    min: 1,
    max: 5
  }
];

interface QuizConfig {
  questions: TastingQuestion[];
  isActive: boolean;
  showOnHomepage: boolean;
}

export const TastingQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const {
    quizAnswers,
    currentStep,
    isLoading,
    isQuizComplete,
    setQuizAnswer,
    nextStep,
    prevStep,
    saveProfile,
    resetQuiz
  } = useTasteProfileStore();

  // Quiz config from Firestore
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    questions: DEFAULT_QUESTIONS,
    isActive: true,
    showOnHomepage: true
  });
  const [configLoading, setConfigLoading] = useState(true);

  // Local state for answers
  const [localAnswers, setLocalAnswers] = useState<Record<string, any>>({});

  // Fetch quiz config from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'quiz_config', 'default'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as QuizConfig;
        if (data.questions && data.questions.length > 0) {
          setQuizConfig(data);
        }
      }
      setConfigLoading(false);
    }, (error) => {
      console.error('Quiz config yüklenemedi:', error);
      setConfigLoading(false);
    });

    return () => unsub();
  }, []);

  // Initialize local answers from store
  useEffect(() => {
    setLocalAnswers({
      cacaoIntensity: quizAnswers.cacaoIntensity || 3,
      sweetnessLevel: quizAnswers.sweetnessLevel || 3,
      adventurousness: quizAnswers.adventurousness || 3,
      flavorNotes: quizAnswers.flavorNotes || [],
      texturePreference: quizAnswers.texturePreference || '',
      preferredOrigins: quizAnswers.preferredOrigins || [],
      ...quizAnswers
    });
  }, [quizAnswers]);

  const questions = quizConfig.questions;
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentQuestion = questions[currentStep];

  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: any) => {
    setLocalAnswers(prev => ({ ...prev, [questionId]: value }));
    setQuizAnswer(questionId as any, value);
  };

  // Handle slider change
  const handleSliderChange = (questionId: string, value: number) => {
    handleAnswerChange(questionId, value as IntensityLevel);
  };

  // Handle multi-select toggle
  const handleMultiSelectToggle = (questionId: string, value: string, maxSelect: number = 4) => {
    const current = (localAnswers[questionId] || []) as string[];
    let newValues: string[];

    if (current.includes(value)) {
      newValues = current.filter(v => v !== value);
    } else if (current.length < maxSelect) {
      newValues = [...current, value];
    } else {
      return; // Max reached
    }

    handleAnswerChange(questionId, newValues);
  };

  // Handle single select
  const handleSingleSelect = (questionId: string, value: string) => {
    handleAnswerChange(questionId, value);
  };

  const handleComplete = async () => {
    if (user?.uid) {
      await saveProfile(user.uid);
    } else {
      nextStep();
    }
  };

  const handleStartOver = () => {
    setLocalAnswers({});
    resetQuiz();
  };

  // Loading state
  if (configLoading) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="w-8 h-8 border-4 border-mocha-200 border-t-brown-900 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-mocha-400">Quiz yükleniyor...</p>
      </div>
    );
  }

  // Quiz not active
  if (!quizConfig.isActive) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <span className="text-4xl mb-4 block">🍫</span>
        <h2 className="text-2xl font-serif text-mocha-900 mb-2">Quiz Şu An Aktif Değil</h2>
        <p className="text-mocha-400">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  // Quiz complete
  if (isQuizComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-12 px-6"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-mocha-400 to-brown-900 rounded-full flex items-center justify-center">
          <span className="text-4xl">🍫</span>
        </div>

        <h2 className="text-3xl font-serif text-mocha-900 dark:text-cream-100 mb-4">
          Damak Tadı Profiliniz Hazır!
        </h2>

        <p className="text-mocha-400 dark:text-cream-200 mb-8">
          Artık size özel çikolata önerileri sunabiliriz.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/catalog')}
            className="w-full py-3 px-6 bg-brown-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
          >
            Önerilen Ürünleri Keşfet
          </button>

          <button
            onClick={handleStartOver}
            className="w-full py-3 px-6 border border-mocha-200 text-mocha-900 hover:bg-cream-100 dark:border-dark-600 dark:text-cream-200 dark:hover:bg-dark-700 rounded-xl font-medium transition-colors"
          >
            Anketi Tekrarla
          </button>
        </div>
      </motion.div>
    );
  }

  // No questions
  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <span className="text-4xl mb-4 block">📝</span>
        <h2 className="text-2xl font-serif text-mocha-900 mb-2">Soru Bulunamadı</h2>
        <p className="text-mocha-400">Admin panelinden quiz soruları ekleyin.</p>
      </div>
    );
  }

  // Slider Component
  const SliderQuestion: React.FC<{ question: TastingQuestion }> = ({ question }) => {
    const [displayValue, setDisplayValue] = useState(localAnswers[question.id] || 3);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseInt(e.target.value);
      setDisplayValue(newVal);
      handleSliderChange(question.id, newVal);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-serif text-mocha-900 dark:text-cream-100 mb-2">{question.question}</h3>
          {question.description && (
            <p className="text-mocha-400 dark:text-cream-200">{question.description}</p>
          )}
        </div>

        <div className="px-4 space-y-4">
          <div className="flex justify-center">
            <span className="bg-brown-900 text-white px-6 py-3 rounded-full text-2xl font-bold min-w-[60px] text-center shadow-lg">
              {displayValue}
            </span>
          </div>

          <input
            type="range"
            min={question.min || 1}
            max={question.max || 5}
            step={1}
            value={displayValue}
            onChange={handleChange}
            className="w-full h-3 rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #1a0f0a 0%, #1a0f0a ${((displayValue - 1) / 4) * 100}%, #E8DCC4 ${((displayValue - 1) / 4) * 100}%, #E8DCC4 100%)`
            }}
          />

          <div className="flex justify-between text-sm text-mocha-400 dark:text-cream-200">
            <span>{question.min || 1}</span>
            <span>{question.max || 5}</span>
          </div>
        </div>
      </div>
    );
  };

  // Multi Select Question
  const MultiSelectQuestion: React.FC<{ question: TastingQuestion }> = ({ question }) => {
    const selected = (localAnswers[question.id] || []) as string[];
    const maxSelect = 4;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-serif text-mocha-900 dark:text-cream-100 mb-2">{question.question}</h3>
          {question.description && (
            <p className="text-mocha-400 dark:text-cream-200">{question.description}</p>
          )}
          <p className="text-sm text-mocha-200 dark:text-cream-100 mt-1">
            (En fazla {maxSelect} seçim)
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(question.options || []).map((option) => (
            <button
              key={option.value}
              onClick={() => handleMultiSelectToggle(question.id, option.value, maxSelect)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selected.includes(option.value)
                  ? 'border-brown-900 bg-cream-100 dark:bg-dark-800'
                  : 'border-cream-200 dark:border-dark-600 hover:border-mocha-200'
              }`}
            >
              {option.icon && <span className="text-2xl mb-2 block">{option.icon}</span>}
              <span className="font-medium text-mocha-900 dark:text-cream-100 block">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Single Select Question
  const SingleSelectQuestion: React.FC<{ question: TastingQuestion }> = ({ question }) => {
    const selected = localAnswers[question.id] as string || '';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-serif text-mocha-900 dark:text-cream-100 mb-2">{question.question}</h3>
          {question.description && (
            <p className="text-mocha-400 dark:text-cream-200">{question.description}</p>
          )}
        </div>

        <div className="space-y-3">
          {(question.options || []).map((option) => (
            <button
              key={option.value}
              onClick={() => handleSingleSelect(question.id, option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                selected === option.value
                  ? 'border-brown-900 bg-cream-100 dark:bg-dark-800'
                  : 'border-cream-200 dark:border-dark-600 hover:border-mocha-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === option.value
                    ? 'border-brown-900 bg-brown-900'
                    : 'border-mocha-200'
                }`}
              >
                {selected === option.value && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex items-center gap-3">
                {option.icon && <span className="text-xl">{option.icon}</span>}
                <span className="font-medium text-mocha-900 dark:text-cream-100">
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render current question based on type
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'slider':
        return <SliderQuestion key={currentQuestion.id} question={currentQuestion} />;
      case 'multiple':
        return <MultiSelectQuestion key={currentQuestion.id} question={currentQuestion} />;
      case 'single':
        return <SingleSelectQuestion key={currentQuestion.id} question={currentQuestion} />;
      default:
        return <SliderQuestion key={currentQuestion.id} question={currentQuestion} />;
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-mocha-400 dark:text-cream-200 mb-2">
          <span>Adım {currentStep + 1} / {totalSteps}</span>
          <span>%{Math.round(progress)}</span>
        </div>
        <div className="h-2 bg-cream-200 dark:bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mocha-400 to-brown-900"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[300px]"
        >
          {renderQuestion()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            className="flex-1 py-3 px-6 border border-mocha-200 text-mocha-900 hover:bg-cream-100 dark:border-dark-600 dark:text-cream-200 dark:hover:bg-dark-700 rounded-xl font-medium transition-colors"
          >
            Geri
          </button>
        )}

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={nextStep}
            className="flex-1 py-3 px-6 bg-brown-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
          >
            Devam Et
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-mocha-400 to-brown-900 hover:from-mocha-200 hover:to-mocha-900 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Kaydediliyor...' : 'Tamamla'}
          </button>
        )}
      </div>

      {/* Skip option */}
      {!isLoggedIn && (
        <p className="text-center text-sm text-mocha-400 dark:text-cream-100 mt-6">
          Profilinizi kaydetmek için{' '}
          <button
            onClick={() => navigate('/login-gateway')}
            className="text-mocha-900 dark:text-cream-200 underline"
          >
            giriş yapın
          </button>
        </p>
      )}
    </div>
  );
};

export default TastingQuiz;
