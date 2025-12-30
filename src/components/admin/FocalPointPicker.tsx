import React, { useState, useRef } from 'react';
import { Target, X } from 'lucide-react';

interface FocalPoint {
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
}

interface FocalPointPickerProps {
  imageUrl: string;
  value?: FocalPoint;
  onChange: (point: FocalPoint) => void;
  onClose?: () => void;
}

export const FocalPointPicker: React.FC<FocalPointPickerProps> = ({
  imageUrl,
  value = { x: 50, y: 50 },
  onChange,
  onClose
}) => {
  const [focalPoint, setFocalPoint] = useState<FocalPoint>(value);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint = {
      x: Math.max(0, Math.min(100, Math.round(x))),
      y: Math.max(0, Math.min(100, Math.round(y)))
    };

    setFocalPoint(newPoint);
    onChange(newPoint);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-800 rounded-[32px] p-8 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Odak Noktası Seçin</h3>
              <p className="text-xs text-gray-400 mt-0.5">Görselin hangi kısmına odaklanılsın?</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Image Preview with Focal Point */}
        <div className="mb-6 space-y-3">
          <div
            ref={imageRef}
            onClick={handleClick}
            className="relative w-full h-96 bg-gray-100 dark:bg-dark-900 rounded-2xl overflow-hidden cursor-crosshair group"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `${focalPoint.x}% ${focalPoint.y}%`
            }}
          >
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>

            {/* Focal Point Marker */}
            <div
              className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none animate-in zoom-in duration-300"
              style={{
                left: `${focalPoint.x}%`,
                top: `${focalPoint.y}%`
              }}
            >
              {/* Outer Ring */}
              <div className="absolute inset-0 border-4 border-white rounded-full shadow-lg animate-pulse"></div>
              {/* Inner Dot */}
              <div className="absolute inset-0 m-2 bg-gold rounded-full shadow-lg"></div>
              {/* Crosshair */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/60 -translate-y-1/2"></div>
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/60 -translate-x-1/2"></div>
            </div>
          </div>

          {/* Coordinates Display */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-900 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">X:</span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{focalPoint.x}%</span>
              </div>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">Y:</span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{focalPoint.y}%</span>
              </div>
            </div>
            <button
              onClick={() => {
                const newPoint = { x: 50, y: 50 };
                setFocalPoint(newPoint);
                onChange(newPoint);
              }}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-wider"
            >
              Sıfırla
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">İpucu</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Görselin üzerine tıklayarak odak noktasını seçin. Farklı ekran boyutlarında bu nokta merkeze alınarak gösterilir.
                Örneğin, bir yüz varsa yüze tıklayın - böylece mobilde de yüz görünür.
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        {onClose && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gold text-white rounded-xl font-bold text-sm hover:bg-gold/90 transition-colors"
            >
              Tamam
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
