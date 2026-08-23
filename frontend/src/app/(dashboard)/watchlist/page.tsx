'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Eye, ShieldAlert, Loader2 } from 'lucide-react'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function WatchlistPage() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('http://127.0.0.1:8000/api/watchlist')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  return (
    <div className="space-y-6 max-w-[1440px]">
      <PageHeader
        title="High-Risk Entity Watchlist"
        subtitle="Priority monitored accounts ranked by composite ML risk score and drift threshold violations."
      />

      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Account ID</th>
                <th className="text-center">Risk Band</th>
                <th>Composite Score</th>
                <th>Flag Rationale</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading watchlist...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item: any, idx: number) => {
                  const score = item.composite_score ?? 0
                  const pct = Math.round(score * 100)
                  return (
                    <tr key={item.account_id}>
                      <td className="font-mono text-center text-slate-400">#{idx + 1}</td>
                      <td>
                        <Link 
                          href={`/accounts/${item.account_id}`} 
                          className="font-mono font-bold text-blue-600 hover:underline"
                        >
                          ACC-{item.account_id}
                        </Link>
                      </td>
                      <td className="text-center">
                        <RiskBadge level={item.risk_band ?? 'CRITICAL'} />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2.5 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(5, pct))}%`,
                                background: pct >= 75 ? '#DC2626' : pct >= 50 ? '#EA580C' : '#D97706',
                              }}
                            />
                          </div>
                          <span
                            className="font-mono font-bold text-xs"
                            style={{ color: pct >= 75 ? '#DC2626' : pct >= 50 ? '#EA580C' : '#D97706' }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-xs text-slate-600 truncate max-w-xs">
                            {item.reason ?? 'Anomaly threshold exceeded'}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/accounts/${item.account_id}`}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Investigate →
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-400">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No entities currently on watchlist.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
