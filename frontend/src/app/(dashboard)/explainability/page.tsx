'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Microscope, Search, ArrowRight, Loader2, ShieldAlert } from 'lucide-react'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function ExplainabilityIndexPage() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const [txId, setTxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = txId.trim()
    if (!id) { setError('Please enter a Transaction ID.'); return }
    if (!/^\d+$/.test(id)) { setError('Transaction ID must be a valid number.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/explainability/${id}`)
      if (res.status === 404) {
        setError(`Transaction TX-${id} not found in workspace.`)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError('Server error during explainability lookup.')
        setLoading(false)
        return
      }
      router.push(`/explainability/${id}`)
    } catch {
      setError('Cannot reach backend server. Is FastAPI running?')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Model Explainability (SHAP)"
        subtitle="Deconstruct machine learning risk predictions into granular positive and negative feature attribution vectors using Shapley Additive exPlanations."
      />

      {/* Direct lookup */}
      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Direct Transaction SHAP Inspector</div>
            <div className="text-xs text-slate-400 mt-0.5">Enter any transaction ID to generate or view its local explanation vector.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            name="tx"
            value={txId}
            onChange={e => { setTxId(e.target.value); setError('') }}
            placeholder="Enter Transaction ID (e.g. 101, 1126548)"
            disabled={loading}
            className="flex-1 px-4 h-11 text-xs sm:text-sm rounded-xl outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white/80 border border-slate-200/80 text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 h-11 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Explain Risk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-2xl flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Pre-computed SHAP records table */}
      <ExplainabilityTable />
    </div>
  )
}

function ExplainabilityTable() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[] | null>(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    authFetch('http://127.0.0.1:8000/api/explainability')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setItems(d.items || []))
      .catch(() => { setFetchError(true); setItems([]) })
  }, [authFetch])

  if (items === null) {
    return (
      <div className="rounded-3xl p-10 flex items-center justify-center gap-3 backdrop-blur-2xl bg-white/75 border border-white/80">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Loading SHAP Explanation Index...
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
      <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-2.5">
          <Microscope className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">Available SHAP Explanations in Workspace</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{items.length} records ready</span>
      </div>

      <div className="overflow-x-auto">
        <table className="aml-table">
          <thead>
            <tr>
              <th>TX ID</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th className="text-right">Amount</th>
              <th className="text-center">ML Score</th>
              <th className="text-center">Risk Band</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item: any) => (
                <tr key={item.tx_id}>
                  <td className="font-mono font-bold text-slate-900">TX-{item.tx_id}</td>
                  <td className="font-mono text-slate-600">ACC-{item.sender_account_id}</td>
                  <td className="font-mono text-slate-600">ACC-{item.receiver_account_id}</td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {item.tx_amount != null ? `$${item.tx_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '–'}
                  </td>
                  <td className="text-center font-mono font-bold text-rose-600">
                    {item.ml_score != null ? `${(item.ml_score * 100).toFixed(1)}%` : '–'}
                  </td>
                  <td className="text-center">
                    <RiskBadge level={item.risk_band ?? (item.is_fraud ? 'CRITICAL' : 'LOW')} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/explainability/${item.tx_id}`}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Deconstruct →
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-10 font-medium text-xs text-slate-400">
                  {fetchError ? 'Failed to connect to backend.' : 'No SHAP records in workspace yet. Upload a CSV to generate explanations.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
