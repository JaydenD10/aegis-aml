'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ShieldAlert, Sparkles, UploadCloud, Bell, Activity, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function Topbar() {
  const router = useRouter()
  const { authFetch, user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ accounts: any[]; transactions: any[] } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [systemOk, setSystemOk] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    authFetch('/api/health')
      .then((res) => setSystemOk(res.ok))
      .catch(() => setSystemOk(false))
  }, [authFetch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (val: string) => {
    setQuery(val)
    if (val.trim().length < 1) {
      setResults(null)
      setIsOpen(false)
      return
    }
    setLoading(true)
    setIsOpen(true)
    try {
      const res = await authFetch(`/api/search?q=${encodeURIComponent(val)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAccount = (id: string | number) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/accounts/${id}`)
  }

  const handleSelectTransaction = (id: string | number) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/transactions/${id}`)
  }

  return (
    <header className="glass-topbar-floating px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sticky top-6 z-40 relative">
      {/* Specular highlight border */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Global Search Capsule */}
      <div className="flex-1 max-w-lg relative" ref={dropdownRef}>
        <div className="glass-search-capsule flex items-center px-4 h-10 gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder="Search Account ID (e.g. 5295) or Transaction ID (e.g. 1301482)..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
          {loading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && results && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl glass-panel-3d bg-white/95 shadow-2xl z-50 space-y-3 max-h-96 overflow-y-auto">
            {results.accounts.length === 0 && results.transactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching accounts or transactions found.
              </div>
            ) : (
              <>
                {results.accounts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                      Matched Accounts ({results.accounts.length})
                    </div>
                    <div className="space-y-1">
                      {results.accounts.map((acc: any) => (
                        <div
                          key={acc.account_id}
                          onClick={() => handleSelectAccount(acc.account_id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/80 cursor-pointer transition-colors"
                        >
                          <div className="font-mono text-xs font-bold text-slate-900">
                            ACC-{acc.account_id}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                            Balance: ${Number(acc.initial_balance || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.transactions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                      Matched Transactions ({results.transactions.length})
                    </div>
                    <div className="space-y-1">
                      {results.transactions.map((tx: any) => (
                        <div
                          key={tx.tx_id}
                          onClick={() => handleSelectTransaction(tx.tx_id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/80 cursor-pointer transition-colors"
                        >
                          <div className="font-mono text-xs font-bold text-slate-900">
                            TX-{tx.tx_id}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            ${Number(tx.tx_amount || 0).toLocaleString()} · {tx.is_fraud ? 'FRAUD' : 'NORMAL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Telemetry Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div
            className={`w-2 h-2 rounded-full ${
              systemOk ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-rose-500 shadow-[0_0_8px_#EF4444]'
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {systemOk ? 'ML Engine Live' : 'Offline'}
          </span>
        </div>

        {/* Quick Upload CTA */}
        <Link
          href="/upload"
          className="btn-glass-primary px-3.5 sm:px-4 py-2 text-xs flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Ingest Data</span>
        </Link>
      </div>
    </header>
  )
}
