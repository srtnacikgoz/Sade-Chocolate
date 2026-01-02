import React, { useState } from 'react';
import { Button } from '../../ui/Button';

// 10 Aktif Kullanıcı Oturumu (Real-time Session Tracking)
const INITIAL_SESSIONS = [
  { id: 's1', name: 'Ayşe Y.', segment: 'B2C', device: 'Mobile', duration: '3dk', stage: 'entry' },
  { id: 's2', name: 'Mehmet D.', segment: 'B2C', device: 'Desktop', duration: '12dk', stage: 'entry' },
  { id: 's3', name: 'Global Holding', segment: 'B2B', device: 'Desktop', duration: '45dk', stage: 'entry' },
  { id: 's4', name: 'Caner Ö.', segment: 'B2C', device: 'Tablet', duration: '5dk', stage: 'entry' },
  { id: 's5', name: 'Zeynep A.', segment: 'B2C', device: 'Mobile', duration: '8dk', stage: 'entry' },
  { id: 's6', name: 'Tech Corp', segment: 'B2B', device: 'Desktop', duration: '22dk', stage: 'entry' },
  { id: 's7', name: 'Burak T.', segment: 'B2C', device: 'Mobile', duration: '2dk', stage: 'entry' },
  { id: 's8', name: 'Selin I.', segment: 'B2C', device: 'Desktop', duration: '18dk', stage: 'entry' },
  { id: 's9', name: 'Deniz M.', segment: 'B2C', device: 'Mobile', duration: '6dk', stage: 'entry' },
  { id: 's10', name: 'Otel Grand', segment: 'B2B', device: 'Desktop', duration: '55dk', stage: 'entry' },
];

const JOURNEY_STAGES = [
  { id: 'entry', label: 'Giriş (Landing)', icon: '🎯' },
  { id: 'catalog', label: 'Katalog Keşfi', icon: '🍫' },
  { id: 'product', label: 'Ürün İnceleme', icon: '🔍' },
  { id: 'cart', label: 'Sepete Ekleme', icon: '🛒' },
  { id: 'checkout', label: 'Ödeme (Checkout)', icon: '💳' },
  { id: 'exit', label: 'Oturum Sonlandı', icon: '✅' },
];

export const BehaviorTrackingTab: React.FC = () => {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    let step = 0;
    const interval = setInterval(() => {
      setSessions(prev => prev.map(session => {
        // Journey Flow Logic (Context-Aware Event Engine Simülasyonu)
        if (session.stage === 'entry') return { ...session, stage: 'catalog' };
        if (session.stage === 'catalog') return { ...session, stage: 'product' };
        if (session.stage === 'product') {
          // B2B kullanıcılar daha yüksek dönüşüm
          const isB2B = session.segment === 'B2B';
          const isDesktop = session.device === 'Desktop';
          return (isB2B || isDesktop) ? { ...session, stage: 'cart' } : { ...session, stage: 'exit' };
        }
        if (session.stage === 'cart') return { ...session, stage: 'checkout' };
        if (session.stage === 'checkout') return { ...session, stage: 'exit' };
        return session;
      }));

      step++;
      if (step > 5) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1800);
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="text-brand-mustard text-[10px] font-bold uppercase tracking-[0.5em] mb-3 block">
          Real-Time Behavioral Analytics
        </span>
        <h2 className="font-display text-5xl italic text-brown-900 dark:text-white mb-6">
          Müşteri Yolculuk Haritası
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 text-sm">
          SPA route tracking ve Context-Aware Event Engine ile 10 aktif oturumun gerçek zamanlı yolculuk simülasyonu.
        </p>
        <Button
          onClick={runSimulation}
          disabled={isSimulating}
          className="px-12 rounded-full bg-brand-mustard hover:bg-brand-orange text-white"
        >
          {isSimulating ? 'Yolculuk İşleniyor...' : 'Simülasyonu Başlat'}
        </Button>
      </div>

      {/* Canvas Journey Visualizer */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between relative">
        {JOURNEY_STAGES.map((stage, idx) => (
          <div key={stage.id} className="flex-1 relative">
            <div
              className={`p-6 rounded-[30px] border-2 transition-all duration-500 flex flex-col items-center gap-4 ${
                sessions.some(s => s.stage === stage.id)
                  ? 'border-brand-mustard bg-brand-peach/20 shadow-lg'
                  : 'border-gray-100 dark:border-gray-800 opacity-40'
              }`}
            >
              {/* Stage Icon */}
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-800 shadow-sm flex items-center justify-center text-3xl border border-gray-100 dark:border-gray-700">
                {stage.icon}
              </div>

              {/* Stage Label */}
              <span className="text-[9px] font-bold uppercase tracking-widest text-center text-brown-900 dark:text-white leading-tight">
                {stage.label}
              </span>

              {/* Active Sessions in this Stage */}
              <div className="flex flex-wrap justify-center gap-2 mt-4 min-h-[100px]">
                {sessions.filter(s => s.stage === stage.id).map(s => (
                  <div key={s.id} className="group relative">
                    {/* Session Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-fade-in transition-transform hover:scale-110 ${
                        s.segment === 'B2B' ? 'bg-brand-blue' : 'bg-brand-mustard'
                      }`}
                    >
                      {s.name[0]}
                    </div>

                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-3 bg-white dark:bg-dark-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-gray-100 dark:border-gray-700">
                      <p className="text-[8px] font-bold uppercase text-brand-mustard mb-1">{s.segment}</p>
                      <p className="text-[10px] dark:text-white font-bold mb-1">{s.name}</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">
                        {s.device} • {s.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Arrow */}
            {idx < JOURNEY_STAGES.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-brand-peach"></div>
            )}
          </div>
        ))}
      </div>

      {/* Stats & Legend */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-gradient-to-br from-brand-peach/10 to-brand-blue/5 rounded-[40px] border border-brand-peach/30">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-mustard mb-4">
            Segment Dağılımı
          </h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-blue rounded-full"></div>
              <span className="text-xs dark:text-gray-300">B2B (Kurumsal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-mustard rounded-full"></div>
              <span className="text-xs dark:text-gray-300">B2C (Bireysel)</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-mustard mb-4">
            Context-Aware Engine
          </h4>
          <p className="text-[11px] italic text-gray-500 dark:text-gray-400">
            SPA route değişiklikleri, DOM observer ile milisaniyelik doğrulukta izleniyor.
          </p>
        </div>

        <div className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSessions(INITIAL_SESSIONS)}
            className="border-brand-mustard text-brand-mustard hover:bg-brand-mustard hover:text-white"
          >
            Sıfırla
          </Button>
        </div>
      </div>
    </div>
  );
};
