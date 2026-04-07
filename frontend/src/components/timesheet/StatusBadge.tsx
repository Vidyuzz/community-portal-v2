import React from 'react'
import './StatusBadge.scss'

type Status = 'Pending' | 'Approved' | 'Denied'

interface StatusBadgeProps { status: Status }

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`status-badge status-badge--${status.toLowerCase()}`}>{status}</span>
)

export default StatusBadge
