import React from 'react';

const US_STRIPE = 60 / 13;

const UsFlag = () => (
  <>
    <rect width="60" height="60" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map((i) => (
      <rect key={i} y={i * US_STRIPE} width="60" height={US_STRIPE} fill="#E5484D" />
    ))}
    <rect width="30" height={US_STRIPE * 7} fill="#3C3B6E" />
    {[0, 1, 2, 3, 4].map((row) =>
      [0, 1, 2, 3, 4].map((col) => (
        <circle key={`${row}-${col}`} cx={4 + col * 5.5 + (row % 2) * 2.75} cy={4 + row * 6} r="1.3" fill="#fff" />
      ))
    )}
  </>
);

const PhFlag = () => (
  <>
    <rect width="60" height="30" fill="#3E4FC0" />
    <rect y="30" width="60" height="30" fill="#F2431F" />
    <polygon points="0,0 52,30 0,60" fill="#F5F5F5" />
    <g fill="#FCD116">
      <circle cx="17" cy="30" r="5.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect key={deg} x="16" y="20" width="2" height="5" transform={`rotate(${deg} 17 30)`} />
      ))}
      <circle cx="5" cy="9" r="2" />
      <circle cx="5" cy="51" r="2" />
      <circle cx="40" cy="30" r="2" />
    </g>
  </>
);

export default function LanguageFlag({ language, size = 18, rounded = '50%' }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-block', width: size, height: size, borderRadius: rounded, overflow: 'hidden', flexShrink: 0, lineHeight: 0 }}
    >
      <svg viewBox="0 0 60 60" width={size} height={size} style={{ display: 'block' }}>
        {language === 'tl' ? <PhFlag /> : <UsFlag />}
      </svg>
    </span>
  );
}
