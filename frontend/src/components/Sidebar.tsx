import React from 'react'
import { PenTool, LayoutDashboard, Settings, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore()

  const navItems = [
    { id: 'workflow', label: 'Workflow', icon: PenTool },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
      <div className="p-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Antigravity</h1>
            <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest mt-0.5">Content Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1.5 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id
                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              activeTab === item.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
            )} />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-50 m-4 bg-gray-50/50 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-200 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <User className="text-indigo-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">Jayso</p>
            <p className="text-xs text-gray-500 truncate">Admin Account</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
