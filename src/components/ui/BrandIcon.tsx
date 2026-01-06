import React from 'react';

interface BrandIconProps {
  size?: number;
  className?: string;
}

/**
 * Brand Icon Component
 * Sade Chocolate kakao logo'su - Sparkles ikonunun yerine kullanılır
 * Renk uyumu için className prop'u ile filter uygulanır
 */
export const BrandIcon: React.FC<BrandIconProps> = ({ size = 24, className = '' }) => {
  return (
    <img
      src="/kakaologo.png"
      alt="Sade Chocolate"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain'
      }}
      className={`inline-block ${className}`}
    />
  );
};
