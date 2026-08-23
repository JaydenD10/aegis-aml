'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  ShieldCheck,
  Activity,
  Sparkles,
  Network,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react'

const SURVEILLANCE_PHRASES = [
  'Trust Every Transaction',
  'See Risk Before It Escalates',
  'Monitor. Detect. Explain.',
]

const FORENSICS_PHRASES = [
  'Understand Every Decision',
  'Make Every Signal Explainable',
  'Turn Data Into Intelligence',
]

const DRIFT_PHRASES = [
  'Detect What Changes',
  'Risk Leaves a Trace',
  'Investigate With Confidence',
]

const TOPOLOGY_PHRASES = [
  'Follow the Money Trail',
  'Find the Hidden Pattern',
  'Every Signal Tells a Story',
]

const CENTRAL_PHRASES = [
  'Intelligence That Investigates',
  'Detect. Understand. Protect.',
  'Forensics at Machine Speed',
]

export function Auth3DScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 })
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)

  // Smooth phrase rotation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % SURVEILLANCE_PHRASES.length)
        setIsFading(false)
      }, 300)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Smooth lerp mouse tracking loop
  useEffect(() => {
    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      setTargetPos({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      })
    }

    const animate = () => {
      setMousePos((prev) => ({
        x: prev.x + (targetPos.x - prev.x) * 0.08,
        y: prev.y + (targetPos.y - prev.y) * 0.08,
      }))
      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [targetPos])

  const rotX = mousePos.y * -14
  const rotY = mousePos.x * 16

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setTargetPos({ x: 0, y: 0 })}
      className="w-full h-full min-h-[480px] lg:min-h-[600px] flex items-center justify-center relative select-none overflow-hidden [perspective:1200px]"
    >
      {/* Background Soft Glow Orbs */}
      <div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/25 via-cyan-300/20 to-purple-400/15 blur-3xl pointer-events-none transition-transform duration-700"
        style={{
          transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)`,
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-indigo-400/20 to-pink-400/15 blur-3xl pointer-events-none -bottom-10 -left-10 transition-transform duration-700"
        style={{
          transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)`,
        }}
      />

      {/* 3D Transform Root Scene */}
      <div
        className="relative w-full max-w-[460px] h-[460px] flex items-center justify-center transition-transform duration-100 ease-out [transform-style:preserve-3d]"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* Ambient Orbital Rings */}
        <div
          className="absolute inset-0 m-auto w-[380px] h-[380px] rounded-full border border-blue-400/25 border-dashed [transform:translateZ(-40px)] animate-[spin_60s_linear_infinite]"
        />
        <div
          className="absolute inset-0 m-auto w-[440px] h-[440px] rounded-full border border-indigo-400/20 [transform:translateZ(-70px)] animate-[spin_85s_linear_infinite_reverse]"
        />

        {/* Constellation Network Pulsing Connecting Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none [transform:translateZ(-20px)] opacity-60"
          viewBox="0 0 460 460"
        >
          <line
            x1="120"
            y1="100"
            x2="230"
            y2="230"
            stroke="url(#lineGrad1)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
          <line
            x1="360"
            y1="130"
            x2="230"
            y2="230"
            stroke="url(#lineGrad1)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1="340"
            y1="340"
            x2="230"
            y2="230"
            stroke="url(#lineGrad2)"
            strokeWidth="1.5"
          />
          <line
            x1="100"
            y1="330"
            x2="230"
            y2="230"
            stroke="url(#lineGrad2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Data Panel 1: Top-Left (Live Surveillance) */}
        <div
          className="absolute top-4 left-2 p-4 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_15px_35px_-5px_rgba(37,99,235,0.15)] [transform:translateZ(60px)] transition-all duration-300 hover:scale-105 min-w-[190px]"
          style={{
            transform: `translate3d(${mousePos.x * -20}px, ${mousePos.y * -20}px, 60px)`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5 text-blue-600">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Live Surveillance</span>
          </div>
          <div
            className={`text-xs font-bold text-slate-900 transition-all duration-300 ${
              isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            &ldquo;{SURVEILLANCE_PHRASES[phraseIndex]}&rdquo;
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-extrabold uppercase tracking-widest text-emerald-600">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            <span>Active Vigilance</span>
          </div>
        </div>

        {/* Floating Data Panel 2: Top-Right (SHAP Forensics) */}
        <div
          className="absolute top-10 right-0 p-4 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_15px_35px_-5px_rgba(139,92,246,0.15)] [transform:translateZ(85px)] transition-all duration-300 hover:scale-105 min-w-[200px]"
          style={{
            transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * -25}px, 85px)`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5 text-purple-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">SHAP Forensics</span>
          </div>
          <div
            className={`text-xs font-bold text-slate-900 transition-all duration-300 ${
              isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            &ldquo;{FORENSICS_PHRASES[phraseIndex]}&rdquo;
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-extrabold uppercase tracking-widest text-purple-600">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_#8B5CF6]" />
            <span>Interpretable AI</span>
          </div>
        </div>

        {/* Floating Data Panel 3: Bottom-Right (Behavioral Drift) */}
        <div
          className="absolute bottom-6 right-2 p-4 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_15px_35px_-5px_rgba(6,182,212,0.15)] [transform:translateZ(70px)] transition-all duration-300 hover:scale-105 min-w-[195px]"
          style={{
            transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 70px)`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5 text-cyan-600">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Behavioral Drift</span>
          </div>
          <div
            className={`text-xs font-bold text-slate-900 transition-all duration-300 ${
              isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            &ldquo;{DRIFT_PHRASES[phraseIndex]}&rdquo;
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-extrabold uppercase tracking-widest text-cyan-600">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#06B6D4]" />
            <span>Multi-Detector Monitor</span>
          </div>
        </div>

        {/* Floating Data Panel 4: Bottom-Left (Topology Graph) */}
        <div
          className="absolute bottom-10 left-0 p-4 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_15px_35px_-5px_rgba(249,115,22,0.12)] [transform:translateZ(50px)] transition-all duration-300 hover:scale-105 min-w-[190px]"
          style={{
            transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * 25}px, 50px)`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
            <Network className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Topology Graph</span>
          </div>
          <div
            className={`text-xs font-bold text-slate-900 transition-all duration-300 ${
              isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            &ldquo;{TOPOLOGY_PHRASES[phraseIndex]}&rdquo;
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366F1]" />
            <span>2-Hop Cluster Matrix</span>
          </div>
        </div>

        {/* ========================================================
            CENTRAL 3D LIQUID GLASS SECURITY SHIELD SCENE
           ======================================================== */}
        <div
          className="relative w-56 h-64 flex items-center justify-center [transform:translateZ(120px)] group cursor-pointer"
          style={{
            transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 12}px, 120px)`,
          }}
        >
          {/* Glowing Ambient Core Behind the Shield */}
          <div className="absolute inset-0 m-auto w-44 h-52 rounded-[3rem] bg-gradient-to-tr from-blue-500/40 via-cyan-400/30 to-indigo-500/40 blur-2xl group-hover:scale-115 transition-transform duration-500" />

          {/* Outer Glass Shield Layer with Specular Gradient & Blur */}
          <div className="relative w-48 h-56 rounded-[2.5rem] p-4 bg-gradient-to-b from-white/95 via-white/65 to-white/35 backdrop-blur-3xl border border-white/90 shadow-[0_30px_70px_-15px_rgba(37,99,235,0.3),0_0_0_1px_rgba(255,255,255,0.9)_inset] flex flex-col items-center justify-center text-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
            {/* Specular Light Sweep Bar */}
            <div className="absolute -top-10 -left-10 w-32 h-72 bg-gradient-to-r from-transparent via-white/70 to-transparent rotate-45 pointer-events-none transition-transform duration-1000 group-hover:translate-x-60" />

            {/* Inner Shield Badge */}
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_8px_24px_rgba(37,99,235,0.4)] mb-2.5 group-hover:rotate-6 transition-transform duration-500">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>

            <div className="text-sm font-black font-mono tracking-tight text-slate-900">
              Aegis<span className="text-blue-600">AML</span>
            </div>

            {/* Rotating Central Tagline */}
            <div
              className={`text-[11px] font-bold text-slate-600 mt-1 min-h-[28px] flex items-center justify-center transition-all duration-300 ${
                isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
            >
              {CENTRAL_PHRASES[phraseIndex]}
            </div>

            {/* Micro Shield Status Pill */}
            <div className="mt-2 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Surveillance Active</span>
            </div>
          </div>
        </div>

        {/* Small 3D Floating Particle Spheres */}
        {[
          { x: -160, y: -90, z: 90, size: 'w-4 h-4', bg: 'bg-blue-400/40', blur: 'blur-sm' },
          { x: 170, y: -70, z: 110, size: 'w-3 h-3', bg: 'bg-cyan-400/50', blur: 'blur-none' },
          { x: -140, y: 130, z: 70, size: 'w-3.5 h-3.5', bg: 'bg-purple-400/45', blur: 'blur-none' },
          { x: 150, y: 110, z: 95, size: 'w-5 h-5', bg: 'bg-indigo-400/35', blur: 'blur-sm' },
        ].map((particle, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${particle.size} ${particle.bg} ${particle.blur} border border-white/60 shadow-lg pointer-events-none transition-transform duration-500`}
            style={{
              transform: `translate3d(${particle.x + mousePos.x * 35}px, ${particle.y + mousePos.y * 35}px, ${particle.z}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
