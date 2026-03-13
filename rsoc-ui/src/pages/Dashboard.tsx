import { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#64748b' };

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);

  useEffect(() => {
    api.get('/stats').then(setStats);
    api.get('/scans?limit=8').then(setScans);
    api.get('/findings?limit=10').then(setFindings);
  }, []);

  const isBlank = stats && stats.total_scans === 0;

  const pieData = stats ? [
    { name: 'Critical', value: stats.critical, color: COLORS.critical },
    { name: 'High', value: stats.high, color: COLORS.high },
    { name: 'Medium', value: stats.total - stats.critical - stats.high, color: COLORS.medium },
  ].filter(d => d.value > 0) : [];

  const barData = (scans || []).slice(0, 6).map((s: any) => ({
    name: s.target_url.replace(/https?:\/\//, '').slice(0, 20),
    findings: s.summary?.total || 0,
    critical: s.summary?.critical || 0,
  })).reverse();

  return (
    <div className="page">
      <div className="page-header">
        <h1>🛡️ Security Dashboard</h1>
        <p>Overview of your API security posture</p>
      </div>

      {isBlank ? (
        <div className="card fadeIn" style={{ textAlign: 'center', padding: '60px 40px', marginTop: 20 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🚀</div>
          <h2 style={{ fontSize: '2rem', marginBottom: 12, background: 'linear-gradient(90deg, #6366f1, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            No Scans Yet!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 480, margin: '0 auto 30px' }}>
            Your dashboard is empty because you have no scan history. Run your first API security scan to start detecting vulnerabilities.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '20px 24px', maxWidth: 200, textAlign: 'left' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>1️⃣</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Start a Scan</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Go to New Scan and enter your API URL.</div>
            </div>
            <div className="card" style={{ padding: '20px 24px', maxWidth: 200, textAlign: 'left' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>2️⃣</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Review Results</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>View detailed findings with remediations.</div>
            </div>
            <div className="card" style={{ padding: '20px 24px', maxWidth: 200, textAlign: 'left' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>3️⃣</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Export Report</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Download a CSV for reporting.</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="label">Total Scans</div>
              <div className="value">{stats?.total_scans ?? '—'}</div>
              <div className="glow-bar" style={{ background: 'linear-gradient(90deg,#6366f1,transparent)' }} />
            </div>
            <div className="stat-card total">
              <div className="label">Total Findings</div>
              <div className="value">{stats?.total_findings ?? '—'}</div>
              <div className="glow-bar" style={{ background: 'linear-gradient(90deg,#818cf8,transparent)' }} />
            </div>
            <div className="stat-card critical">
              <div className="label">Critical</div>
              <div className="value">{stats?.critical ?? '—'}</div>
              <div className="glow-bar" style={{ background: 'linear-gradient(90deg,#ef4444,transparent)' }} />
            </div>
            <div className="stat-card high">
              <div className="label">High</div>
              <div className="value">{stats?.high ?? '—'}</div>
              <div className="glow-bar" style={{ background: 'linear-gradient(90deg,#f97316,transparent)' }} />
            </div>
            <div className="stat-card low">
              <div className="label">Completed Scans</div>
              <div className="value">{stats?.completed_scans ?? '—'}</div>
              <div className="glow-bar" style={{ background: 'linear-gradient(90deg,#22c55e,transparent)' }} />
            </div>
          </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Findings Per Scan</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#8b9bb4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b9bb4', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid rgba(99,120,200,0.18)', borderRadius: 8, color: '#e8ecf4' }}
              />
              <Bar dataKey="findings" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="critical" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Severity Distribution</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(99,120,200,0.18)', borderRadius: 8, color: '#e8ecf4' }} />
                <Legend formatter={(v) => <span style={{ color: '#8b9bb4', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ padding: '40px 20px' }}>
              <div className="icon">📊</div>
              <p>Run a scan to see severity distribution</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-1">
          <div className="card-title" style={{ marginBottom: 0 }}>Recent Scans</div>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          {scans.length === 0 ? (
            <div className="empty"><div className="icon">🔍</div><h3>No scans yet</h3><p>Go to New Scan to get started</p></div>
          ) : (
            <table>
              <thead><tr>
                <th>Target URL</th>
                <th>Status</th>
                <th>Findings</th>
                <th>Critical</th>
                <th>Started</th>
              </tr></thead>
              <tbody>
                {scans.map((s: any) => (
                  <tr key={s.id}>
                    <td className="mono">{s.target_url.slice(0, 50)}</td>
                    <td><span className={`status ${s.status}`}>{s.status}</span></td>
                    <td><strong>{s.summary?.total ?? 0}</strong></td>
                    <td style={{ color: 'var(--critical)', fontWeight: 700 }}>{s.summary?.critical ?? 0}</td>
                    <td className="text-muted">{s.started_at ? new Date(s.started_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
