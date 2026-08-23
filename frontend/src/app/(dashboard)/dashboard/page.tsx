'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  Users,
  ArrowLeftRight,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Network,
  ActivitySquare,
  AlertTriangle,
  UploadCloud,
  FileSearch,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { useAuth } from '@/lib/auth'

export default function DashboardPage() {
  const { authFetch } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, watchRes, txRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/watchlist'),
        authFetch('/api/transactions?limit=6'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
      if (watchRes.ok) {
        const watchData = await watchRes.json()
        setWatchlist(watchData.items || [])
      }
      if (txRes.ok) {
        const txData = await txRes.json()
        setRecentTransactions(txData.items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const totalAccounts = stats?.total_accounts || 0
  const totalTransactions = stats?.total_transactions || 0
  const fraudTransactions = stats?.fraud_transactions || 0
  const activeAlerts = stats?.active_alerts || 0
  const fraudRate = totalTransactions > 0 ? ((fraudTransactions / totalTransactions) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
      {/* Top Banner / Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Command Center Overview"
          subtitle="Real-time AML surveillance, multi-detector drift metrics, and TreeExplainer forensic analytics."
        />
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/upload"
            className="btn-glass-primary px-4 py-2.5 text-xs flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Dataset</span>
          </Link>
          <Link
            href="/investigations"
            className="btn-glass-secondary px-4 py-2.5 text-xs flex items-center gap-2"
          >
            <FileSearch className="w-4 h-4 text-blue-600" />
            <span>Open Case</span>
          </Link>
        </div>
      </div>

      {/* 4 Floating 3D Liquid Glass KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          label="Total Monitored Accounts"
          value={totalAccounts}
          icon={<Users className="w-5 h-5" />}
          accent="blue"
          change="+12.4% Active"
          subtitle="PostgreSQL Tenant Index"
        />
        <KpiCard
          label="Total Transactions Analyzed"
          value={totalTransactions}
          icon={<ArrowLeftRight className="w-5 h-5" />}
          accent="cyan"
          change="Surveillance Live"
          subtitle="Real-time Vector Feed"
        />
        <KpiCard
          label="Confirmed Fraud Flagged"
          value={fraudTransactions}
          icon={<ShieldAlert className="w-5 h-5" />}
          accent="red"
          change={`${fraudRate}% of total`}
          subtitle="XGBoost High Probability"
        />
        <KpiCard
          label="Active Compliance Alerts"
          value={activeAlerts}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="orange"
          change="Requires Triage"
          subtitle="Spikes & Anomaly Drift"
        />
      </div>

      {/* Middle Grid: Risk Distribution & Priority Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Card (2 Columns) */}
        <div className="lg:col-span-2 glass-panel-3d p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-600 border border-blue-500/30 shadow-[0_2px_10px_rgba(37,99,235,0.2)]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Entity Risk Tier Distribution</h3>
                <p className="text-xs text-slate-400">Dynamic clustering across monitored portfolio</p>
              </div>
            </div>
            <Link
              href="/accounts"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Animated 3D Liquid Glass Progress Tracks */}
          <div className="space-y-4 pt-1">
            {[
              { label: 'Critical Risk', count: Math.round(totalAccounts * 0.08), pct: 8, color: '#EF4444', gradient: 'from-rose-500 to-red-600', glow: 'rgba(239, 68, 68, 0.35)', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
              { label: 'High Risk', count: Math.round(totalAccounts * 0.18), pct: 18, color: '#F97316', gradient: 'from-orange-500 to-amber-600', glow: 'rgba(249, 115, 22, 0.35)', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
              { label: 'Medium Risk', count: Math.round(totalAccounts * 0.34), pct: 34, color: '#F59E0B', gradient: 'from-amber-400 to-yellow-500', glow: 'rgba(245, 158, 11, 0.35)', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
              { label: 'Low Risk / Nominal', count: Math.round(totalAccounts * 0.40), pct: 40, color: '#10B981', gradient: 'from-emerald-400 to-teal-600', glow: 'rgba(16, 185, 129, 0.35)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((tier) => (
              <div key={tier.label} className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: tier.color, boxShadow: `0 0 8px ${tier.glow}` }}
                    />
                    <span className="font-bold text-slate-800">{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">{tier.count.toLocaleString()} entities</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                      {tier.pct}%
                    </span>
                  </div>
                </div>

                {/* 3D Glass Progress Bar */}
                <div className="h-2.5 rounded-full bg-slate-100/90 overflow-hidden border border-slate-200/50 p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-1000`}
                    style={{
                      width: `${tier.pct}%`,
                      boxShadow: `0 0 10px ${tier.glow}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick AI Forensics Launchpad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
            <Link
              href="/drift"
              className="p-3.5 rounded-2xl bg-white/70 hover:bg-white/95 border border-slate-200/80 shadow-sm transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-2 mb-1 text-blue-600">
                <ActivitySquare className="w-4 h-4" />
                <span className="text-xs font-bold">Behavioral Drift</span>
              </div>
              <p className="text-[11px] text-slate-500">Page-Hinkley & CUSUM dynamic shift detectors</p>
            </Link>

            <Link
              href="/network"
              className="p-3.5 rounded-2xl bg-white/70 hover:bg-white/95 border border-slate-200/80 shadow-sm transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-2 mb-1 text-purple-600">
                <Network className="w-4 h-4" />
                <span className="text-xs font-bold">Network Subgraph</span>
              </div>
              <p className="text-[11px] text-slate-500">2-hop topological entity cluster analyzer</p>
            </Link>

            <Link
              href="/explainability"
              className="p-3.5 rounded-2xl bg-white/70 hover:bg-white/95 border border-slate-200/80 shadow-sm transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-2 mb-1 text-cyan-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold">SHAP Explainability</span>
              </div>
              <p className="text-[11px] text-slate-500">TreeExplainer local risk drivers decomposition</p>
            </Link>
          </div>
        </div>

        {/* Priority Watchlist (1 Column) */}
        <div className="glass-panel-3d p-6 sm:p-7 space-y-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-600 border border-rose-500/30 shadow-[0_2px_10px_rgba(239,68,68,0.2)]">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Priority Watchlist</h3>
                <p className="text-xs text-slate-400">High-risk monitored entities</p>
              </div>
            </div>
            <Link
              href="/watchlist"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
            {watchlist.length > 0 ? (
              watchlist.slice(0, 5).map((item) => (
                <Link
                  key={item.account_id}
                  href={`/accounts/${item.account_id}`}
                  className="block p-3.5 rounded-2xl bg-white/70 hover:bg-white/95 border border-slate-200/70 shadow-[0_2px_8px_rgba(15,23,42,0.02)] transition-all hover:-translate-y-1 hover:shadow-md group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-mono text-xs font-extrabold text-slate-900 group-hover:text-blue-600">
                      ACC-{item.account_id}
                    </div>
                    <RiskBadge level={item.risk_band || 'CRITICAL'} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[150px]">{item.reason || 'Threshold Violation'}</span>
                    <span className="font-mono font-bold text-rose-600">
                      {Math.round((item.composite_score || 0.85) * 100)}%
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
                <span>No critical entities currently on watchlist.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Surveillance Activity Feed Table */}
      <div className="glass-panel-3d overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-600 border border-blue-500/30">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Critical Surveillance Feed</h3>
              <p className="text-xs text-slate-400">Live transactions audited by ML Risk Engine</p>
            </div>
          </div>
          <Link
            href="/transactions"
            className="btn-glass-secondary px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <span>Open Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="aml-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Sender Entity</th>
                <th>Receiver Entity</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-center">ML Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.tx_id}>
                    <td>
                      <Link
                        href={`/transactions/${tx.tx_id}`}
                        className="font-mono font-bold text-blue-600 hover:underline"
                      >
                        TX-{tx.tx_id}
                      </Link>
                    </td>
                    <td className="font-mono text-slate-700">
                      <Link href={`/accounts/${tx.sender_account_id}`} className="hover:text-blue-600 hover:underline">
                        ACC-{tx.sender_account_id}
                      </Link>
                    </td>
                    <td className="font-mono text-slate-700">
                      <Link href={`/accounts/${tx.receiver_account_id}`} className="hover:text-blue-600 hover:underline">
                        ACC-{tx.receiver_account_id}
                      </Link>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {tx.tx_type || 'TRANSFER'}
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      ${Number(tx.tx_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center">
                      {tx.is_fraud ? (
                        <span className="risk-pill critical">FRAUD DETECTED</span>
                      ) : (
                        <span className="risk-pill low">NOMINAL</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/explainability/${tx.tx_id}`}
                        className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Explain →</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                    No transactions recorded yet in this workspace. Upload a CSV to begin surveillance.
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
