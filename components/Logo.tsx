import React from 'react';

export interface MinuteBoundLogoProps {
  className?: string;
  // Text Colors
  colorMinute?: string;
  colorBound?: string;
  colorUSA?: string;
  // Text Sizes (e.g., "150px", "1em", "110%")
  sizeMinute?: string | number;
  sizeBound?: string | number;
  sizeUSA?: string | number;
  // Icon Color
  iconColor?: string;
}

export default function MinuteBoundLogo({ 
  className = "",
  colorMinute = "#012C23",
  colorBound = "#012C23",
  colorUSA = "#F97316",
  sizeMinute = "inherit",
  sizeBound = "inherit",
  sizeUSA = "inherit",
  iconColor = "#012C23"
}: MinuteBoundLogoProps) {
  return (
    <>
      {/* Mobile & Tablet Logo */}
      <svg 
        viewBox="0 20 1600 160" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${className} lg:hidden`}
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
            .logo-text-mobile {
              font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont;
              font-size: 170px; /* Base size, overridden by tspan props if provided */
              letter-spacing: -0.01em;
            }
          `}</style>
        </defs>
        <text x="320" y="150" className="logo-text-mobile" textAnchor="start">
          <tspan fill={colorMinute} fontSize={sizeMinute} className="font-bold">Minute</tspan>
          <tspan fill={colorBound} fontSize={sizeBound} className="font-bold">Bound</tspan>
        </text>
        <rect x="0" y="0" width="300" height="350" fill="" rx="20" ry="20" transform="rotate(-10 70 140)" />
        <g transform="translate(20,-30) scale(1)">
          <path d="M 20 160 C 100 40, 90 40, 120 120" fill={iconColor} />
          <path d="M 120 120 C 180 20, 180 20, 200 140" fill={iconColor} />  
        </g>
        <g transform="translate(-310,10) scale(0.8)"> 
          <path d="M 420 170 Q 550 240 680 170" stroke={iconColor} fill="none" strokeWidth="14" strokeLinecap="round" />
        </g>
      </svg>

      {/* Desktop Logo */}
      <svg 
        viewBox="10 20 1600 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${className} hidden lg:block`}
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
            .logo-text-desktop {
              font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont;
              font-size: 150px; /* Base size, overridden by tspan props if provided */
              letter-spacing: -0.01em;
            }
          `}</style>
        </defs>
        <text x="350" y="160" className="logo-text-desktop" textAnchor="start">
          <tspan fill={colorMinute} fontSize={sizeMinute} className="font-bold">Minute</tspan>
          <tspan fill={colorBound} fontSize={sizeBound} className="font-bold">Bound</tspan>
          <tspan fill={colorUSA} fontSize={sizeUSA} className="font-bold">USA</tspan>
        </text>
        <rect x="0" y="0" width="300" height="300" fill="" rx="20" ry="20" transform="rotate(-10 70 140)" />
        <g transform="translate(10,-30) scale(1.2)">
          <path d="M 20 160 C 100 40, 90 40, 120 120" fill={iconColor} />
          <path d="M 120 120 C 180 20, 180 20, 200 140" fill={iconColor} />  
        </g>
        <g transform="translate(-410,10)"> 
          <path d="M 420 170 Q 550 240 680 170" stroke={iconColor} fill="none" strokeWidth="14" strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
}