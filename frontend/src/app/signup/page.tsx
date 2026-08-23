'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  User,
  Mail,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Auth3DScene } from '@/components/auth/Auth3DScene'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all required fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await signup(name, email, password, confirmPassword)
      if (res && !res.success) {
        setError(res.error || 'Registration failed.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Container holding 3D Animation on Left + Liquid Glass Card on Right */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: 3D Interactive AML Forensic Scene */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-4">
          <div className="hidden lg:block space-y-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant Enterprise Isolation</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight">
              Create Your AML Intelligence Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed">
              Every analyst receives an isolated cryptographic partition with private dataset ingestion, custom risk threshold tuning, and audit trail provenance.
            </p>
          </div>

          {/* Interactive 3D Parallax Canvas */}
          <div className="w-full">
            <Auth3DScene />
          </div>
        </div>

        {/* Right Column: 3D Liquid Glass Signup Form */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="glass-panel-3d p-8 sm:p-10 space-y-5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.14)] page-fade-in relative">
            
            {/* Header / Brand */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_6px_24px_rgba(37,99,235,0.4)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  Aegis<span className="text-blue-600">AML</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                  Register Analyst Workspace
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center page-fade-in">
                {error}
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Analyst Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alice Vance"
                    disabled={loading}
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Analyst Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@aegisaml.corp"
                    disabled={loading}
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-glass-primary w-full h-11 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create & Open Partition</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Navigation Link */}
            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              <span>Already have an active partition? </span>
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
