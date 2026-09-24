// @ts-nocheck
import React from 'react';

const AppLogo = ({ size = 64 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9b8bf4" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="24" fill="url(#logo-grad)" />
      {/* Cap Base */}
      <path d="M 22 40 L 32 68 Q 50 76 68 68 L 78 40 Z" fill="#e9d5ff" />
      {/* Cap Top */}
      <ellipse cx="50" cy="38" rx="38" ry="12" fill="#ffffff" />
      {/* Tassel String */}
      <path d="M 50 38 Q 70 45 78 68" stroke="#fbbf24" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Tassel Dots */}
      <circle cx="50" cy="38" r="4.5" fill="#fbbf24" />
      <circle cx="78" cy="68" r="6.5" fill="#fbbf24" />
    </svg>
  );
};

export default AppLogo;
