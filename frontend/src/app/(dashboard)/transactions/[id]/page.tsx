'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ShieldAlert, Activity, Microscope, Loader2, Sparkles } from "lucide-react"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { useAuth } from "@/lib/auth"

export default function TransactionDetailPage({ params }: { params: any }) {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const id = (routeParams?.id as string) || params?.id
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    authFetch(`http://127.0.0.1:8000/api/transactions/${id}`)
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
            Loading Transaction Record...
          </span>
        </div>
      </div>
    )
  }

  if (!data || !data.transaction) {
    return (
      <div className="space-y-4 p-8 text-center rounded-3xl bg-white/75 border border-white/80 max-w-md mx-auto shadow-sm">
        <div className="text-sm font-bold text-rose-600">Transaction TX-{id} not found in workspace.</div>
        <Link href="/transactions" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to Transactions
        </Link>
      </div>
    )
  }

  const tx = data.transaction
  const ml = data.ml_prediction
  const riskBand = ml?.risk_band || (tx.is_fraud ? 'CRITICAL' : 'LOW')

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/transactions" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Transactions
        </Link>
        <span className="text-slate-400">›</span>
        <span className="text-xs font-bold font-mono text-slate-700">TX-{tx.tx_id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-mono text-slate-900">TX-{tx.tx_id}</h1>
            <RiskBadge level={riskBand} />
            {tx.is_fraud && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                CONFIRMED FRAUD
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Surveillance Record · Timestamp: <strong className="font-mono text-slate-700">{tx.timestamp}</strong></p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/explainability/${tx.tx_id}`}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
          >
            <Microscope className="w-4 h-4" />
            <span>SHAP Explainability</span>
          </Link>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Core Attributes */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaction Attributes</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Sender Account</div>
              <Link href={`/accounts/${tx.sender_account_id}`} className="font-mono font-bold text-blue-600 hover:underline mt-0.5 block">
                ACC-{tx.sender_account_id}
              </Link>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Receiver Account</div>
              <Link href={`/accounts/${tx.receiver_account_id}`} className="font-mono font-bold text-blue-600 hover:underline mt-0.5 block">
                ACC-{tx.receiver_account_id}
              </Link>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Transaction Type</div>
              <div className="font-bold text-slate-900 mt-0.5">{tx.tx_type || 'TRANSFER'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Transaction Amount</div>
              <div className="font-mono font-black text-xl text-slate-900 mt-0.5">
                ${(tx.tx_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* ML Prediction Vector */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model Risk Attribution</div>
          </div>
          
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                <span>ML Fraud Score</span>
                <span className="font-mono font-bold text-rose-600">
                  {ml?.ml_score != null ? `${(ml.ml_score * 100).toFixed(1)}%` : '–'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                <div className="h-full rounded-full bg-rose-500" style={{ width: `${(ml?.ml_score || 0) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                <span>Drift Score</span>
                <span className="font-mono font-bold text-cyan-600">
                  {ml?.drift_score != null ? (ml.drift_score).toFixed(3) : '–'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${(ml?.drift_score || 0) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                <span>Composite Risk Score (70% ML + 30% Drift)</span>
                <span className="font-mono font-bold text-purple-600">
                  {ml?.composite_score != null ? `${(ml.composite_score * 100).toFixed(1)}%` : '–'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${(ml?.composite_score || 0) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
