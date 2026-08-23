import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm mt-1 font-medium text-slate-500 max-w-3xl">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center flex-wrap gap-2.5 shrink-0">{children}</div>}
    </div>
  )
}
