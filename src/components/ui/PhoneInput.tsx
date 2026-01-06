import React, { useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

interface PhoneInputProps {
  label?: string;
  value: string;
  countryCode: string;
  onValueChange: (value: string) => void;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const COUNTRY_CODES = [
  { code: '+90', flag: '🇹🇷', name: 'Türkiye', format: '5XX XXX XX XX' },
  { code: '+1', flag: '🇺🇸', name: 'USA', format: 'XXX XXX XXXX' },
  { code: '+44', flag: '🇬🇧', name: 'UK', format: 'XXXX XXXXXX' },
  { code: '+49', flag: '🇩🇪', name: 'Germany', format: 'XXX XXXXXXX' },
  { code: '+33', flag: '🇫🇷', name: 'France', format: 'X XX XX XX XX' },
  { code: '+39', flag: '🇮🇹', name: 'Italy', format: 'XXX XXX XXXX' },
  { code: '+34', flag: '🇪🇸', name: 'Spain', format: 'XXX XXX XXX' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands', format: 'X XX XX XX XX' },
  { code: '+32', flag: '🇧🇪', name: 'Belgium', format: 'XXX XX XX XX' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland', format: 'XX XXX XX XX' },
  { code: '+43', flag: '🇦🇹', name: 'Austria', format: 'XXX XXXXXX' },
  { code: '+45', flag: '🇩🇰', name: 'Denmark', format: 'XX XX XX XX' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden', format: 'XX XXX XX XX' },
  { code: '+47', flag: '🇳🇴', name: 'Norway', format: 'XXX XX XXX' },
  { code: '+358', flag: '🇫🇮', name: 'Finland', format: 'XX XXX XX XX' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal', format: 'XXX XXX XXX' },
  { code: '+30', flag: '🇬🇷', name: 'Greece', format: 'XXX XXX XXXX' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic', format: 'XXX XXX XXX' },
  { code: '+48', flag: '🇵🇱', name: 'Poland', format: 'XXX XXX XXX' },
  { code: '+7', flag: '🇷🇺', name: 'Russia', format: 'XXX XXX XX XX' },
  { code: '+81', flag: '🇯🇵', name: 'Japan', format: 'XX XXXX XXXX' },
  { code: '+86', flag: '🇨🇳', name: 'China', format: 'XXX XXXX XXXX' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea', format: 'XX XXXX XXXX' },
  { code: '+971', flag: '🇦🇪', name: 'UAE', format: 'XX XXX XXXX' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', format: 'XX XXX XXXX' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'TELEFON',
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
  placeholder = '533 342 04 93',
  className = '',
  error = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const filteredCountries = COUNTRY_CODES.filter(
    country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  // Phone formatter - 0 ile başlamamalı
  const formatPhone = (inputValue: string): string => {
    const digits = inputValue.replace(/\D/g, '');

    if (countryCode === '+90') {
      const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
      const limited = cleaned.slice(0, 10);
      if (limited.length <= 3) return limited;
      if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
      if (limited.length <= 8) return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 8)} ${limited.slice(8)}`;
    }

    return digits.substring(0, 15);
  };

  return (
    <>
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="flex gap-2 w-full">
          {/* Country Code Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`h-16 px-3 rounded-md border bg-white dark:bg-dark-800 flex items-center gap-2 hover:border-gold transition-all shrink-0 w-[110px] ${
              error ? 'border-red-500 border-2' : 'border-gray-400 dark:border-gray-500'
            }`}
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {selectedCountry.code}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {/* Phone Number Input */}
          <input
            type="tel"
            value={value}
            onChange={(e) => onValueChange(formatPhone(e.target.value))}
            placeholder={placeholder}
            className={`flex-1 min-w-0 h-16 px-4 rounded-md border bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none transition-all ${
              error
                ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20'
                : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'
            } ${className}`}
          />
        </div>
      </div>

      {/* Country Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in">
          <div
            className="absolute inset-0 bg-brown-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-dark-900 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 rounded-[40px] overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Phone size={20} className="text-gold" />
                </div>
                <h3 className="font-display text-2xl font-bold dark:text-white italic">
                  Ülke Kodu Seçin
                </h3>
              </div>
              <input
                type="text"
                placeholder="Ülke veya kod ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-800 text-sm outline-none focus:border-gold dark:text-white"
              />
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onCountryCodeChange(country.code);
                    setIsModalOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full p-4 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${
                    country.code === countryCode ? 'bg-gold/10 border border-gold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {country.name}
                      </p>
                      <p className="text-xs text-gray-400">{country.format}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-600 dark:text-gray-400">
                    {country.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
