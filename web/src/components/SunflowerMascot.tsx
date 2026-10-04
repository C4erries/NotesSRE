import { useState } from 'react'

interface Props {
  className?: string
  size?: number
  animate?: boolean
  mood?: 'happy' | 'waving' | 'wink'
  showBadge?: boolean
}

export function SunflowerMascot({
  className = '',
  size = 36,
  animate = false,
  mood = 'happy',
  showBadge = false,
}: Props) {
  const [isHovered, setIsHovered] = useState(false)

  // 12 outer petals rotation degrees
  const outerPetals = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
  // 12 inner volume petals
  const innerPetals = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345]

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 group select-none transition-transform duration-300 ease-out cursor-pointer ${
        isHovered ? 'scale-115 -rotate-6' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Sunny — SRE Sunflower Mascot 🌻"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] ${
          animate || isHovered ? 'animate-sunflower-bob' : ''
        }`}
      >
        <defs>
          {/* Luminous Liquid Petal Gradient */}
          <linearGradient id="sunPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Inner Accent Petal Gradient */}
          <linearGradient id="sunPetalInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          {/* Sunflower Center Disc Gradient (Warm Cocoa & Honey) */}
          <radialGradient id="sunCenterGrad" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="65%" stopColor="#78350F" />
            <stop offset="90%" stopColor="#451A03" />
            <stop offset="100%" stopColor="#291002" />
          </radialGradient>

          {/* Emerald Leaves */}
          <linearGradient id="sunLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Liquid Glass Dewdrop on Petal */}
          <radialGradient id="dewDropGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E0F2FE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Cute Organic Green Leaves */}
        <g className="transition-transform duration-500 origin-[50%_75%]">
          <path
            d="M 18 72 C 8 66 6 82 17 86 C 28 86 28 76 18 72 Z"
            fill="url(#sunLeafGrad)"
            className={isHovered ? 'animate-wiggle-left' : ''}
          />
          <path
            d="M 82 72 C 92 66 94 82 83 86 C 72 86 72 76 82 72 Z"
            fill="url(#sunLeafGrad)"
            className={isHovered ? 'animate-wiggle-right' : ''}
          />
        </g>

        {/* Outer Radiating Petals */}
        <g className={`transition-all duration-700 origin-center ${isHovered ? 'rotate-12' : ''}`}>
          {outerPetals.map((deg) => (
            <ellipse
              key={deg}
              cx="50"
              cy="23"
              rx="9.5"
              ry="21"
              fill="url(#sunPetalGrad)"
              transform={`rotate(${deg} 50 50)`}
              stroke="#B45309"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          ))}

          {/* Inner Petals (Gives 3D volume and liquid depth) */}
          {innerPetals.map((deg) => (
            <ellipse
              key={deg}
              cx="50"
              cy="26"
              rx="7"
              ry="16"
              fill="url(#sunPetalInner)"
              transform={`rotate(${deg} 50 50)`}
              opacity="0.95"
            />
          ))}
        </g>

        {/* Center Seed Disk */}
        <circle
          cx="50"
          cy="50"
          r="21.5"
          fill="url(#sunCenterGrad)"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Seed Texture Spiral Dots */}
        <circle cx="43" cy="42" r="1.3" fill="#F59E0B" opacity="0.6" />
        <circle cx="57" cy="42" r="1.3" fill="#F59E0B" opacity="0.6" />
        <circle cx="50" cy="38" r="1.3" fill="#F59E0B" opacity="0.7" />
        <circle cx="38" cy="49" r="1.2" fill="#FBBF24" opacity="0.5" />
        <circle cx="62" cy="49" r="1.2" fill="#FBBF24" opacity="0.5" />
        <circle cx="45" cy="58" r="1.3" fill="#F59E0B" opacity="0.6" />
        <circle cx="55" cy="58" r="1.3" fill="#F59E0B" opacity="0.6" />

        {/* Cheerful Friendly Mascot Eyes */}
        {isHovered || mood === 'wink' ? (
          <>
            {/* Winking left eye */}
            <path
              d="M 40 48 Q 44 44 48 48"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Big smiling right eye */}
            <circle cx="58" cy="47" r="3.2" fill="#FFFFFF" />
            <circle cx="58.5" cy="47" r="1.8" fill="#1E1B4B" />
            <circle cx="57.5" cy="45.8" r="0.9" fill="#FFFFFF" />
          </>
        ) : (
          <>
            {/* Sparkly Left Eye */}
            <circle cx="42" cy="47" r="3.2" fill="#FFFFFF" />
            <circle cx="42.5" cy="47" r="1.8" fill="#1E1B4B" />
            <circle cx="41.5" cy="45.8" r="0.9" fill="#FFFFFF" />

            {/* Sparkly Right Eye */}
            <circle cx="58" cy="47" r="3.2" fill="#FFFFFF" />
            <circle cx="57.5" cy="47" r="1.8" fill="#1E1B4B" />
            <circle cx="58.5" cy="45.8" r="0.9" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <ellipse cx="37" cy="53" rx="2.5" ry="1.6" fill="#F87171" opacity="0.8" />
        <ellipse cx="63" cy="53" rx="2.5" ry="1.6" fill="#F87171" opacity="0.8" />

        {/* Warm Golden Smile */}
        <path
          d={isHovered ? 'M 44 54 Q 50 62 56 54' : 'M 45 54 Q 50 59 55 54'}
          stroke="#FEF08A"
          strokeWidth="2"
          strokeLinecap="round"
          fill={isHovered ? '#B45309' : 'none'}
        />

        {/* Liquid Glass Morning Dewdrop on Top Right Petal */}
        <circle cx="68" cy="22" r="3" fill="url(#dewDropGrad)" />
        <circle cx="67" cy="21" r="0.9" fill="#FFFFFF" />
      </svg>

      {/* Floating Status Ring Indicator if requested */}
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white dark:border-slate-900"></span>
        </span>
      )}
    </div>
  )
}
