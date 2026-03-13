import { useState, useEffect } from 'react';
import api from '../api';

const SEVERITY_ORDER = ['critical','high','medium','low','info'];

function FindingDetail({ finding, onClose }: { finding: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Finding Detail</h2>
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <span className={`badge ${finding.severity}`}>{finding.severity}</span>
          {finding.owasp_ref && <span className="badge info">{finding.owasp_ref}</span>}
          {finding.cvss_score && <span className="badge medium">CVSS {finding.cvss_score}</span>}
        </div>
        <h3 style={{ marginBottom: 10 }}>{finding.title}</h3>
        <div className="text-muted mono" style={{ marginBottom: 16 }}>
          {finding.method} {finding.endpoint}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="card-title">Description</div>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>{finding.description}</p>
        </div>
        {finding.remediation && (
          <div style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ color: 'var(--low)' }}>✅ Remediation</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#86efac' }}>{finding.remediation}</p>
          </div>
        )}
        {finding.request_raw && (
          <div style={{ marginBottom: 12 }}>
            <div className="card-title">Request</div>
            <pre>{finding.request_raw}</pre>
          </div>
        )}
        {finding.response_raw && (
          <div>
            <div className="card-title">Response</div>
            <pre>{finding.response_raw}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Findings() {
  const [findings, setFindings] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get('/scans?limit=50').then(setScans);
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/findings?limit=200';
    if (selectedScan) url += `&scan_id=${selectedScan}`;
    if (selectedSeverity) url += `&severity=${selectedSeverity}`;
    api.get(url).then(data => { setFindings(data); setLoading(false); });
  }, [selectedScan, selectedSeverity]);

  const filteredFindings = findings.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.title && f.title.toLowerCase().includes(q)) ||
      (f.category && f.category.toLowerCase().includes(q)) ||
      (f.endpoint && f.endpoint.toLowerCase().includes(q))
    );
  });

  const counts = SEVERITY_ORDER.reduce((acc, s) => {
    acc[s] = filteredFindings.filter((f: any) => f.severity === s).length;
    return acc;
  }, {} as Record<string, number>);

  const handleExportCSV = () => {
    if (filteredFindings.length === 0) return;
    
    // Create CSV headers
    const headers = ['Severity', 'Category', 'Title', 'Method', 'Endpoint', 'CVSS', 'Date'];
    const csvRows = [headers.join(',')];
    
    // Create CSV rows
    for (const f of filteredFindings) {
      const row = [
        f.severity,
        `"${f.category || ''}"`,
        `"${(f.title || '').replace(/"/g, '""')}"`,
        f.method,
        `"${f.endpoint || ''}"`,
        f.cvss_score || '',
        f.created_at || ''
      ];
      csvRows.push(row.join(','));
    }
    
    // Trigger download trigger
    const csvContent = csvRows.join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rsoc_findings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚠️ Findings</h1>
        <p>All vulnerabilities discovered across your scans</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {SEVERITY_ORDER.map(s => (
          <div key={s} className={`stat-card ${s}`} style={{ cursor: 'pointer', outline: selectedSeverity === s ? '2px solid var(--accent)' : 'none' }} onClick={() => setSelectedSeverity(selectedSeverity === s ? '' : s)}>
            <div className="label">{s}</div>
            <div className="value">{counts[s]}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center gap-2" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', flex: 1 }}>
            <input 
              type="text" 
              placeholder="🔍 Search findings..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input"
              style={{ padding: '8px 12px', fontSize: 13, minWidth: 200 }}
            />
            <select value={selectedScan} onChange={e => setSelectedScan(e.target.value)} style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}>
              <option value="">All Scans</option>
              {scans.map((s: any) => (
                <option key={s.id} value={s.id}>{s.target_url.slice(0, 40)} ({s.status})</option>
              ))}
            </select>
            <select value={selectedSeverity} onChange={e => setSelectedSeverity(e.target.value)} style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}>
              <option value="">All Severities</option>
              {SEVERITY_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline" style={{ padding: '8px 12px', fontSize: 13 }} onClick={handleExportCSV}>
               ⬇️ Export CSV
            </button>
          </div>
          <div className="text-muted">{filteredFindings.length} findings</div>
        </div>

        {loading ? <div className="spinner" /> : filteredFindings.length === 0 ? (
          <div className="empty"><div className="icon">✅</div><h3>No findings</h3><p>Run a scan to detect vulnerabilities</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Severity</th>
                <th>Title</th>
                <th>Category</th>
                <th>Endpoint</th>
                <th>OWASP</th>
                <th>CVSS</th>
              </tr></thead>
              <tbody>
                {filteredFindings.map((f: any) => (
                  <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(f)}>
                    <td><span className={`badge ${f.severity}`}>{f.severity}</span></td>
                    <td style={{ fontWeight: 500, maxWidth: 200 }}>{f.title}</td>
                    <td className="text-muted">{f.category}</td>
                    <td className="mono" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--muted)', marginRight: 4 }}>{f.method}</span>{f.endpoint.slice(0, 40)}
                    </td>
                    <td className="text-muted">{f.owasp_ref || '—'}</td>
                    <td style={{ fontWeight: 700, color: f.cvss_score > 8 ? 'var(--critical)' : f.cvss_score > 6 ? 'var(--high)' : 'var(--medium)' }}>
                      {f.cvss_score ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <FindingDetail finding={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
