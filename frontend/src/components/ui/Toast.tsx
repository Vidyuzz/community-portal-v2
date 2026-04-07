import React, { useEffect } from 'react'
import './Toast.scss'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={17} />,
  error:   <XCircle    size={17} />,
  info:    <Info       size={17} />,
  warning: <AlertTriangle size={17} />,
}

const ToastMessage: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3800)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div className={`toast toast--${toast.type}`}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>
        <X size={13} />
      </button>
    </div>
  )
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <ToastMessage key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default ToastContainer
