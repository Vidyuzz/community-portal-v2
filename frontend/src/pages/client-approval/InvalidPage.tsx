export default function InvalidPage() {
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
        border: '1px solid rgba(251,176,36,0.3)',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <img src="/assets/GSRlogo.png" alt="GSR" style={{ width: 72, marginBottom: 24 }} />
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
          Invalid Link
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
          This approval link is invalid or has expired. Please contact the employee to request a new submission.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 32 }}>
          © 2026 GSR Group
        </p>
      </div>
    </div>
  )
}
