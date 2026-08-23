'use client'

import { Shield, Users, Sliders, Lock } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"

export default function AdminPage() {
  const thresholds = [
    { label: 'Critical Risk Threshold (Composite)', value: 0.80, color: '#DC2626', textColor: '#DC2626' },
    { label: 'High Risk Threshold (Composite)',     value: 0.50, color: '#EA580C', textColor: '#EA580C' },
    { label: 'Medium Risk Threshold (Composite)',   value: 0.25, color: '#D97706', textColor: '#D97706' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Administration"
        subtitle="Manage users, roles, and global risk engine thresholds."
      />

      <div className="grid md:grid-cols-2 gap-5">
        {/* User Management */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">User Management</span>
          </div>

          <div className="rounded-2xl p-4 space-y-2 bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">analyst@aegisaml.corp</div>
                <div className="text-[11px] font-medium text-slate-400">Compliance Analyst · Level 3</div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            User management is governed by enterprise SSO/IdP
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-200">
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Global Risk Thresholds</span>
          </div>

          {thresholds.map((t) => (
            <div key={t.label} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">{t.label}</span>
                <span className="font-mono font-bold" style={{ color: t.textColor }}>{t.value.toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60">
                <div className="h-full rounded-full" style={{ width: `${t.value * 100}%`, background: t.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-200">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">System Architecture & Engines</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'ML Engine', value: 'XGBoost + IsolationForest' },
            { label: 'Drift Detectors', value: 'PH, CUSUM, KS, Z-Score' },
            { label: 'Explainability', value: 'SHAP TreeExplainer' },
            { label: 'Database', value: 'PostgreSQL 15' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl p-3.5 bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">{label}</div>
              <div className="text-xs font-semibold text-slate-900">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
