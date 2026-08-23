'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, Loader2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function AuditLogPage() {
  const { authFetch } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('http://127.0.0.1:8000/api/audit')
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
    fetchAuditLogs()
  }, [fetchAuditLogs])

  return (
    <div className="space-y-6 max-w-[1440px]">
      <PageHeader
        title="Immutable System Audit Trail"
        subtitle="Cryptographically tracked log of all analyst actions, investigation status updates, and pipeline executions."
      />

      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Analyst / Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Previous Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : items && items.length > 0 ? (
                items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : 'N/A'}
                    </td>
                    <td className="font-bold text-slate-900">{item.user_id || 'System'}</td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {item.role || 'ANALYST'}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-xs text-blue-600">{item.action || 'LOG_EVENT'}</td>
                    <td className="font-mono text-xs text-slate-600">
                      {item.entity_type}:{item.entity_id}
                    </td>
                    <td className="text-xs text-slate-400">{item.previous_value || '–'}</td>
                    <td className="text-xs font-bold text-slate-900">{item.new_value || '–'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No audit records logged yet in workspace.
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
