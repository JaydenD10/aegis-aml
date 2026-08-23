'use client'

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer, ShieldCheck, Loader2, UserCheck } from "lucide-react"
import { useAuth } from "@/lib/auth"

export default function ReportDetailPage() {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const id = routeParams?.id as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    authFetch(`/api/investigations/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, authFetch])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data || !data.id) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link href="/reports" className="flex items-center text-xs font-bold uppercase tracking-wider hover:underline text-blue-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        <div className="p-6 font-semibold text-rose-600 rounded-2xl bg-rose-50 border border-rose-200">
          Report not found.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 print:p-0 print:m-0 print:max-w-full">
      {/* Non-printed navigation bar */}
      <div className="flex justify-between items-center print:hidden">
        <Link href="/reports" className="flex items-center text-xs font-bold uppercase tracking-wider hover:underline text-blue-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
        >
          <Printer className="w-4 h-4 mr-2 text-white" /> Print / Save as PDF
        </button>
      </div>

      {/* Official Report Document */}
      <div
        className="rounded-3xl p-8 space-y-8 backdrop-blur-2xl bg-white/90 border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)] print:border-none print:shadow-none print:p-4 print:text-black print:bg-white"
      >
        {/* Document Header */}
        <div className="border-b pb-6 flex justify-between items-start border-slate-200 print:border-black">
          <div>
            <div className="flex items-center space-x-2 font-bold text-lg tracking-wider uppercase mb-1 text-blue-600 print:text-black">
              <ShieldCheck className="w-6 h-6" />
              <span>AegisAML Compliance Intelligence</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 print:text-black">
              Suspicious Activity Investigation Report
            </h1>
            <p className="text-xs font-semibold mt-1 text-slate-400 print:text-gray-600">
              CONFIDENTIAL &bull; FOR REGULATORY & INTERNAL COMPLIANCE USE ONLY
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-bold text-slate-900 print:text-black">DOC-REF: SAR-{data.id.toString().padStart(6, '0')}</div>
            <div className="text-xs font-medium text-slate-400 print:text-gray-600">
              Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
            <span
              className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200"
            >
              STATUS: {data.status}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 print:text-black">
            1. Investigation Target Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl text-sm bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-300">
            <div>
              <span className="text-xs font-semibold block text-slate-400 print:text-gray-600">Target Type</span>
              <strong className="uppercase font-mono font-bold text-slate-900 print:text-black">{data.target_type}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold block text-slate-400 print:text-gray-600">Target Identifier</span>
              <strong className="font-mono font-bold text-slate-900 print:text-black">{data.target_id}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold block text-slate-400 print:text-gray-600">Case Created</span>
              <span className="font-medium text-slate-700 print:text-black">
                {data.created_at ? new Date(data.created_at * 1000).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold block text-slate-400 print:text-gray-600">Last Modified</span>
              <span className="font-medium text-slate-700 print:text-black">
                {data.updated_at ? new Date(data.updated_at * 1000).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Analyst Findings */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 print:text-black">
            2. Analyst Assessment & Rationale
          </h2>
          <div className="p-5 rounded-2xl text-sm min-h-28 bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-300">
            {data.notes ? (
              <p className="whitespace-pre-wrap leading-relaxed font-mono text-xs text-slate-800 print:text-black">{data.notes}</p>
            ) : (
              <p className="italic text-slate-400 print:text-gray-600">
                No formal narrative recorded for this dossier. Ongoing investigation.
              </p>
            )}
          </div>
        </div>

        {/* Decision & Disposition */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 print:text-black">
            3. Final Disposition & Regulatory Decision
          </h2>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-300">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-bold text-slate-900 print:text-black">Compliance Officer Sign-off</div>
                <div className="text-xs font-medium text-slate-400 print:text-gray-600">
                  Decision: <strong className="uppercase text-slate-900 print:text-black">{data.decision || data.status}</strong>
                </div>
              </div>
            </div>
            <div className="text-right text-xs font-semibold text-slate-400 print:text-gray-600">
              Audited by AegisAML Engine
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 border-t text-xs font-medium leading-relaxed border-slate-200 text-slate-400 print:border-gray-300 print:text-gray-500">
          This document constitutes an official AML case summary generated by the AegisAML intelligence platform. 
          Use &quot;Print / Save as PDF&quot; to preserve or distribute to designated regulatory compliance authorities.
        </div>
      </div>
    </div>
  )
}
