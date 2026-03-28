import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { clsx } from 'clsx'

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useAppStore()

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-50 max-w-md">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onClose={() => removeNotification(notification.id)} />
      ))}
    </div>
  )
}

const NotificationItem: React.FC<{
  notification: any
  onClose: () => void
}> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.autoClose !== false) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification.autoClose, onClose])

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
  }

  const icons = {
    success: <CheckCircle2 className="text-emerald-600" size={20} />,
    error: <XCircle className="text-rose-600" size={20} />,
    warning: <AlertCircle className="text-amber-600" size={20} />,
    info: <Info className="text-sky-600" size={20} />,
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-in slide-in-from-right-full duration-300',
        styles[notification.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[notification.type]}</div>
      <div className="flex-1 text-sm">{notification.message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  )
}
