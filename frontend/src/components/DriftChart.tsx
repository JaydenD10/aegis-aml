'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DriftChart({ history, data }: { history?: any[]; data?: any }) {
  const rawHistory = history || data?.history || []
  
  if (!rawHistory || rawHistory.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center font-medium text-xs text-slate-400">
        No historical drift timeline available for this account.
      </div>
    )
  }

  const chartData = rawHistory.map((h: any) => ({ 
    time: h.timestamp ? new Date(h.timestamp * 1000).toLocaleDateString() : 'N/A', 
    score: h.score ?? h.drift_score ?? 0,
  }))

  return (
    <div className="h-[220px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.8)" vertical={false} />
          <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => Number(val).toFixed(2)} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(226, 232, 240, 0.9)', borderRadius: '16px', color: '#0F172A', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.1)' }}
            itemStyle={{ color: '#2563EB', fontWeight: 600 }}
          />
          <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#2563EB' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
