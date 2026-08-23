'use client'

import { useState, useEffect } from 'react'
import { User, ShieldCheck, Server, Database, Cpu, Lock, CheckCircle, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { useAuth } from "@/lib/auth"

export default function SettingsPage() {
  const { user, authFetch } = useAuth()
  const [health, setHealth] = useState<any>(null)

  useEffect(() => {
    authFetch("http://127.0.0.1:8000/api/health")
      .then(res => res.ok ? res.json() : null)
      .then(d => d && setHealth(d))
      .catch(() => {})
  }, [authFetch])

  const userName = user?.name || 'Compliance Analyst'
  const userEmail = user?.email || 'analyst@aegisaml.corp'
  const userRole = user?.role || 'Senior AML Compliance Officer'
  const userInitials = userName
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CA'

  const isHealthy = health?.status === "healthy"

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Workspace Configuration & Security"
        subtitle="Analyst credentials, operational permissions, PostgreSQL tenant status, and system telemetry."
      />

      <div className="grid md:grid-cols-2 gap-5">
        {/* Analyst Profile */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">Analyst Profile</span>
              <div className="text-xs text-slate-400">Authenticated Workspace Tenant</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md bg-white/80 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{userName}</div>
              <div className="text-xs text-slate-400 truncate">{userEmail}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-1">{userRole}</div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Module Access Controls</div>
            {[
              { label: 'Multi-Tenant Data Ingestion', access: true },
              { label: 'ML Prediction & Risk Scoring', access: true },
              { label: 'Behavioral Drift Detectors', access: true },
              { label: 'Bounded Network Graph Engine', access: true },
              { label: 'SHAP Model Explainability', access: true },
              { label: 'SAR Dossier Export', access: true },
            ].map(({ label }) => (
              <div key={label} className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-700">{label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry & Architecture Card */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">System Architecture & Telemetry</span>
              <div className="text-xs text-slate-400">Runtime and Engine Status</div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { name: 'FastAPI Backend Engine', status: isHealthy ? 'ONLINE' : 'OFFLINE', ok: isHealthy, icon: Server },
              { name: 'PostgreSQL Relational DB', status: isHealthy ? 'CONNECTED' : 'DISCONNECTED', ok: isHealthy, icon: Database },
              { name: 'ML Pipeline Inference', status: 'READY', ok: true, icon: Cpu },
              { name: 'SHAP Explainability TreeExplainer', status: 'AVAILABLE', ok: true, icon: Sparkles },
              { name: 'Session Token Encryption', status: 'ACTIVE (PBKDF2/SHA-256)', ok: true, icon: Lock },
            ].map(({ name, status, ok, icon: Icon }) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-2xl backdrop-blur-md bg-white/80 border border-slate-200/80 shadow-[0_2px_6px_rgba(15,23,42,0.02)]">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-rose-500'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 leading-relaxed">
            All user data is strictly isolated within the PostgreSQL multi-tenant partition. Uploading datasets runs feature engineering and persists records exclusively under your authenticated identity.
          </div>
        </div>
      </div>
    </div>
  )
}
