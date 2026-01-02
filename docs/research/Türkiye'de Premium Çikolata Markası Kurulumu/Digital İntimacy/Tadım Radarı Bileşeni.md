import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

/**
 * Ürünün duyusal profilini görselleştiren Radar Grafiği.
 * Stratejik Amaç: Duyusal boşluğu teknolojiyle doldurmak[cite: 87, 88].
 */
const FlavorRadar = ({ data }) => {
  // Veri yapısı: { subject: 'Tatlılık', value: 30, fullMark: 100 }
  
  return (
    <div className="w-full h-64 bg-stone-50 p-4 rounded-lg shadow-inner">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-stone-800 mb-4">
        Lezzet Profili
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#d6d3d1" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#57534e', fontSize: 12, fontWeight: 500 }} 
          />
          <Radar
            name="Profil"
            dataKey="value"
            stroke="#442c21" // Premium çikolata tonu
            fill="#78350f"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FlavorRadar;