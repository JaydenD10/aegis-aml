'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Network, ArrowRight, Loader2, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function NetworkPage() {
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
      const res = await authFetch(`http://127.0.0.1:8000/api/network/${id}`)
      if (res.status === 404) {
        setError(`Account ACC-${id} not found in workspace.`)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError('Server error during network lookup.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!data.nodes || data.nodes.length === 0) {
        setError(`No transaction network graph found for account ACC-${id}.`)
        setLoading(false)
        return
      }
      router.push(`/network/${id}`)
    } catch {
      setError('Cannot reach backend server. Is FastAPI running?')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Transaction Network Analysis"
        subtitle="2-hop bounded subgraph topological visualization of transactional relationships, fan-out ratios, and PageRank centrality."
      />

      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600 border border-purple-200 shadow-[0_4px_14px_rgba(139,92,246,0.15)]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Entity Graph Inspector</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Enter an account ID to visualize its multi-party transaction neighborhood, money flow vectors, and hub connections.
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
            className="flex-1 px-4 h-11 text-xs sm:text-sm rounded-xl outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white/80 border border-slate-200/80 text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 h-11 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_rgba(139,92,246,0.3)] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Visualize Graph</span>
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
            Topological Features
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '2-Hop Traversal', desc: 'Expands direct and second-degree transaction ties' },
              { label: 'Interactive ReactFlow', desc: 'Draggable, zoomable canvas with edge weight cues' },
              { label: 'Risk Heatmapping', desc: 'Centrality nodes highlighted by fraud probability' },
              { label: 'Bounded Density', desc: 'Optimized 50-edge bounded subgraph layout' },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="rounded-2xl p-3.5 backdrop-blur-md bg-white/80 border border-slate-200/80 shadow-[0_2px_6px_rgba(15,23,42,0.02)] space-y-1"
              >
                <div className="text-xs font-bold text-purple-700">{label}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
