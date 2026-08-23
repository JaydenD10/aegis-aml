'use client'

import React, { useEffect, useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  accent?: 'blue' | 'cyan' | 'purple' | 'red' | 'orange' | 'green'
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

const ACCENT_STYLES = {
  blue: {
    iconBg: 'bg-blue-500/15',
    iconBorder: 'border-blue-500/30',
    iconColor: 'text-blue-600',
    glow: 'rgba(37, 99, 235, 0.25)',
    orb: 'from-blue-400/20 to-indigo-400/0',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  cyan: {
    iconBg: 'bg-cyan-500/15',
    iconBorder: 'border-cyan-500/30',
    iconColor: 'text-cyan-600',
    glow: 'rgba(6, 182, 212, 0.25)',
    orb: 'from-cyan-400/20 to-blue-400/0',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconBorder: 'border-purple-500/30',
    iconColor: 'text-purple-600',
    glow: 'rgba(147, 51, 234, 0.25)',
    orb: 'from-purple-400/20 to-indigo-400/0',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  red: {
    iconBg: 'bg-rose-500/15',
    iconBorder: 'border-rose-500/30',
    iconColor: 'text-rose-600',
    glow: 'rgba(239, 68, 68, 0.25)',
    orb: 'from-rose-400/20 to-amber-400/0',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  orange: {
    iconBg: 'bg-orange-500/15',
    iconBorder: 'border-orange-500/30',
    iconColor: 'text-orange-600',
    glow: 'rgba(249, 115, 22, 0.25)',
    orb: 'from-orange-400/20 to-yellow-400/0',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  green: {
    iconBg: 'bg-emerald-500/15',
    iconBorder: 'border-emerald-500/30',
    iconColor: 'text-emerald-600',
    glow: 'rgba(16, 185, 129, 0.25)',
    orb: 'from-emerald-400/20 to-cyan-400/0',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
}

export function KpiCard({
  label,
  value,
  icon,
  accent = 'blue',
  change,
  trend = 'neutral',
  subtitle
}: KpiCardProps) {
  const style = ACCENT_STYLES[accent] || ACCENT_STYLES.blue
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === 'number' ? 0 : value)

  // Animated Number Counter on Mount
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 900 // ms
      const steps = 30
      const stepDuration = duration / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentVal = Math.round(value * easeOut)
        
        setDisplayValue(currentVal.toLocaleString())
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setDisplayValue(value.toLocaleString())
        }
      }, stepDuration)

      return () => clearInterval(timer)
    } else {
      setDisplayValue(value)
    }
  }, [value])

  return (
    <div className="glass-panel-3d glass-panel-3d-interactive p-5 sm:p-6 group cursor-default relative overflow-hidden">
      {/* Subtle Specular Ambient Orb */}
      <div 
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${style.orb} blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono flex items-baseline gap-1">
            <span>{displayValue}</span>
          </div>
        </div>

        {/* Circular Translucent 3D Glass Icon Container */}
        <div 
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconColor} border ${style.iconBorder} shadow-[0_4px_16px_rgba(0,0,0,0.06)] group-hover:scale-110 group-hover:shadow-[0_8px_20px_var(--glow)] transition-all duration-300`}
          style={{ '--glow': style.glow } as any}
        >
          {icon}
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs relative z-10">
          {change && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] font-medium text-slate-500 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
