'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Network, ActivitySquare, ShieldAlert, Loader2, UserCheck } from "lucide-react"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { useAuth } from "@/lib/auth"

export default function AccountDetailPage({ params }: { params: any }) {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const id = (routeParams?.id as string) || params?.id
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    authFetch(`http://127.0.0.1:8000/api/accounts/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, authFetch])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Loading Account Intelligence Profile...
          </span>
        </div>
      </div>
    )
  }

  if (!data || !data.account) {
    return (
      <div className="space-y-4 p-8 text-center rounded-3xl bg-white/75 border border-white/80 max-w-md mx-auto shadow-sm">
        <div className="text-sm font-bold text-rose-600">Account ACC-{id} not found in workspace.</div>
        <Link href="/accounts" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to Accounts
        </Link>
      </div>
    )
  }

  const acc = data.account
  const transactions = data.recent_transactions || []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/accounts" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Accounts
        </Link>
        <span className="text-slate-400">›</span>
        <span className="text-xs font-bold font-mono text-slate-700">ACC-{id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-mono text-slate-900">ACC-{acc.account_id}</h1>
            {acc.is_fraud ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                FRAUD FLAGGED
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                MONITORED ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Customer Identifier: <strong className="font-mono text-slate-700">{acc.customer_id}</strong></p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/drift/${acc.account_id}`}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <ActivitySquare className="w-4 h-4" />
            <span>Drift Analysis</span>
          </Link>
          <Link
            href={`/network/${acc.account_id}`}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <Network className="w-4 h-4" />
            <span>Network Graph</span>
          </Link>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile Metadata</div>
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Customer ID</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{acc.customer_id || '–'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Account Type</div>
              <div className="font-bold text-slate-900 mt-0.5">{acc.account_type || 'STANDARD'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction / Country</div>
              <div className="font-bold text-slate-900 mt-0.5">{acc.country || 'US'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Initial Ledger Balance</div>
              <div className="font-mono font-bold text-emerald-600 mt-0.5 text-sm">
                ${(acc.init_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investigation & Quick Actions</div>
          <div className="grid sm:grid-cols-2 gap-3.5">
            <Link
              href={`/drift/${acc.account_id}`}
              className="p-4.5 rounded-2xl backdrop-blur-md bg-white/80 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all space-y-1 shadow-[0_2px_8px_rgba(15,23,42,0.02)] group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:underline">
                <ActivitySquare className="w-4 h-4" />
                <span>Behavioral Drift</span>
              </div>
              <p className="text-[11px] text-slate-500">Inspect Page-Hinkley, CUSUM, and Z-score shifts</p>
            </Link>

            <Link
              href={`/network/${acc.account_id}`}
              className="p-4.5 rounded-2xl backdrop-blur-md bg-white/80 border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/40 transition-all space-y-1 shadow-[0_2px_8px_rgba(15,23,42,0.02)] group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 group-hover:underline">
                <Network className="w-4 h-4" />
                <span>Network Graph</span>
              </div>
              <p className="text-[11px] text-slate-500">Explore 2-hop transaction money trail</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="px-6 py-4 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white/40">
          Recent Transactions Associated with ACC-{acc.account_id}
        </div>
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>TX ID</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Risk Band</th>
                <th className="text-center">Score</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx: any) => (
                  <tr key={tx.tx_id}>
                    <td className="font-mono font-bold text-slate-900">TX-{tx.tx_id}</td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                        {tx.type || 'TRANSFER'}
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      ${(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center">
                      <RiskBadge level={tx.risk_band || 'LOW'} />
                    </td>
                    <td className="text-center font-mono font-bold text-rose-600">
                      {tx.composite_score != null ? `${(tx.composite_score * 100).toFixed(0)}%` : '–'}
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
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                    No transaction records indexed for this entity.
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
