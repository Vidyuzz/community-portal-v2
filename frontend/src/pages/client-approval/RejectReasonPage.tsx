import React, { Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Public page (no auth) the client manager lands on from the Reject link in
 * the timesheet email. Collects a reason, then hands off to the existing
 * /api/client-approval endpoint, which already accepts a `note`.
 */
function RejectReasonContent() {
  const [params] = useSearchParams()
  const token    = params.get('token') ?? ''
  const [note, setNote]         = useState('')
  const [submitting, setSubmit] = useState(false)

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

  const submit = () => {
    if (!note.trim() || submitting) return
    setSubmit(true)
    window.location.href =
      `${apiBase}/client-approval?token=${encodeURIComponent(token)}` +
      `&action=reject&note=${encodeURIComponent(note.trim())}`
  }

  if (!token) {
    return (
      <Shell borderColor="rgba(248,113,113,0.3)">
        <h1 style={h1}>Invalid link</h1>
        <p style={body}>This rejection link is missing its token. Please use the link from the original email.</p>
      </Shell>
    )
  }

  return (
    <Shell borderColor="rgba(248,113,113,0.3)">
      <h1 style={h1}>Reject Timesheet</h1>
      <p style={{ ...body, marginBottom: 24 }}>
        Please tell us why you are rejecting this timesheet. Your reason is sent to the
        employee so they can correct and resubmit.
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        autoFocus
        placeholder="e.g. Hours on 14 Aug don't match our records"
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(248,113,113,0.35)',
          borderRadius: 10,
          padding: '12px 14px',
          color: 'white',
          fontSize: 14,
          fontFamily: 'inherit',
          resize: 'vertical',
          marginBottom: 20,
          boxSizing: 'border-box',
        }}
      />

      <button
        type="button"
        onClick={submit}
        disabled={!note.trim() || submitting}
        style={{
          background: note.trim() ? '#dc2626' : 'rgba(255,255,255,0.12)',
          color: note.trim() ? 'white' : 'rgba(255,255,255,0.4)',
          border: 'none',
          borderRadius: 10,
          padding: '12px 32px',
          fontSize: 14,
          fontWeight: 600,
          cursor: note.trim() && !submitting ? 'pointer' : 'not-allowed',
          width: '100%',
        }}
      >
        {submitting ? 'Sending…' : 'Reject and send reason'}
      </button>
    </Shell>
  )
}

const h1: React.CSSProperties = {
  color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 12px',
}
const body: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0,
}

function Shell({ children, borderColor }: { children: React.ReactNode; borderColor: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #02001E 0%, #0C0E16 100%)',
      padding: '24px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <img src="/assets/GSRlogo.png" alt="GSR" style={{ width: 72, marginBottom: 24 }} />
        {children}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 24 }}>
          © 2026 GSR Group · Internal Use Only
        </p>
      </div>
    </div>
  )
}

export default function RejectReasonPage() {
  return (
    <Suspense fallback={null}>
      <RejectReasonContent />
    </Suspense>
  )
}
