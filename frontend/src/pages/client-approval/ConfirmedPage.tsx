import React, { Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'

function ConfirmedContent() {
  const [params] = useSearchParams()
  const action   = params.get('action')
  const client   = params.get('client') ?? 'the client'
  const approved = action === 'approve'

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
        border: `1px solid ${approved ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <img src="/assets/GSRlogo.png" alt="GSR" style={{ width: 72, marginBottom: 24 }} />

        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: approved ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 36,
        }}>
          {approved ? '✅' : '❌'}
        </div>

        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
          {approved ? 'Timesheet Approved' : 'Timesheet Rejected'}
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
          {approved
            ? `Thank you! You have approved the timesheet for ${decodeURIComponent(client)}. The employee has been notified.`
            : `You have rejected the timesheet for ${decodeURIComponent(client)}. The employee has been notified and will resubmit.`
          }
        </p>

        <button
          type="button"
          onClick={() => window.close()}
          style={{
            background: approved ? '#16a34a' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close this window
        </button>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 24 }}>
          © 2026 GSR Group · Internal Use Only
        </p>
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmedContent />
    </Suspense>
  )
}
