import { useState, useEffect, useRef } from 'react';
import api from '../api';

const STAGES = [
  { id: 'queued',    label: 'Queued',              icon: '⏳', desc: 'Scan is in queue and about to start...' },
  { id: 'running',   label: 'Scanning',             icon: '🔍', desc: 'Actively scanning endpoints for vulnerabilities...' },
  { id: 'completed', label: 'Scan Complete',         icon: '✅', desc: 'Scan finished successfully.' },
  { id: 'failed',    label: 'Scan Failed',           icon: '❌', desc: 'Scan encountered an error.' },
];

function ScanProgress({ scanId, onDone }: { scanId: string; onDone: (scan: any) => void }) {
  const [scan, setScan] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Poll
    const poll = async () => {
      try {
        const data = await api.get(`/scans/${scanId}`);
        setScan(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          onDone(data);
        }
      } catch {}
    };

    poll();
    intervalRef.current = setInterval(poll, 2500);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, [scanId]);

  const currentStage = STAGES.find(s => s.id === scan?.status) || STAGES[0];
  const stageIndex = STAGES.findIndex(s => s.id === scan?.status);
  const isRunning = scan?.status === 'running' || scan?.status === 'queued';
  const summary = scan?.summary || {};

  return (
    <div className="card fadeIn" style={{ marginTop: 24, padding: 30 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{currentStage.icon}</div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: 6 }}>{currentStage.label}</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{currentStage.desc}</p>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>⏱ {elapsed}s elapsed</div>
      </div>

      {/* Stage Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {STAGES.slice(0, 3).map((stage, i) => {
          const done = stageIndex > i || scan?.status === 'completed';
          const active = stageIndex === i;
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
                background: done ? 'var(--accent)' : active ? 'rgba(99,102,241,0.3)' : 'var(--surface3)',
                border: `2px solid ${done || active ? 'var(--accent)' : 'var(--border)'}`,
                color: done ? '#fff' : active ? 'var(--accent)' : 'var(--muted)',
                transition: 'all 0.4s ease',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {i < 2 && (
                <div style={{
                  width: 60, height: 2,
                  background: done ? 'var(--accent)' : 'var(--border)',
                  transition: 'background 0.4s ease',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Live Findings Counter */}
      {scan?.status !== 'queued' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Critical', count: summary.critical || 0, color: 'var(--critical)' },
            { label: 'High',     count: summary.high || 0,     color: 'var(--high)' },
            { label: 'Medium',   count: summary.medium || 0,   color: 'var(--medium)' },
            { label: 'Low',      count: summary.low || 0,      color: 'var(--low)' },
            { label: 'Total',    count: summary.total || 0,    color: 'var(--accent2)' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              background: 'var(--surface3)', borderRadius: 10, padding: '10px 18px',
              textAlign: 'center', border: '1px solid var(--border)', minWidth: 70,
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Animated pulse bar for running state */}
      {isRunning && (
        <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: '40%',
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            animation: 'shimmer 1.5s infinite',
            borderRadius: 2,
          }} />
        </div>
      )}

      {scan?.error_message && (
        <div className="alert error" style={{ marginTop: 16 }}>{scan.error_message}</div>
      )}
    </div>
  );
}

export default function NewScan() {
  const [targetUrl, setTargetUrl] = useState('');
  const [scanType, setScanType] = useState('url');
  const [specContent, setSpecContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [completedScan, setCompletedScan] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) { setError('Target URL is required'); return; }
    setError(''); setCompletedScan(null); setActiveScanId(null); setLoading(true);
    try {
      const body: any = { target_url: targetUrl, scan_type: scanType };
      if (specContent.trim()) body.spec_content = specContent;
      const res = await api.post('/scans', body);
      setActiveScanId(res.id);
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
              {completedScan && (
                <div className="alert success">
                  ✅ Scan finished! Found <strong>{completedScan.summary?.total ?? 0}</strong> vulnerabilities.{' '}
                  <strong>{completedScan.summary?.critical ?? 0}</strong> Critical,{' '}
                  <strong>{completedScan.summary?.high ?? 0}</strong> High.
                </div>
              )}

              <div className="form-group">
                <label>Target URL *</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  disabled={!!activeScanId && !completedScan}
                />
              </div>

              <div className="form-group">
                <label>Scan Type</label>
                <select value={scanType} onChange={e => setScanType(e.target.value)} disabled={!!activeScanId && !completedScan}>
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
                    disabled={!!activeScanId && !completedScan}
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (!!activeScanId && !completedScan)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? '⏳ Starting...' : activeScanId && !completedScan ? '🔍 Scan Running...' : '🔍 Launch Scan'}
              </button>
            </form>
          </div>

          {/* Live progress tracker */}
          {activeScanId && !completedScan && (
            <ScanProgress
              scanId={activeScanId}
              onDone={(scan) => {
                setCompletedScan(scan);
                setActiveScanId(null);
              }}
            />
          )}
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
              { icon: '🛡️', label: 'WAF / IPS / IDS', desc: 'Detects active defense systems' },
              { icon: '🗂️', label: 'Mass Assignment', desc: 'Privilege escalation via JSON fields' },
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
              ['API6', 'Mass Assignment', 'var(--low)'],
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
