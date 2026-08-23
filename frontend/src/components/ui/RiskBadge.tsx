import React from 'react'

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string

const styleMap: Record<string, string> = {
  CRITICAL: 'risk-critical',
  HIGH:     'risk-high',
  MEDIUM:   'risk-medium',
  LOW:      'risk-low',
}

export function RiskBadge({ level, className = '' }: { level: RiskLevel; className?: string }) {
  const cls = styleMap[level?.toUpperCase()] ?? 'risk-unknown'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {level ?? 'N/A'}
    </span>
  )
}
