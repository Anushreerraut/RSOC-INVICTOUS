import { useState } from 'react';
import api from '../api';

export default function NewScan() {
  const [targetUrl, setTargetUrl] = useState('');
  const [scanType, setScanType] = useState('url');
  const [specContent, setSpecContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) { setError('Target URL is required'); return; }
    setError(''); setResult(null); setLoading(true);
    try {
      const body: any = { target_url: targetUrl, scan_type: scanType };
      if (specContent.trim()) body.spec_content = specContent;
      const res = await api.post('/scans', body);
      setResult(res);
    } catch {
      setError('Failed to start scan. Check backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🚀 New Scan</h1>
        <p>Launch an automated security scan against an API target</p>
      </div>

      <div className="two-col">
        <div>
          <div className="card">
            <form onSubmit={handleSubmit}>
              {error && <div className="alert error">{error}</div>}
              {result && (
                <div className="alert success">
                  ✅ Scan started! ID: <strong style={{ fontFamily: 'monospace' }}>{result.id?.slice(0, 8)}...</strong> — Status: <strong>{result.status}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Target URL *</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>

              <div className="form-group">
                <label>Scan Type</label>
                <select value={scanType} onChange={e => setScanType(e.target.value)}>
                  <option value="url">URL / Endpoint Discovery</option>
                  <option value="openapi">OpenAPI / Swagger Spec</option>
                  <option value="postman">Postman Collection</option>
                  <option value="graphql">GraphQL</option>
                </select>
              </div>

              {scanType === 'openapi' && (
                <div className="form-group">
                  <label>OpenAPI Spec (YAML or JSON)</label>
                  <textarea
                    rows={10}
                    value={specContent}
                    onChange={e => setSpecContent(e.target.value)}
                    placeholder={'openapi: 3.0.0\ninfo:\n  title: My API\npaths:\n  /users:\n    get: ...'}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? '⏳ Starting Scan...' : '🔍 Launch Scan'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">What Gets Tested</div>
            {[
              { icon: '🔐', label: 'Authentication', desc: 'Missing auth, JWT weaknesses' },
              { icon: '💉', label: 'Injection', desc: 'SQLi, SSRF, Path Traversal' },
              { icon: '⏱️', label: 'Rate Limiting', desc: 'Missing limits, header bypass' },
              { icon: '🕵️', label: 'Data Exposure', desc: 'PII, secrets, stack traces' },
              { icon: '⚙️', label: 'Misconfiguration', desc: 'CORS, security headers, methods' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</div>
                  <div className="text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">OWASP API Top 10 Coverage</div>
            {[
              ['API1', 'Broken Object Auth', 'var(--low)'],
              ['API2', 'Broken Authentication', 'var(--low)'],
              ['API4', 'Rate Limiting', 'var(--low)'],
              ['API7', 'SSRF', 'var(--low)'],
              ['API8', 'Security Misconfiguration', 'var(--low)'],
            ].map(([id, name, color]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="text-sm">{id}: {name}</span>
                <span style={{ fontSize: 11, color, fontWeight: 700 }}>✓ Covered</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
