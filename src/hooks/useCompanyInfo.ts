import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CompanyInfo } from '../types';

// Varsayılan şehir bilgisi
const DEFAULT_CITY = 'Antalya';

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    id: '',
    companyName: 'Sade Unlu Mamülleri San ve Tic Ltd Şti',
    brandName: 'Sade Chocolate',
    slogan: 'El Yapımı Artisan Çikolata',
    foundedYear: 2024,
    founderName: '',
    generalEmail: 'info@sadechocolate.com',
    generalPhone: '',
    socialMedia: {},
    branches: [],
  });
  const [city, setCity] = useState(DEFAULT_CITY);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'company_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyInfo;
          setCompanyInfo(data);
          // İlk şubenin şehrini al
          if (data.branches?.[0]?.city) {
            setCity(data.branches[0].city);
          }
        }
      } catch (error) {
        console.error('CompanyInfo yüklenemedi:', error);
      }
    };

    loadCompanyInfo();
  }, []);

  return { companyInfo, city };
}
