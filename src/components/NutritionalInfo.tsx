import React from 'react';

interface NutritionalInfoProps {
  ingredients?: string;
  allergens?: string;
}

export const NutritionalInfo: React.FC<NutritionalInfoProps> = ({ ingredients, allergens }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 ml-1">İçindekiler</h4>
        <div className="p-5 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
             {ingredients || 'Saf kakao kitlesi, şeker, kakao yağı ve doğal vanilya özütü.'}
           </p>
        </div>
      </div>

      {allergens && (
        <div className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20 flex gap-4">
          <span className="material-icons-outlined text-red-500">warning_amber</span>
          <div>
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Alerjen Uyarısı</h4>
            <p className="text-xs text-red-800/70 dark:text-red-400/70 leading-relaxed">{allergens}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full">
          <span className="material-icons-outlined text-green-600 text-sm">nature</span>
          <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">Boyasız / Katkısız</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          <span className="material-icons-outlined text-blue-600 text-sm">water_drop</span>
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Saf Kakao Yağı</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
          <span className="material-icons-outlined text-orange-600 text-sm">star</span>
          <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase">Belçika Orijinli</span>
        </div>
      </div>
    </div>
  );
};