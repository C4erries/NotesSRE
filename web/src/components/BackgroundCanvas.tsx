import { useEffect, useState } from 'react'

interface Props {
  theme: 'dark' | 'light'
}

export function BackgroundCanvas({ theme }: Props) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Dynamic Cursor Spotlight (Illuminates liquid glass from behind) */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-transform duration-200 ease-out -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          background:
            theme === 'dark'
              ? 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(234, 179, 8, 0.1) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, rgba(245, 158, 11, 0.25) 45%, transparent 70%)',
        }}
      />

      {/* Primary Liquid Gradient Mesh Layers */}
      {theme === 'dark' ? (
        <div className="absolute inset-0">
          {/* Deep Sunlit Golden Core (Top Left) */}
          <div className="absolute -top-36 -left-36 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-amber-400/30 via-yellow-500/25 to-orange-600/15 blur-[130px] animate-orb-1" />

          {/* Garden Emerald & Mint Glow (Top Right) */}
          <div className="absolute top-1/6 -right-48 w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-emerald-400/25 via-teal-500/20 to-lime-400/15 blur-[140px] animate-orb-2" />

          {/* Warm Solar Amber & Honey Lagoon (Bottom Center/Left) */}
          <div className="absolute -bottom-48 left-1/5 w-[850px] h-[850px] rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-400/20 to-orange-500/15 blur-[150px] animate-orb-3" />

          {/* Deep Indigo/Violet Specular Contrast Orb (Bottom Right) */}
          <div className="absolute top-1/2 right-1/8 w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-indigo-600/25 via-purple-600/20 to-amber-500/10 blur-[130px] animate-orb-1" />

          {/* Center Solar Flare Orb (Pulsing underneath the central notes) */}
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-yellow-500/15 via-amber-400/20 to-amber-600/10 blur-[140px] animate-pulse-slow" />
        </div>
      ) : (
        <div className="absolute inset-0">
          {/* Bright Radiant Sunbeam (Top Left) */}
          <div className="absolute -top-32 -left-32 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-amber-300/60 via-yellow-300/50 to-orange-200/40 blur-[110px] animate-orb-1" />

          {/* Spring Leaf Breeze (Top Right) */}
          <div className="absolute top-1/8 -right-36 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-emerald-200/50 via-teal-100/40 to-yellow-200/40 blur-[120px] animate-orb-2" />

          {/* Golden Field Horizon (Bottom Left/Center) */}
          <div className="absolute -bottom-48 left-1/4 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-yellow-300/55 via-amber-200/50 to-sky-200/45 blur-[130px] animate-orb-3" />

          {/* Sky & Azure Horizon Breeze (Bottom Right) */}
          <div className="absolute top-1/2 right-1/10 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-sky-200/45 via-amber-100/40 to-yellow-200/35 blur-[110px] animate-orb-1" />

          {/* Soft Peach Solar Glow (Center) */}
          <div className="absolute top-1/3 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-r from-orange-200/40 via-yellow-200/45 to-amber-100/40 blur-[120px] animate-pulse-slow" />
        </div>
      )}

      {/* Floating Gentle Sunflower Petals (Drifting through the breeze) */}
      <svg className="absolute inset-0 w-full h-full opacity-60 dark:opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="floatingPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Petal 1 */}
        <g className="animate-petal-drift-1">
          <ellipse cx="120" cy="180" rx="14" ry="32" fill="url(#floatingPetalGrad)" transform="rotate(35 120 180)" />
        </g>
        {/* Petal 2 */}
        <g className="animate-petal-drift-2">
          <ellipse cx="85%" cy="240" rx="16" ry="36" fill="url(#floatingPetalGrad)" transform="rotate(-40 850 240)" />
        </g>
        {/* Petal 3 */}
        <g className="animate-petal-drift-3">
          <ellipse cx="45%" cy="80%" rx="12" ry="28" fill="url(#floatingPetalGrad)" transform="rotate(65 450 600)" />
        </g>
        {/* Petal 4 */}
        <g className="animate-petal-drift-4">
          <ellipse cx="90%" cy="82%" rx="15" ry="34" fill="url(#floatingPetalGrad)" transform="rotate(-25 900 700)" />
        </g>
        {/* Petal 5 */}
        <g className="animate-petal-drift-5">
          <ellipse cx="8%" cy="75%" rx="13" ry="30" fill="url(#floatingPetalGrad)" transform="rotate(20 100 650)" />
        </g>
      </svg>

      {/* Ultra-subtle Micro-grain Frost Texture Overlay (Removes color banding & mimics authentic glass tooth) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.045] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="glassNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#glassNoise)" />
      </svg>
    </div>
  )
}
