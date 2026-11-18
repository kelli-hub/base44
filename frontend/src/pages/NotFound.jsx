export default function NotFound() {
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--muted)', marginTop: 10 }}>That link went down the wrong aisle.</p>
      <a href="#/" className="btn btn-primary" style={{ marginTop: 22 }}>
        Back home
      </a>
    </div>
  );
}
