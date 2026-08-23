'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Sparkles,
  Layers,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/auth'

export default function UploadPage() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [datasetType, setDatasetType] = useState<'transactions' | 'accounts'>('transactions')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<string>('')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid .CSV spreadsheet file.')
      setFile(null)
      return
    }
    setError('')
    setResult(null)
    setFile(selectedFile)
  }

  const handleExecutePipeline = async () => {
    if (!file) {
      setError('Please upload or drag & drop a CSV file first.')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)
    setCurrentStep('Parsing CSV & Validating Schema...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dataset_type', datasetType)

      setTimeout(() => setCurrentStep('Executing Feature Engineering & ML Pipeline...'), 600)
      setTimeout(() => setCurrentStep('Computing Behavioral Drift & Graph Topology...'), 1200)

      const res = await authFetch('http://127.0.0.1:8000/api/upload/pipeline', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Upload pipeline execution failed.')
      }

      const data = await res.json()
      setResult(data)
      setCurrentStep('Completed successfully!')
    } catch (err: any) {
      setError(err.message || 'Error executing upload pipeline.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Multi-Tenant Data Ingestion Pipeline"
        subtitle="Ingest transaction and KYC data into your isolated PostgreSQL workspace with automated ML feature engineering, drift calculation, and SHAP explainability."
      />

      {/* Main 3D Liquid Glass Dropzone Card */}
      <div className="glass-panel-3d p-6 sm:p-8 space-y-6">
        {/* Step 1: Select Type */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Dataset Format</span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Select Ingestion Entity Type</h3>
          </div>
          <div className="flex gap-2 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setDatasetType('transactions')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datasetType === 'transactions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Transactions Surveillance
            </button>
            <button
              type="button"
              onClick={() => setDatasetType('accounts')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datasetType === 'accounts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Account Entities / KYC
            </button>
          </div>
        </div>

        {/* 3D Liquid Glass Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-3xl p-8 sm:p-12 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01] dropzone-glow'
              : file
              ? 'border-emerald-500/60 bg-emerald-50/20'
              : 'border-slate-300/80 hover:border-blue-400 bg-white/40 hover:bg-white/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto bg-emerald-100 text-emerald-600 border border-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.25)]">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · Ready to ingest into workspace
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-600 hover:underline">
                Click or drop another file to replace
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-900">
                  Drop your CSV dataset here, or <span className="text-blue-600 underline">browse</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports standard AML surveillance CSV schemas with multi-tenant PostgreSQL persistence.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500">
            {uploading ? (
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{currentStep}</span>
              </div>
            ) : file ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready to run ML pipeline on {file.name}</span>
              </div>
            ) : (
              <span>Select or drop a CSV file to execute the ingestion pipeline</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleExecutePipeline}
            disabled={!file || uploading}
            className="btn-glass-primary px-7 py-3 text-xs w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <span>Run Ingestion Pipeline</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ingestion Results Card */}
        {result && (
          <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-4 shadow-sm page-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Pipeline Execution Successful</span>
              </div>
              <Link
                href="/dashboard"
                className="btn-glass-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200/80 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Transactions</div>
                <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                  {result.transactions_imported || 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200/80 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Accounts Created</div>
                <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                  {result.accounts_imported || 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200/80 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Alerts Flagged</div>
                <div className="text-lg font-black font-mono text-rose-600 mt-0.5">
                  {result.alerts_generated || 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200/80 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">SHAP Explanations</div>
                <div className="text-lg font-black font-mono text-blue-600 mt-0.5">
                  {result.explanations_generated || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schema Reference Panel */}
      <div className="glass-panel-3d p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-xs">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Expected CSV Schema Reference</span>
        </div>
        <p className="text-xs text-slate-500">
          Your CSV file must include columns: <code className="font-mono font-bold text-slate-800">tx_id</code>, <code className="font-mono font-bold text-slate-800">sender_account_id</code>, <code className="font-mono font-bold text-slate-800">receiver_account_id</code>, <code className="font-mono font-bold text-slate-800">tx_type</code>, <code className="font-mono font-bold text-slate-800">tx_amount</code>, <code className="font-mono font-bold text-slate-800">timestamp</code>, and optionally <code className="font-mono font-bold text-slate-800">is_fraud</code>.
        </p>
      </div>
    </div>
  )
}
