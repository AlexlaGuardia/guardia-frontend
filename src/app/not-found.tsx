export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#f59e0b' }}>404</h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>Page not found</p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(145deg, #f59e0b, #d97706)',
            borderRadius: '12px',
            color: '#0a0a0a',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
