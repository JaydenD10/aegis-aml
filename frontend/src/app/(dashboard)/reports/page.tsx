'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FileText, ShieldAlert, AlertTriangle, Loader2, Download, Printer } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function ReportsPage() {
  const { authFetch } = useAuth()
  const [investigations, setInvestigations] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    try {
      const [invRes, statsRes] = await Promise.all([
        authFetch('/api/investigations'),
        authFetch('/api/dashboard/stats')
      ])
      if (invRes.ok) {
        const invData = await invRes.json()
        setInvestigations(invData.items || [])
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title="Regulatory & Compliance Reports"
          subtitle="Official compliance documentation, suspicious activity reports, and case disposition packages."
        />
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Cases"
          value={investigations.length}
          icon={<FileText className="w-4 h-4" />}
          accent="blue"
        />
        <KpiCard
          label="Open Investigations"
          value={investigations.filter((i: any) => i.status === 'OPEN').length}
          icon={<AlertTriangle className="w-4 h-4" />}
          accent="orange"
        />
        <KpiCard
          label="Fraud Transactions"
          value={(stats?.fraud_transactions || 0).toLocaleString()}
          icon={<ShieldAlert className="w-4 h-4" />}
          accent="red"
        />
        <KpiCard
          label="Monitored Entities"
          value={(stats?.total_accounts || 0).toLocaleString()}
          icon={<FileText className="w-4 h-4" />}
          accent="cyan"
        />
      </div>

      {/* Cases List */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center gap-2.5 bg-white/40">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">Investigation Case Packages</span>
        </div>

        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Target Entity</th>
                <th className="text-center">Status</th>
                <th>Opened Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-xs font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading reports...</span>
                    </div>
                  </td>
                </tr>
              ) : investigations.length > 0 ? (
                investigations.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-mono font-bold text-blue-600">CASE-{inv.id}</td>
                    <td className="font-mono text-slate-900 font-bold">
                      {inv.target_type === 'account' ? `ACC-${inv.target_id}` : `TX-${inv.target_id}`}
                    </td>
                    <td className="text-center">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {inv.created_at ? new Date(inv.created_at * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="text-right">
                      <Link 
                        href={`/reports/${inv.id}`} 
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        View Dossier →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-xs text-slate-400">
                    No investigation reports filed in workspace.
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
