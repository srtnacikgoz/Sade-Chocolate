import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TasteProfile, CustomerSegment, TastingQuestion, FlavorNote } from '../../../types/tasteProfile';
import { Search, Users, PieChart, Settings, Trash2, Edit3, Plus, Save, X, ChevronDown, ChevronUp, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

// Segment label helper
const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  high_cacao_lover: 'Yüksek Kakao Sever',
  fruity_aroma_seeker: 'Meyvemsi Aroma Arayıcısı',
  praline_enthusiast: 'Pralin Tutkunu',
  classic_milk_fan: 'Klasik Sütlü Sever',
  adventurous_taster: 'Maceracı Tadımcı',
  sweet_tooth: 'Tatlı Sever',
  dark_purist: 'Bitter Puristi'
};

// Flavor note labels
const FLAVOR_LABELS: Record<FlavorNote, string> = {
  fruity: 'Meyvemsi',
  nutty: 'Fındıksı',
  floral: 'Çiçeksi',
  spicy: 'Baharatlı',
  earthy: 'Topraksı',
  caramel: 'Karamelli',
  vanilla: 'Vanilyalı',
  coffee: 'Kahvemsi',
  citrus: 'Narenciye'
};

// Default quiz questions
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
    description: 'Birden fazla seçebilirsiniz',
    options: [
      { value: 'fruity', label: 'Meyvemsi', labelEn: 'Fruity', icon: '🍓' },
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
  updatedAt: string;
}

interface CustomerProfile extends TasteProfile {
  customerEmail?: string;
  customerName?: string;
}

export const TasteQuizTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'results' | 'settings' | 'stats'>('results');
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    questions: DEFAULT_QUESTIONS,
    isActive: true,
    showOnHomepage: true,
    updatedAt: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | 'all'>('all');
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  // Fetch all taste profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'taste_profiles'), orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);

        // Get user data for each profile
        const profilesWithUser: CustomerProfile[] = [];

        for (const docSnap of snapshot.docs) {
          const profile = docSnap.data() as TasteProfile;

          // Try to get user info
          let customerEmail = '';
          let customerName = '';

          try {
            const userDoc = await getDocs(query(collection(db, 'users')));
            const user = userDoc.docs.find(d => d.id === docSnap.id);
            if (user) {
              const userData = user.data();
              customerEmail = userData.email || '';
              customerName = userData.displayName || userData.name || '';
            }
          } catch (e) {
            // User not found, continue
          }

          profilesWithUser.push({
            ...profile,
            id: docSnap.id,
            customerEmail,
            customerName
          });
        }

        setProfiles(profilesWithUser);
      } catch (error) {
        console.error('Profiller yüklenemedi:', error);
        toast.error('Profiller yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Fetch quiz config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'quiz_config', 'default'), (doc) => {
      if (doc.exists()) {
        setQuizConfig(doc.data() as QuizConfig);
      }
    });
    return () => unsub();
  }, []);

  // Save quiz config
  const handleSaveConfig = async () => {
    try {
      await setDoc(doc(db, 'quiz_config', 'default'), {
        ...quizConfig,
        updatedAt: new Date().toISOString()
      });
      toast.success('Quiz ayarları kaydedildi');
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error);
      toast.error('Kayıt sırasında hata oluştu');
    }
  };

  // Delete a profile
  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Bu müşterinin damak tadı profilini silmek istediğinize emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'taste_profiles', profileId));
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      toast.success('Profil silindi');
    } catch (error) {
      console.error('Profil silinemedi:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchQuery === '' ||
      profile.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSegment = segmentFilter === 'all' || profile.segments.includes(segmentFilter);

    return matchesSearch && matchesSegment;
  });

  // Calculate statistics
  const stats = {
    totalProfiles: profiles.length,
    segmentCounts: {} as Record<CustomerSegment, number>,
    avgCacaoIntensity: 0,
    avgSweetnessLevel: 0,
    popularFlavorNotes: {} as Record<FlavorNote, number>
  };

  profiles.forEach(profile => {
    // Segment counts
    profile.segments.forEach(segment => {
      stats.segmentCounts[segment] = (stats.segmentCounts[segment] || 0) + 1;
    });

    // Averages
    if (profile.preferences) {
      stats.avgCacaoIntensity += profile.preferences.cacaoIntensity || 0;
      stats.avgSweetnessLevel += profile.preferences.sweetnessLevel || 0;

      // Flavor notes
      profile.preferences.flavorNotes?.forEach(note => {
        stats.popularFlavorNotes[note] = (stats.popularFlavorNotes[note] || 0) + 1;
      });
    }
  });

  if (profiles.length > 0) {
    stats.avgCacaoIntensity = Math.round((stats.avgCacaoIntensity / profiles.length) * 10) / 10;
    stats.avgSweetnessLevel = Math.round((stats.avgSweetnessLevel / profiles.length) * 10) / 10;
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Email', 'Ad', 'Kakao Yoğunluğu', 'Tatlılık', 'Segmentler', 'Lezzet Notaları', 'Oluşturma Tarihi'];
    const rows = profiles.map(p => [
      p.id,
      p.customerEmail || '-',
      p.customerName || '-',
      p.preferences?.cacaoIntensity || '-',
      p.preferences?.sweetnessLevel || '-',
      p.segments.map(s => SEGMENT_LABELS[s]).join('; '),
      p.preferences?.flavorNotes?.map(n => FLAVOR_LABELS[n]).join('; ') || '-',
      new Date(p.createdAt).toLocaleDateString('tr-TR')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `damak-tadi-profilleri-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV dosyası indirildi');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-700">
      {/* Section Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveSection('results')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
            activeSection === 'results'
              ? 'bg-brown-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Users size={18} />
          Müşteri Sonuçları
        </button>
        <button
          onClick={() => setActiveSection('stats')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
            activeSection === 'stats'
              ? 'bg-brown-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <PieChart size={18} />
          İstatistikler
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
            activeSection === 'settings'
              ? 'bg-brown-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Settings size={18} />
          Quiz Ayarları
        </button>
      </div>

      {/* Results Section */}
      {activeSection === 'results' && (
        <div className="bg-white rounded-[32px] border border-gray-200/60 p-8">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Email veya ID ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brown-900/20"
              />
            </div>

            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value as CustomerSegment | 'all')}
              className="px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brown-900/20"
            >
              <option value="all">Tüm Segmentler</option>
              {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <Download size={18} />
              CSV İndir
            </button>
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-mocha-200 border-t-brown-900 rounded-full animate-spin" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {profiles.length === 0 ? 'Henüz quiz sonucu bulunmuyor' : 'Filtrelere uygun sonuç bulunamadı'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProfiles.map(profile => (
                <div
                  key={profile.id}
                  className="bg-gray-50 rounded-2xl overflow-hidden"
                >
                  {/* Profile Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedProfile(expandedProfile === profile.id ? null : profile.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-mocha-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">🍫</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {profile.customerName || profile.customerEmail || profile.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(profile.updatedAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Segments */}
                      <div className="flex gap-1">
                        {profile.segments.slice(0, 2).map(segment => (
                          <span
                            key={segment}
                            className="px-2 py-1 bg-mocha-100 text-mocha-900 rounded-full text-xs"
                          >
                            {SEGMENT_LABELS[segment]}
                          </span>
                        ))}
                        {profile.segments.length > 2 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                            +{profile.segments.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      {expandedProfile === profile.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedProfile === profile.id && (
                    <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Kakao Yoğunluğu</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brown-900 rounded-full"
                                style={{ width: `${(profile.preferences?.cacaoIntensity || 1) * 20}%` }}
                              />
                            </div>
                            <span className="font-bold text-mocha-900">
                              {profile.preferences?.cacaoIntensity || '-'}/5
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-1">Tatlılık Seviyesi</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gold rounded-full"
                                style={{ width: `${(profile.preferences?.sweetnessLevel || 1) * 20}%` }}
                              />
                            </div>
                            <span className="font-bold text-gold">
                              {profile.preferences?.sweetnessLevel || '-'}/5
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-1">Maceracılık</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${(profile.preferences?.adventurousness || 1) * 20}%` }}
                              />
                            </div>
                            <span className="font-bold text-purple-600">
                              {profile.preferences?.adventurousness || '-'}/5
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-1">Doku Tercihi</p>
                          <p className="font-semibold text-gray-700">
                            {profile.preferences?.texturePreference === 'smooth' ? 'Pürüzsüz' :
                             profile.preferences?.texturePreference === 'crunchy' ? 'Çıtır' :
                             profile.preferences?.texturePreference === 'mixed' ? 'Karışık' : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Flavor Notes */}
                      {profile.preferences?.flavorNotes && profile.preferences.flavorNotes.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-2">Tercih Edilen Lezzet Notaları</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferences.flavorNotes.map(note => (
                              <span
                                key={note}
                                className="px-3 py-1 bg-cream-100 text-mocha-900 rounded-full text-sm"
                              >
                                {FLAVOR_LABELS[note]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Summary */}
                      {profile.aiSummary && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                          <p className="text-xs text-purple-600 font-semibold mb-1">AI Özet</p>
                          <p className="text-sm text-gray-700 italic">"{profile.aiSummary}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Section */}
      {activeSection === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overview */}
          <div className="bg-white rounded-[32px] border border-gray-200/60 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Genel Bakış</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-mocha-50 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-mocha-900">{stats.totalProfiles}</p>
                <p className="text-xs text-mocha-400">Toplam Profil</p>
              </div>

              <div className="bg-gold/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-gold">{stats.avgCacaoIntensity}</p>
                <p className="text-xs text-gold">Ort. Kakao Yoğunluğu</p>
              </div>

              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.avgSweetnessLevel}</p>
                <p className="text-xs text-purple-600">Ort. Tatlılık</p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {Object.keys(stats.segmentCounts).length}
                </p>
                <p className="text-xs text-emerald-600">Aktif Segment</p>
              </div>
            </div>
          </div>

          {/* Segment Distribution */}
          <div className="bg-white rounded-[32px] border border-gray-200/60 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Segment Dağılımı</h3>

            <div className="space-y-3">
              {Object.entries(stats.segmentCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([segment, count]) => (
                  <div key={segment} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {SEGMENT_LABELS[segment as CustomerSegment]}
                        </span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-mocha-400 to-brown-900 rounded-full transition-all"
                          style={{ width: `${(count / stats.totalProfiles) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {stats.totalProfiles > 0 ? Math.round((count / stats.totalProfiles) * 100) : 0}%
                    </span>
                  </div>
                ))}

              {Object.keys(stats.segmentCounts).length === 0 && (
                <p className="text-center text-gray-400 py-4">Henüz veri yok</p>
              )}
            </div>
          </div>

          {/* Popular Flavor Notes */}
          <div className="bg-white rounded-[32px] border border-gray-200/60 p-8 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Popüler Lezzet Notaları</h3>

            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.popularFlavorNotes)
                .sort((a, b) => b[1] - a[1])
                .map(([note, count]) => (
                  <div
                    key={note}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cream-50 to-cream-100 rounded-full"
                  >
                    <span className="font-medium text-mocha-900">
                      {FLAVOR_LABELS[note as FlavorNote]}
                    </span>
                    <span className="text-xs bg-mocha-200 text-mocha-900 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}

              {Object.keys(stats.popularFlavorNotes).length === 0 && (
                <p className="text-gray-400">Henüz veri yok</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="bg-white rounded-[32px] border border-gray-200/60 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">Quiz Ayarları</h3>
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-2 px-6 py-3 bg-brown-900 text-white rounded-xl hover:bg-black transition-colors"
            >
              <Save size={18} />
              Kaydet
            </button>
          </div>

          {/* Quick Settings */}
          <div className="flex gap-6 mb-8 pb-8 border-b border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={quizConfig.isActive}
                onChange={(e) => setQuizConfig({ ...quizConfig, isActive: e.target.checked })}
                className="w-5 h-5 rounded-lg border-gray-300 text-mocha-400 focus:ring-brown-900"
              />
              <span className="text-sm font-medium text-gray-700">Quiz Aktif</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={quizConfig.showOnHomepage}
                onChange={(e) => setQuizConfig({ ...quizConfig, showOnHomepage: e.target.checked })}
                className="w-5 h-5 rounded-lg border-gray-300 text-mocha-400 focus:ring-brown-900"
              />
              <span className="text-sm font-medium text-gray-700">Ana Sayfada Göster</span>
            </label>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quiz Soruları</h4>
              <button
                onClick={() => {
                  const newQuestion: TastingQuestion = {
                    id: `custom_${Date.now()}`,
                    type: 'slider',
                    question: 'Yeni soru metni',
                    questionEn: 'New question text',
                    description: 'Açıklama',
                    min: 1,
                    max: 5
                  };
                  setQuizConfig({
                    ...quizConfig,
                    questions: [...quizConfig.questions, newQuestion]
                  });
                  setEditingQuestion(newQuestion.id);
                  toast.success('Yeni soru eklendi');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Yeni Soru Ekle
              </button>
            </div>

            {quizConfig.questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-gray-50 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={question.type}
                        onChange={(e) => {
                          const updated = [...quizConfig.questions];
                          updated[index].type = e.target.value as 'slider' | 'single' | 'multiple' | 'rating';
                          setQuizConfig({ ...quizConfig, questions: updated });
                        }}
                        className="text-xs font-bold bg-brown-100 text-brown-700 px-2 py-1 rounded border-none cursor-pointer"
                      >
                        <option value="slider">Slider</option>
                        <option value="single">Tekli Seçim</option>
                        <option value="multiple">Çoklu Seçim</option>
                        <option value="rating">Değerlendirme</option>
                      </select>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>

                    {editingQuestion === question.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => {
                            const updated = [...quizConfig.questions];
                            updated[index].question = e.target.value;
                            setQuizConfig({ ...quizConfig, questions: updated });
                          }}
                          className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brown-900/20"
                          placeholder="Soru metni"
                        />
                        <input
                          type="text"
                          value={question.description || ''}
                          onChange={(e) => {
                            const updated = [...quizConfig.questions];
                            updated[index].description = e.target.value;
                            setQuizConfig({ ...quizConfig, questions: updated });
                          }}
                          className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brown-900/20 text-sm"
                          placeholder="Açıklama (opsiyonel)"
                        />

                        {/* Seçenek düzenleme - Tekli/Çoklu seçim için */}
                        {(question.type === 'single' || question.type === 'multiple') && (
                          <div className="mt-4 p-4 bg-gray-100 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gray-500 uppercase">Seçenekler</span>
                              <button
                                onClick={() => {
                                  const updated = [...quizConfig.questions];
                                  const newOption = {
                                    value: `option_${Date.now()}`,
                                    label: 'Yeni seçenek',
                                    labelEn: 'New option',
                                    icon: '📌'
                                  };
                                  updated[index].options = [...(updated[index].options || []), newOption];
                                  setQuizConfig({ ...quizConfig, questions: updated });
                                }}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                              >
                                <Plus size={14} />
                                Seçenek Ekle
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(question.options || []).map((opt, optIndex) => (
                                <div key={opt.value} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt.icon || ''}
                                    onChange={(e) => {
                                      const updated = [...quizConfig.questions];
                                      updated[index].options![optIndex].icon = e.target.value;
                                      setQuizConfig({ ...quizConfig, questions: updated });
                                    }}
                                    className="w-12 px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-center text-sm"
                                    placeholder="🔹"
                                  />
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => {
                                      const updated = [...quizConfig.questions];
                                      updated[index].options![optIndex].label = e.target.value;
                                      setQuizConfig({ ...quizConfig, questions: updated });
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm"
                                    placeholder="Seçenek adı"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = [...quizConfig.questions];
                                      updated[index].options = updated[index].options!.filter((_, i) => i !== optIndex);
                                      setQuizConfig({ ...quizConfig, questions: updated });
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              {(!question.options || question.options.length === 0) && (
                                <p className="text-xs text-gray-400 text-center py-2">Henüz seçenek eklenmemiş</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900">{question.question}</p>
                        {question.description && (
                          <p className="text-sm text-gray-500 mt-1">{question.description}</p>
                        )}
                      </>
                    )}

                    {/* Options for select questions - sadece düzenleme modunda değilken göster */}
                    {editingQuestion !== question.id && question.options && question.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {question.options.map(opt => (
                          <span
                            key={opt.value}
                            className="px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200"
                          >
                            {opt.icon} {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingQuestion(editingQuestion === question.id ? null : question.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        editingQuestion === question.id
                          ? 'bg-brown-100 text-brown-700'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={editingQuestion === question.id ? 'Kaydet' : 'Düzenle'}
                    >
                      {editingQuestion === question.id ? <X size={18} /> : <Edit3 size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
                          const updated = quizConfig.questions.filter((_, i) => i !== index);
                          setQuizConfig({ ...quizConfig, questions: updated });
                          toast.success('Soru silindi');
                        }
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {quizConfig.questions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Henüz soru eklenmemiş. Yukarıdaki butona tıklayarak yeni soru ekleyin.
              </div>
            )}
          </div>

          {/* Last Updated */}
          <p className="text-xs text-gray-400 mt-6 text-right">
            Son güncelleme: {new Date(quizConfig.updatedAt).toLocaleString('tr-TR')}
          </p>
        </div>
      )}
    </div>
  );
};
