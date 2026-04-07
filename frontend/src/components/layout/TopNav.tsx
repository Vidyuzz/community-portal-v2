import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './TopNav.scss'
import { Search, Bell, ChevronDown, CheckCircle, XCircle, Clock, Lock, User2 } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getNotifications, markRead } from '../../api/notifications'

dayjs.extend(relativeTime)

interface NotifItem {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

interface TopNavProps {
  userName?: string
  userRole?: string
  avatarUrl?: string
}

function notifIcon(type: string) {
  switch (type) {
    case 'approval':       return <CheckCircle size={16} color="#34D399" />
    case 'denial':         return <XCircle size={16} color="#F87171" />
    case 'reminder':       return <Clock size={16} color="#FBB024" />
    case 'lock':           return <Lock size={16} color="#60A5FA" />
    case 'client_approved':return <CheckCircle size={16} color="#34D399" />
    case 'client_rejected':return <XCircle size={16} color="#F87171" />
    default:               return <User2 size={16} color="#a78bfa" />
  }
}

function groupByDate(notifs: NotifItem[]) {
  const today     = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const groups: { label: string; items: NotifItem[] }[] = []
  const buckets: Record<string, NotifItem[]> = { Today: [], Yesterday: [], Earlier: [] }

  for (const n of notifs) {
    const d = dayjs(n.created_at).format('YYYY-MM-DD')
    if (d === today)         buckets.Today.push(n)
    else if (d === yesterday) buckets.Yesterday.push(n)
    else                     buckets.Earlier.push(n)
  }

  for (const label of ['Today', 'Yesterday', 'Earlier']) {
    if (buckets[label].length > 0) groups.push({ label, items: buckets[label] })
  }
  return groups
}

const TopNav: React.FC<TopNavProps> = ({
  userName  = 'Raj Kumar',
  userRole  = 'Employee',
  avatarUrl = '/assets/userProfile.png',
}) => {
  const [searchQuery, setSearchQuery]   = useState('')
  const [panelOpen, setPanelOpen]       = useState(false)
  const [notifs, setNotifs]             = useState<NotifItem[]>([])
  const [unread, setUnread]             = useState(0)
  const panelRef                        = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await getNotifications()
      const items = (data.notifications ?? []).map((n) => ({
        id: n.id,
        title: n.title || n.type,
        message: n.message,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
      }))
      setNotifs(items)
      setUnread(data.unread ?? 0)
    } catch { /* silent */ }
  }, [])

  // Poll on mount + every 30s
  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    setPanelOpen(v => !v)
    if (!panelOpen) fetchNotifs()
  }

  const markAllRead = async () => {
    await markRead()
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
    setUnread(0)
  }

  const markOneRead = async (id: number) => {
    await markRead([id])
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const groups = groupByDate(notifs)

  return (
    <div className="topnav-bar">
      {/* Search */}
      <div className="topnav-search glass-card-sm">
        <Search size={16} className="topnav-search-icon" />
        <input
          type="text"
          placeholder="Search resources, documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="topnav-search-input"
        />
      </div>

      {/* Right cluster */}
      <div className="topnav-right">

        {/* Bell */}
        <div className="topnav-notif-wrap" ref={panelRef}>
          <button className="topnav-notif glass-card-sm" onClick={handleBellClick}>
            <Bell size={18} />
            {unread > 0 && (
              <span className="topnav-notif-badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {/* Dropdown panel */}
          {panelOpen && (
            <div className="topnav-notif-panel glass-card">
              <div className="tnp-header">
                <span className="tnp-title">Notifications</span>
                {unread > 0 && (
                  <button className="tnp-mark-all" onClick={markAllRead}>Mark all read</button>
                )}
              </div>

              <div className="tnp-body">
                {groups.length === 0 ? (
                  <div className="tnp-empty">
                    <Bell size={28} color="rgba(255,255,255,0.15)" />
                    <span>You're all caught up</span>
                  </div>
                ) : groups.map(group => (
                  <div key={group.label}>
                    <div className="tnp-group-label">{group.label}</div>
                    {group.items.map(n => (
                      <div
                        key={n.id}
                        className={`tnp-item${n.is_read ? ' tnp-item--read' : ''}`}
                        onClick={() => !n.is_read && markOneRead(n.id)}
                      >
                        <span className="tnp-item-icon">{notifIcon(n.type)}</span>
                        <div className="tnp-item-body">
                          <span className="tnp-item-title">{n.title}</span>
                          <span className="tnp-item-msg">{n.message}</span>
                        </div>
                        <span className="tnp-item-time">{dayjs(n.created_at).fromNow(true)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <Link to="/portal/profile" style={{ textDecoration: 'none' }}>
          <div className="topnav-user glass-card-sm">
            <img src={avatarUrl} alt="avatar" className="topnav-avatar" />
            <div className="topnav-user-info">
              <span className="topnav-user-name">{userName}</span>
              <span className="topnav-user-role">{userRole}</span>
            </div>
            <ChevronDown size={14} className="topnav-chevron" />
          </div>
        </Link>
      </div>
    </div>
  )
}

export default TopNav
