'use client'

import Link from "next/link"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-[#F4F7FB] relative overflow-hidden">
      {/* Ambient Orbs */}
      <div className="fixed -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-blue-400/12 via-cyan-300/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="fixed -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-bl from-indigo-400/10 via-purple-300/10 to-transparent blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-md w-full p-8 rounded-3xl backdrop-blur-2xl bg-white/80 border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="text-7xl font-black font-mono mb-2 text-blue-600/30">404</div>
        <h1 className="text-2xl font-extrabold mb-2 text-slate-900">Page Not Found</h1>
        <p className="text-xs sm:text-sm max-w-sm mb-6 font-medium text-slate-500">
          This route does not exist in the AegisAML Risk Intelligence System.
        </p>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/transactions"
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            Transactions
          </Link>
        </div>
      </div>
    </div>
  )
}
