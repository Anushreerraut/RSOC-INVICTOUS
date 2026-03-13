import { useState, useEffect } from 'react';
import api from '../api';

export default function Scans() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = () => {
    setLoading(true);
    api.get('/scans?limit=50').then(data => { setScans(data); setLoading(false); });
  };

  useEffect(() => { fetchScans(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scan and all its findings?')) return;
    await api.del(`/scans/${id}`);
    fetchScans();
  };

  const riskScore = (summary: any) => {
    if (!summary) return 0;
    return Math.min(100, (summary.critical || 0) * 20 + (summary.high || 0) * 10 + (summary.medium || 0) * 5 + (summary.low || 0) * 2);
  };

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>📋 Scan History</h1>
          <p>All past and running scans</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchScans}>↻ Refresh</button>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : scans.length === 0 ? (
          <div className="empty">
            <div className="icon">🔍</div>
            <h3>No scans yet</h3>
            <p>Go to New Scan to start your first API security scan</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Target URL</th>
                <th>Type</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Findings</th>
                <th>C/H/M/L</th>
                <th>Duration</th>
                <th></th>
              </tr></thead>
              <tbody>
                {scans.map((s: any) => {
                  const score = riskScore(s.summary);
                  const color = score >= 70 ? 'var(--critical)' : score >= 40 ? 'var(--high)' : score >= 20 ? 'var(--medium)' : 'var(--low)';
                  const dur = s.started_at && s.completed_at
                    ? Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 1000) + 's'
                    : '—';
                  return (
                    <tr key={s.id}>
                      <td className="mono">{s.target_url.slice(0, 45)}{s.target_url.length > 45 ? '…' : ''}</td>
                      <td><span className="badge info">{s.scan_type}</span></td>
                      <td><span className={`status ${s.status}`}>{s.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: 'var(--bg3)', borderRadius: 3 }}>
                            <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ color, fontSize: 12, fontWeight: 700 }}>{score}</span>
                        </div>
                      </td>
                      <td><strong>{s.summary?.total ?? 0}</strong></td>
                      <td>
                        <span style={{ color: 'var(--critical)', fontWeight: 700 }}>{s.summary?.critical ?? 0}</span>
                        <span style={{ color: 'var(--muted)' }}>/</span>
                        <span style={{ color: 'var(--high)', fontWeight: 700 }}>{s.summary?.high ?? 0}</span>
                        <span style={{ color: 'var(--muted)' }}>/</span>
                        <span style={{ color: 'var(--medium)', fontWeight: 700 }}>{s.summary?.medium ?? 0}</span>
                        <span style={{ color: 'var(--muted)' }}>/</span>
                        <span style={{ color: 'var(--low)', fontWeight: 700 }}>{s.summary?.low ?? 0}</span>
                      </td>
                      <td className="text-muted">{dur}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleDelete(s.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
