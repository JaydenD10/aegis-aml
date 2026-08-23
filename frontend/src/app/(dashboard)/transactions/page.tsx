'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, Loader2, ArrowRightLeft, ShieldAlert } from 'lucide-react'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

const RISK_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function TransactionsPage() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [risk, setRisk] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const skip = (page - 1) * limit
    let url = `http://127.0.0.1:8000/api/transactions?skip=${skip}&limit=${limit}`
    if (risk && risk !== 'ALL') url += `&risk_band=${encodeURIComponent(risk)}`
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
  }, [authFetch, page, risk, search])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1440px]">
      <PageHeader
        title="Transaction Surveillance Ledger"
        subtitle="ML-scored transactions with composite risk calculations and behavioral drift tags."
      />

      {/* Filters Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <form 
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} 
            className="relative"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search TX ID or account..."
              className="pl-10 pr-4 h-10 text-xs rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-72 bg-white/80 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
            />
          </form>

          <div className="flex items-center gap-1.5 bg-white/60 p-1 rounded-xl border border-slate-200/60">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {RISK_FILTERS.map((f) => {
              const active = (f === 'ALL' && !risk) || risk === f
              return (
                <button
                  key={f}
                  onClick={() => { setRisk(f === 'ALL' ? '' : f); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {f}
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500">
          {total.toLocaleString()} transactions indexed
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>TX ID</th>
                <th>Sender Account</th>
                <th>Receiver Account</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-center">ML Score</th>
                <th className="text-center">Drift Score</th>
                <th className="text-center">Risk Band</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((tx: any) => (
                  <tr key={tx.tx_id}>
                    <td className="font-mono font-bold text-slate-900">TX-{tx.tx_id}</td>
                    <td className="font-mono text-slate-600">
                      <Link href={`/accounts/${tx.sender_account_id}`} className="hover:text-blue-600 hover:underline">
                        ACC-{tx.sender_account_id}
                      </Link>
                    </td>
                    <td className="font-mono text-slate-600">
                      <Link href={`/accounts/${tx.receiver_account_id}`} className="hover:text-blue-600 hover:underline">
                        ACC-{tx.receiver_account_id}
                      </Link>
                    </td>
                    <td>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                        {tx.tx_type}
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      ${(tx.tx_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center font-mono font-bold text-rose-600">
                      {tx.ml_score != null ? `${(tx.ml_score * 100).toFixed(1)}%` : '–'}
                    </td>
                    <td className="text-center font-mono font-bold text-cyan-700">
                      {tx.drift_score != null ? (tx.drift_score).toFixed(2) : '–'}
                    </td>
                    <td className="text-center">
                      <RiskBadge level={tx.risk_band || (tx.is_fraud ? 'CRITICAL' : 'LOW')} />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/transactions/${tx.tx_id}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs text-slate-400">
                    No transactions found matching criteria.
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
