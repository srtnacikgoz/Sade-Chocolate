import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export const FloatingFeedback: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Tab - Sağ tarafta dikey */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] bg-gold hover:bg-gold/90 text-black shadow-2xl transition-all hover:pr-2 group"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          padding: '20px 12px',
          borderRadius: '12px 0 0 12px'
        }}
      >
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="rotate-90" />
          <span className="font-black text-[11px] tracking-[0.3em] uppercase">
            Geri Bildirim
          </span>
        </div>
      </button>

      {/* Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
