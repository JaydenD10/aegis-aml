'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ShieldAlert,
  Network,
  ActivitySquare,
  Sparkles,
  FileText,
  History,
  Settings,
  ShieldCheck,
  UploadCloud,
  FileSearch,
  Eye,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'

const NAVIGATION_ITEMS = [
  {
    category: 'COMMAND',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Data Ingestion', href: '/upload', icon: UploadCloud },
    ],
  },
  {
    category: 'SURVEILLANCE',
    items: [
      { name: 'Monitored Entities', href: '/accounts', icon: Users },
      { name: 'Surveillance Ledger', href: '/transactions', icon: ArrowLeftRight },
      { name: 'Active Alerts', href: '/alerts', icon: ShieldAlert },
      { name: 'Risk Watchlist', href: '/watchlist', icon: Eye },
    ],
  },
  {
    category: 'AI FORENSICS',
    items: [
      { name: 'Behavioral Drift', href: '/drift', icon: ActivitySquare },
      { name: 'Network Graph', href: '/network', icon: Network },
      { name: 'SHAP Explainability', href: '/explainability', icon: Sparkles },
    ],
  },
  {
    category: 'COMPLIANCE',
    items: [
      { name: 'Investigations', href: '/investigations', icon: FileSearch },
      { name: 'Regulatory SARs', href: '/reports', icon: FileText },
      { name: 'Immutable Audit', href: '/audit-log', icon: History },
      { name: 'Workspace Admin', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const userName = user?.name || 'Compliance Analyst'
  const userInitials = userName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CA'

  return (
    <aside className="w-64 xl:w-72 shrink-0 hidden lg:flex flex-col glass-sidebar-floating p-4 relative z-30 select-none max-h-[calc(100vh-3rem)] sticky top-6">
      {/* Specular highlight border */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="p-3 mb-2 flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] group-hover:scale-105 group-hover:shadow-[0_6px_22px_rgba(37,99,235,0.5)] transition-all">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 font-mono">
              <span>Aegis</span>
              <span className="text-blue-600">AML</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Risk Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
        {NAVIGATION_ITEMS.map((section) => (
          <div key={section.category} className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
              {section.category}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold nav-item-glass ${
                    isActive ? 'active' : 'text-slate-600'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_#2563EB]" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Bottom Tenant Profile Card */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
            {userInitials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email || 'analyst@aegisaml.corp'}</div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
