'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActivitySquare, ArrowRight, Loader2, Sparkles, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function DriftPage() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = accountId.trim()
    if (!id) { setError('Please enter an Account ID.'); return }
    if (!/^\d+$/.test(id)) { setError('Account ID must be a valid number.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authFetch(`http://127.0.0.1:8000/api/drift/${id}`)
      if (res.status === 404) {
        setError(`Account ACC-${id} not found in workspace.`)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError('Server error during drift lookup.')
        setLoading(false)
        return
      }
      router.push(`/drift/${id}`)
    } catch {
      setError('Cannot reach backend server. Is FastAPI running?')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Behavioral Drift Analysis"
        subtitle="Multi-detector statistical surveillance (Page-Hinkley, CUSUM, KS-Test, Z-Score) monitoring dynamic shifts in entity transaction patterns."
      />

      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-200 shadow-[0_4px_14px_rgba(37,99,235,0.15)]">
            <ActivitySquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Entity Drift Inspector</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Enter an account ID to visualize its temporal drift timeline, velocity deviations, and detector alerts.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            name="account"
            value={accountId}
            onChange={e => { setAccountId(e.target.value); setError('') }}
            placeholder="Enter Account ID (e.g. 0, 10, 42, 5295)"
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
                <span>Analyze Drift</span>
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

        <div className="pt-4 border-t border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Active Drift Detectors
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Page-Hinkley', desc: 'Cumulative mean shift anomaly detector', color: '#0284C7' },
              { name: 'CUSUM',        desc: 'Cumulative sum quality control monitor', color: '#2563EB' },
              { name: 'KS-Test',      desc: 'Kolmogorov-Smirnov two-sample distribution test', color: '#7C3AED' },
              { name: 'Z-Score',      desc: 'Rolling standard deviation outlier threshold', color: '#EA580C' },
            ].map(({ name, desc, color }) => (
              <div
                key={name}
                className="rounded-2xl p-3.5 text-center backdrop-blur-md bg-white/80 border border-slate-200/80 shadow-[0_2px_6px_rgba(15,23,42,0.02)] space-y-1"
              >
                <div className="text-xs font-bold" style={{ color }}>{name}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
