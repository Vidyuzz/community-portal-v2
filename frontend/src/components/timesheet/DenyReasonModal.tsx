import React, { useState } from 'react'
import './DenyReasonModal.scss'
import { X, AlertTriangle } from 'lucide-react'

interface DenyReasonModalProps {
  open: boolean
  employeeName: string
  period: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

const DenyReasonModal: React.FC<DenyReasonModalProps> = ({
  open,
  employeeName,
  period,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) return
    onConfirm(reason.trim())
    setReason('')
    onClose()
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="drm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="drm-modal glass-card-heavy">
        <div className="drm-header">
          <div className="drm-header-icon">
            <AlertTriangle size={18} color="#F87171" />
          </div>
          <span className="drm-title">Deny Timesheet</span>
          <button className="drm-close" onClick={handleClose}><X size={18} /></button>
        </div>

        <div className="drm-body">
          <p className="drm-info">
            You are denying <strong>{employeeName}</strong>&apos;s submission for{' '}
            <strong>{period}</strong>.
          </p>

          <div className="drm-field">
            <label className="drm-label">
              Reason for Denial <span className="drm-required">*</span>
            </label>
            <textarea
              className="drm-textarea"
              placeholder="Provide a clear reason so the employee can correct and resubmit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <span className="drm-char-count">
              {reason.trim().length} / 300
            </span>
          </div>
        </div>

        <div className="drm-footer">
          <button className="drm-btn drm-btn--cancel" onClick={handleClose}>Cancel</button>
          <button
            className="drm-btn drm-btn--deny"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Confirm Denial
          </button>
        </div>
      </div>
    </div>
  )
}

export default DenyReasonModal
