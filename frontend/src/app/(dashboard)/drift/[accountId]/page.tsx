'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ActivitySquare, AlertTriangle, TrendingUp, Loader2 } from "lucide-react"
import DriftChart from "@/components/DriftChart"
import { useAuth } from "@/lib/auth"

export default function DriftAnalysisPage({ params }: { params: any }) {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const accountId = (routeParams?.accountId as string) || params?.accountId
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) return
    authFetch(`/api/drift/${accountId}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [accountId, authFetch])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Computing Behavioral Drift Detectors...
          </span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4 p-8 text-center rounded-3xl bg-white/75 border border-white/80 max-w-md mx-auto shadow-sm">
        <div className="text-sm font-bold text-rose-600">Failed to load drift analysis for account ACC-{accountId}.</div>
        <Link href="/drift" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to Behavioral Drift
        </Link>
      </div>
    )
  }

  const { current_drift, detectors } = data
  const isDrifting = (current_drift ?? 0) > 0.4

  const detectorList = Array.isArray(detectors)
    ? detectors
    : detectors && typeof detectors === 'object'
    ? Object.entries(detectors).map(([name, val]: [string, any]) => ({
        detector: name.replace('_', ' ').toUpperCase(),
        alerting: typeof val === 'boolean' ? val : Boolean(val?.change_detected || val?.drift_detected),
        score: typeof val === 'number' ? val : typeof val === 'object' ? val?.score : null,
      }))
    : []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/drift" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Behavioral Drift
        </Link>
        <span className="text-slate-400">›</span>
        <span className="text-xs font-bold font-mono text-slate-700">ACC-{accountId}</span>
      </div>

      {/* Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-mono text-slate-900">ACC-{accountId}</h1>
            {isDrifting ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                DRIFT ANOMALY FLAGGED
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                BEHAVIOR NOMINAL / STABLE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Multi-Detector Statistical Shift Monitor</p>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Composite Drift Score</div>
          <div className={`text-3xl font-black font-mono ${isDrifting ? 'text-orange-600' : 'text-emerald-600'}`}>
            {current_drift != null ? Number(current_drift).toFixed(4) : '–'}
          </div>
        </div>
      </div>

      {/* Detector Badges Grid */}
      {detectorList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {detectorList.map((d: any) => {
            const alerting = d.alerting
            return (
              <div
                key={d.detector}
                className={`rounded-3xl p-5 backdrop-blur-2xl transition-all ${
                  alerting 
                    ? 'bg-orange-50/90 border border-orange-200 shadow-[0_4px_16px_rgba(249,115,22,0.12)]'
                    : 'bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{d.detector}</span>
                  {alerting ? (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className={`text-xs font-bold ${alerting ? 'text-orange-700' : 'text-emerald-700'}`}>
                  {alerting ? 'DRIFT ALERT' : 'Normal'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline Chart Card */}
      <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center gap-2.5">
          <ActivitySquare className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">Transaction Velocity & Drift Score Timeline</span>
        </div>
        <div className="h-64 w-full pt-2">
          <DriftChart data={data} />
        </div>
      </div>
    </div>
  )
}
