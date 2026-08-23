'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FileSearch, Plus, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  OPEN:          { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: 'rgba(37, 99, 235, 0.25)' },
  INVESTIGATING: { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', border: 'rgba(245, 158, 11, 0.25)' },
  ESCALATED:     { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', border: 'rgba(239, 68, 68, 0.25)' },
  CLEARED:       { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)' },
  CLOSED:        { bg: 'rgba(148, 163, 184, 0.15)', color: '#475569', border: 'rgba(148, 163, 184, 0.3)' },
}

export default function InvestigationsPage() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [targetType, setTargetType] = useState('account')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const fetchInvestigations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('http://127.0.0.1:8000/api/investigations')
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
    fetchInvestigations()
  }, [fetchInvestigations])

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId.trim()) return
    setCreating(true)
    setCreateError('')

    try {
      const res = await authFetch('http://127.0.0.1:8000/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId.trim(), target_type: targetType })
      })
      if (!res.ok) {
        setCreateError('Failed to create investigation.')
        setCreating(false)
        return
      }
      setShowCreateModal(false)
      setTargetId('')
      fetchInvestigations()
    } catch {
      setCreateError('Connection error.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1440px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title="Case Management Workspace"
          subtitle="Formal AML investigation dossiers, evidence logging, and disposition tracking."
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 h-11 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Target Entity</th>
                <th>Target Type</th>
                <th className="text-center">Status</th>
                <th>Opened Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading investigation cases...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item: any) => {
                  const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.CLOSED
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link 
                          href={`/investigations/${item.id}`} 
                          className="font-mono font-bold text-blue-600 hover:underline"
                        >
                          CASE-{item.id}
                        </Link>
                      </td>
                      <td className="font-mono font-bold text-slate-900">
                        {item.target_type === 'account' ? `ACC-${item.target_id}` : `TX-${item.target_id}`}
                      </td>
                      <td>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                          {item.target_type}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {item.created_at ? new Date(item.created_at * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/investigations/${item.id}`}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Dossier →
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-14">
                    <FileSearch className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-800">No active investigations in workspace</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Escalate suspicious accounts or transactions into full investigation dossiers to document audit notes and regulatory decisions.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="max-w-md w-full rounded-3xl p-6 backdrop-blur-2xl bg-white border border-white/90 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Open AML Investigation</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-sm text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Target Entity Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-bold rounded-xl outline-none bg-white border border-slate-200 text-slate-900"
                >
                  <option value="account">Account Entity</option>
                  <option value="transaction">Transaction Record</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Target Identifier (ID)
                </label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="e.g. 5295 or 1301482"
                  className="w-full h-11 px-4 text-xs font-mono rounded-xl outline-none bg-white border border-slate-200 text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 h-11 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Case'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 h-11 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
