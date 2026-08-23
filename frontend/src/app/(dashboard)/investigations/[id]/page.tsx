'use client'

import React, { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle, AlertTriangle, MessageSquare, Loader2, Save, Sparkles, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"

export default function InvestigationWorkspace({ params }: { params: any }) {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const id = (routeParams?.id as string) || params?.id
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("OPEN")

  useEffect(() => {
    if (!id) return
    authFetch(`/api/investigations/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        setData(d)
        if (d?.notes) setNotes(d.notes)
        if (d?.status) setStatus(d.status)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, authFetch])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setSavedSuccess(false)
    try {
      await authFetch(`/api/investigations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, status })
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Loading Case Dossier...
          </span>
        </div>
      </div>
    )
  }

  if (!data || !data.id) {
    return (
      <div className="p-8 text-center space-y-3 rounded-3xl bg-white/75 border border-white/80 max-w-md mx-auto shadow-sm">
        <div className="text-sm font-bold text-rose-600">Investigation case not found in workspace.</div>
        <Link href="/investigations" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to Investigations
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2">
        <Link 
          href="/investigations" 
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Case Management
        </Link>
        <span className="text-slate-400">›</span>
        <span className="text-xs font-bold font-mono text-slate-700">CASE-{data.id}</span>
      </div>

      {/* Case Header Card */}
      <div className="flex flex-wrap justify-between items-start gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div>
          <h1 className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            CASE-{data.id}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-slate-600">
              Target: <strong className="font-mono text-slate-900 font-bold">{data.target_id}</strong>
            </span>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {data.target_type}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status:</span>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="text-xs font-bold rounded-xl px-3 py-2 outline-none bg-white border border-slate-200 text-slate-900"
            >
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="CLEARED">CLEARED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-5 h-10 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Case</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Case updates and analyst notes persisted successfully to PostgreSQL.</span>
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-12 rounded-2xl p-1 backdrop-blur-xl bg-white/70 border border-white/80 shadow-sm">
          <TabsTrigger value="overview" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 rounded-xl">Overview</TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 rounded-xl">Deep Analysis</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 rounded-xl">Analyst Notes</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-500 rounded-xl">SAR & Audit Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-3">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Intelligence Summary</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This case dossier tracks all evidence, ML risk attributions, behavioral anomalies, and officer notes regarding target entity <strong>{data.target_id}</strong>.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-3">
              <Link 
                href={data.target_type === 'transaction' ? `/transactions/${data.target_id}` : `/accounts/${data.target_id}`}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              >
                Inspect {data.target_type} Profile →
              </Link>
              
              {data.target_type === 'account' && (
                <Link 
                  href={`/network/${data.target_id}`}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                >
                  Visualize Network Graph →
                </Link>
              )}

              {data.target_type === 'account' && (
                <Link 
                  href={`/drift/${data.target_id}`}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200"
                >
                  Analyze Behavioral Drift →
                </Link>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="pt-3">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Linked Analysis Engines</h2>
            <div className="grid md:grid-cols-3 gap-3.5 pt-2">
              <Link
                href={data.target_type === 'transaction' ? `/explainability/${data.target_id}` : `/drift/${data.target_id}`}
                className="p-4.5 rounded-2xl bg-white/90 hover:bg-blue-50/50 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-1 group"
              >
                <div className="text-xs font-bold text-blue-600 group-hover:underline">
                  {data.target_type === 'transaction' ? 'SHAP Feature Attribution' : 'Behavioral Drift History'}
                </div>
                <div className="text-[10px] text-slate-500">Review local anomaly drivers</div>
              </Link>
              <Link
                href={`/network/${data.target_type === 'transaction' ? '0' : data.target_id}`}
                className="p-4.5 rounded-2xl bg-white/90 hover:bg-purple-50/50 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-1 group"
              >
                <div className="text-xs font-bold text-purple-600 group-hover:underline">
                  Transaction Network
                </div>
                <div className="text-[10px] text-slate-500">2-hop neighborhood clustering</div>
              </Link>
              <Link
                href="/audit-log"
                className="p-4.5 rounded-2xl bg-white/90 hover:bg-emerald-50/50 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-1 group"
              >
                <div className="text-xs font-bold text-emerald-600 group-hover:underline">
                  Audit History
                </div>
                <div className="text-[10px] text-slate-500">Immutable compliance trail</div>
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="pt-3">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] space-y-4">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Compliance Officer Notes & Disposition Rationale</h2>
            </div>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Document your evidence analysis, suspicious pattern findings, and regulatory reporting rationale..."
              className="w-full h-72 rounded-2xl p-4 text-xs font-mono outline-none resize-none bg-white/90 border border-slate-200/80 text-slate-900 focus:border-blue-500 shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="pt-3">
          <div className="rounded-3xl p-8 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Suspicious Activity Report (SAR) Filing Ready</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Once marked as ESCALATED or CLOSED, generate exportable PDF compliance summaries or audit logs for regulatory submission.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
