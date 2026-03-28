import React from 'react'
import { MainLayout } from './components/MainLayout'
import { WorkflowView } from './views/WorkflowView'
import { useAppStore } from './store/useAppStore'
import { NotificationContainer } from './components/NotificationContainer'
import { Layout } from 'lucide-react'

const ComingSoonView: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in-95 duration-500">
    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
      <Layout size={40} className="text-gray-300" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">{name} Module</h3>
    <p className="text-gray-500 max-w-sm">This feature is currently under active development. Our engineers are working hard to bring this to you soon!</p>
    <div className="mt-8 flex space-x-2">
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
    </div>
  </div>
)

function App() {
  const { activeTab } = useAppStore()

  const renderView = () => {
    switch (activeTab) {
      case 'workflow':
        return <WorkflowView />
      case 'dashboard':
        return <ComingSoonView name="Dashboard Analytics" />
      case 'settings':
        return <ComingSoonView name="Platform Settings" />
      default:
        return <WorkflowView />
    }
  }

  return (
    <MainLayout>
      {renderView()}
      <NotificationContainer />
    </MainLayout>
  )
}

export default App
