'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex p-3 sm:p-5 md:p-6 gap-4 sm:gap-6 relative max-w-[1720px] mx-auto">
      {/* Floating 3D Liquid Glass Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 gap-4 sm:gap-6">
        {/* Floating 3D Liquid Glass Topbar */}
        <Topbar />

        {/* Page Viewport with Smooth Fade In */}
        <main className="flex-1 min-w-0 page-fade-in pb-12">
          {children}
        </main>
      </div>
    </div>
  )
}
