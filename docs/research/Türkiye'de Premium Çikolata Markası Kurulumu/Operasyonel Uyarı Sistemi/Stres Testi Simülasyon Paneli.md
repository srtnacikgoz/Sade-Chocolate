Bu panel, gerçek dünyadaki farklı senaryoları simüle ederek yazılımınızın mantığını (Cloud Functions ve UI) test etmenizi sağlar.

JavaScript

```
import React, { useState } from 'react';
import OperationalBanner from './OperationalBanner';

const StressTestDashboard = () => {
  const [simulatedTemp, setSimulatedTemp] = useState(22);
  const [simulatedDay, setSimulatedDay] = useState(1); // Pazartesi

  return (
    <div className="p-8 border-2 border-dashed border-red-200 rounded-xl bg-red-50">
      <h2 className="text-red-700 font-bold mb-4">🛠️ Sistem Stres Testi Paneli</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Sıcaklık Simülasyonu */}
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm text-stone-600">Simüle Edilen Sıcaklık ({simulatedTemp}°C)</label>
          <input 
            type="range" min="10" max="45" value={simulatedTemp}
            onChange={(e) => setSimulatedTemp(parseInt(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Gün Simülasyonu */}
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm text-stone-600">Simüle Edilen Gün</label>
          <select 
            className="w-full mt-1 border-stone-300 rounded"
            onChange={(e) => setSimulatedDay(parseInt(e.target.value))}
          >
            <option value={1}>Pazartesi (Normal)</option>
            <option value={5}>Cuma (Hafta Sonu Kısıtlaması)</option>
          </select>
        </div>
      </div>

      {/* SİSTEMİN TEPKİSİ */}
      <div className="border border-stone-200 rounded bg-white overflow-hidden">
        <div className="bg-stone-100 p-2 text-xs font-bold text-stone-500 uppercase">Canlı Mağaza Önizlemesi</div>
        <OperationalBanner weatherTemp={simulatedTemp} dayOfWeek={simulatedDay} />
        <div className="p-20 text-center text-stone-300 italic">
          [ Mağaza İçeriği ]
        </div>
      </div>
    </div>
  );
};
```