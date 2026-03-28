import React from 'react'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#fafbfc]">
        <div className="max-w-6xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
