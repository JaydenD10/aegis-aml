'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Microscope, ArrowLeft, Activity, Sparkles, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { useAuth } from "@/lib/auth"

export default function ExplainabilityDetailPage({ params }: { params: any }) {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const transactionId = (routeParams?.transactionId as string) || params?.transactionId
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!transactionId) return
    authFetch(`http://127.0.0.1:8000/api/explainability/${transactionId}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [transactionId, authFetch])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Deconstructing Model Feature Attributions (SHAP)...
          </span>
        </div>
      </div>
    )
  }

  if (!data || !data.transaction) {
    return (
      <div className="space-y-4 p-8 text-center rounded-3xl bg-white/75 border border-white/80 max-w-md mx-auto shadow-sm">
        <div className="text-sm font-bold text-rose-600">Transaction TX-{transactionId} not found in workspace.</div>
        <Link href="/explainability" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to Explainability
        </Link>
      </div>
    )
  }

  const { transaction: tx, ml_prediction: ml, explanation: expl } = data
  const isHighRisk = ml?.risk_band === "CRITICAL" || ml?.risk_band === "HIGH"

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link href="/explainability" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Explainability
        </Link>
        <span className="text-slate-400">›</span>
        <span className="text-xs font-bold font-mono text-slate-700">TX-{transactionId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-mono text-slate-900">TX-{tx.tx_id}</h1>
            <RiskBadge level={ml?.risk_band ?? (tx.is_fraud ? 'CRITICAL' : 'LOW')} />
            {tx.is_fraud && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                CONFIRMED FRAUD
              </span>
            )}
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-600 mt-2">
            <span>Sender: <strong className="font-mono text-slate-900">ACC-{tx.sender_account_id}</strong></span>
            <span>Receiver: <strong className="font-mono text-slate-900">ACC-{tx.receiver_account_id}</strong></span>
            <span>Amount: <strong className="font-mono text-emerald-600">${(tx.tx_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Predicted Risk Score</span>
          <div className={`text-3xl font-black font-mono mt-0.5 ${isHighRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
            {ml?.composite_score != null ? `${(ml.composite_score * 100).toFixed(1)}%` : '–'}
          </div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'ML Fraud Probability', value: ml?.ml_score, color: '#DC2626' },
          { label: 'Behavioral Drift Score', value: ml?.drift_score, color: '#0891B2' },
          { label: 'Composite Risk Banding', value: ml?.composite_score, color: '#7C3AED' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-3xl p-5 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">{label}</span>
              <span className="font-mono text-slate-900">{value != null ? `${(value * 100).toFixed(1)}%` : '–'}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
              <div className="h-full rounded-full" style={{ width: `${(value || 0) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* SHAP Feature Contribution Waterfall Table */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2.5">
            <Microscope className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Shapley Feature Attribution Drivers</span>
          </div>
          <span className="text-xs text-slate-400">Local TreeExplainer Decomposition</span>
        </div>

        <div className="p-6 space-y-3.5">
          {expl && typeof expl === 'object' && Object.keys(expl).length > 0 ? (
            Object.entries(expl).map(([featName, featData]: [string, any]) => {
              const contrib = featData?.shap_contribution ?? 0
              const isPositive = contrib > 0
              const absVal = Math.min(100, Math.abs(contrib) * 70)

              return (
                <div key={featName} className="p-4 rounded-2xl backdrop-blur-md bg-white/80 border border-slate-200/80 shadow-[0_2px_6px_rgba(15,23,42,0.02)] space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-rose-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="font-mono text-xs font-bold text-slate-900">{featName}</span>
                      <span className="text-xs text-slate-500">
                        (Value: <strong className="font-mono text-slate-700">{typeof featData?.value === 'number' ? featData.value.toFixed(2) : featData?.value}</strong>)
                      </span>
                    </div>

                    <span className={`text-xs font-mono font-bold ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isPositive ? `+${contrib.toFixed(3)} (Increases Risk)` : `${contrib.toFixed(3)} (Decreases Risk)`}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/60">
                    <div
                      className={`h-full rounded-full transition-all ${isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.max(8, absVal)}%` }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No granular SHAP vector found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
