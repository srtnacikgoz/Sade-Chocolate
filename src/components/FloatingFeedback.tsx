import React, { useState } from 'react';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export const FloatingFeedback: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Tab - Sağ tarafta dikey, hover'da içeri kayar */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-10px)] hover:translate-x-0 z-[100] bg-gold hover:bg-gold/90 text-black shadow-2xl transition-all duration-300 group"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          padding: '20px 12px',
          borderRadius: '12px 0 0 12px'
        }}
      >
        {/* Hareket eden ok */}
        <ChevronLeft
          size={20}
          className="absolute -left-2 top-1/2 -translate-y-1/2 text-black/70 animate-bounce-x group-hover:opacity-0 transition-opacity"
          style={{ animationDuration: '1s' }}
        />
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="rotate-90" />
          <span className="font-black text-[11px] tracking-[0.3em] uppercase">
            Geri Bildirim
          </span>
        </div>
      </button>

      {/* Custom animation */}
      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0) translateY(-50%); }
          50% { transform: translateX(-4px) translateY(-50%); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s ease-in-out infinite;
        }
      `}</style>

      {/* Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
