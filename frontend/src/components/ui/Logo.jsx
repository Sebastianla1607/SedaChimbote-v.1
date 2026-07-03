import React from 'react'

export default function Logo({ size = 'md', collapsed = false, className = '' }) {
  const dimensions = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  }
  
  const selectedSize = dimensions[size] || dimensions.md

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Dynamic Water Drop SVG Logo */}
      <svg 
        viewBox="0 0 24 24" 
        className={`${selectedSize} text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.45)]`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      >
        <path 
          d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 12 2 12 2C12 2 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z" 
          fill="url(#dropletGradient)" 
        />
        <path 
          d="M12 18.5C14.4853 18.5 16.5 16.4853 16.5 14C16.5 11.5147 12 7.25 12 7.25C12 7.25 7.5 11.5147 7.5 14C7.5 16.4853 9.51472 18.5 12 18.5Z" 
          fill="url(#dropletInnerGradient)" 
          opacity="0.65" 
        />
        <defs>
          <linearGradient id="dropletGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="dropletInnerGradient" x1="12" y1="7.25" x2="12" y2="18.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93c5fd" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      
      {!collapsed && (
        <div className="flex flex-col items-start leading-none select-none">
          <span className="text-white text-base font-black tracking-wider uppercase">Seda</span>
          <span className="text-blue-400 text-[10px] font-extrabold uppercase tracking-widest mt-0.5 animate-fade-in">Chimbote</span>
        </div>
      )}
    </div>
  )
}
