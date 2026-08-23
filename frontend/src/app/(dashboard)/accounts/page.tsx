'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Loader2, Users, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function AccountsPage() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const skip = (page - 1) * limit
    let url = `/api/accounts?skip=${skip}&limit=${limit}`
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
    fetchAccounts()
  }, [fetchAccounts])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1440px]">
      <PageHeader
        title="Monitored Entities & Accounts"
        subtitle="Customer profiles, baseline balances, KYC metadata, and anomaly flags."
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
            placeholder="Search account ID, customer, country..."
            className="pl-10 pr-4 h-10 text-xs rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-80 bg-white/80 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
          />
        </form>

        <div className="text-xs font-bold text-slate-500">
          {total.toLocaleString()} accounts indexed
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Customer ID</th>
                <th>Account Type</th>
                <th>Country</th>
                <th className="text-right">Initial Balance</th>
                <th className="text-center">Fraud Flag</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((acc: any) => (
                  <tr key={acc.account_id}>
                    <td>
                      <Link 
                        href={`/accounts/${acc.account_id}`} 
                        className="font-mono font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        ACC-{acc.account_id}
                      </Link>
                    </td>
                    <td className="font-mono text-slate-600">{acc.customer_id || '–'}</td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                        {acc.account_type || 'STANDARD'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">{acc.country || 'US'}</td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      ${(acc.init_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center">
                      {acc.is_fraud ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          FRAUD FLAGGED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          CLEAR
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/accounts/${acc.account_id}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                    No accounts found in workspace.
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
