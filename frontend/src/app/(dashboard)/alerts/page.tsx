'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Loader2, Bell, ShieldAlert, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function AlertsPage() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    const skip = (page - 1) * limit
    let url = `/api/alerts?skip=${skip}&limit=${limit}`
    if (search) url += `&search=${encodeURIComponent(search)}`

    try {
      const res = await authFetch(url)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [authFetch, page, search])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1440px]">
      <PageHeader
        title="Active Compliance Alerts"
        subtitle="Flagged anomalies, velocity spikes, and high-risk ML predictions requiring triage."
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form 
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} 
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search alert ID, type, or TX ID..."
            className="pl-10 pr-4 h-10 text-xs rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-80 bg-white/80 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
          />
        </form>

        <div className="text-xs font-bold text-slate-500">
          {total.toLocaleString()} active alerts
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Alert Type</th>
                <th>TX ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Fraud Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading alerts...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((al: any) => (
                  <tr key={al.alert_id}>
                    <td>
                      <span className="font-mono font-bold text-amber-600">
                        ALT-{al.alert_id}
                      </span>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                        {al.alert_type}
                      </span>
                    </td>
                    <td className="font-mono text-slate-600">
                      {al.tx_id ? (
                        <Link href={`/transactions/${al.tx_id}`} className="hover:text-blue-600 hover:underline">
                          TX-{al.tx_id}
                        </Link>
                      ) : '–'}
                    </td>
                    <td className="font-mono text-slate-600">
                      {al.sender_account_id ? (
                        <Link href={`/accounts/${al.sender_account_id}`} className="hover:text-blue-600 hover:underline">
                          ACC-{al.sender_account_id}
                        </Link>
                      ) : '–'}
                    </td>
                    <td className="font-mono text-slate-600">
                      {al.receiver_account_id ? (
                        <Link href={`/accounts/${al.receiver_account_id}`} className="hover:text-blue-600 hover:underline">
                          ACC-{al.receiver_account_id}
                        </Link>
                      ) : '–'}
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      ${(al.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center">
                      {al.is_fraud ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          CONFIRMED FRAUD
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          SUSPICIOUS
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {al.tx_id && (
                        <Link
                          href={`/transactions/${al.tx_id}`}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Triage →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-slate-400">
                    No active alerts in workspace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-500 bg-white/40">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 disabled:opacity-40 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 disabled:opacity-40 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
