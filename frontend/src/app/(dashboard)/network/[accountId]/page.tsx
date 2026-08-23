'use client'

import React, { useState, useEffect } from "react"
import NetworkGraph from "@/components/NetworkGraph"
import { ArrowLeft, Network, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"

export default function NetworkAnalysisPage({ params }: { params: any }) {
  const routeParams = useParams()
  const { authFetch } = useAuth()
  const accountId = (routeParams?.accountId as string) || params?.accountId
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) return
    authFetch(`http://127.0.0.1:8000/api/network/${accountId}`)
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
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Constructing 2-Hop Network Graph...
          </span>
        </div>
      </div>
    )
  }

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="space-y-4 p-8 text-center rounded-3xl bg-white/75 border border-white/80 max-w-md mx-auto shadow-sm">
        <div className="text-sm font-bold text-rose-600">No network data found for account ACC-{accountId}.</div>
        <Link href="/network" className="text-xs font-bold text-blue-600 hover:underline">
          ← Back to Network Analysis
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/network" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Network Analysis
        </Link>
        <span className="text-slate-400">›</span>
        <span className="text-xs font-bold font-mono text-slate-700">ACC-{accountId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 border border-white/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-mono text-slate-900">ACC-{accountId}</h1>
            <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <Network className="w-3.5 h-3.5" />
              <span>{data.nodes?.length ?? 0} Nodes · {data.edges?.length ?? 0} Edges</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">2-Hop Transaction Network Subgraph · Force Directed Centrality</p>
        </div>

        <Link
          href={`/accounts/${accountId}`}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          View Account Profile →
        </Link>
      </div>

      {/* Graph Canvas Card */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/85 border border-white/90 shadow-[0_15px_35px_-5px_rgba(15,23,42,0.05)] h-[620px]">
        <NetworkGraph
          initialNodes={data.nodes}
          initialEdges={data.edges}
          centralAccountId={accountId}
        />
      </div>
    </div>
  )
}
