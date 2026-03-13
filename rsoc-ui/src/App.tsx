import { useState } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import NewScan from './pages/NewScan';
import Scans from './pages/Scans';
import Findings from './pages/Findings';
import Targets from './pages/Targets';
import Manual from './pages/Manual';

type Page = 'dashboard' | 'new-scan' | 'scans' | 'findings' | 'targets' | 'manual';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'new-scan',  label: 'New Scan',  icon: '🚀' },
  { id: 'scans',     label: 'Scan History', icon: '📋' },
  { id: 'findings',  label: 'Findings',  icon: '⚠️' },
  { id: 'targets',   label: 'Targets',   icon: '🎯' },
  { id: 'manual',    label: 'User Manual', icon: '📘' },
] as const;

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'new-scan':  return <NewScan />;
      case 'scans':     return <Scans />;
      case 'findings':  return <Findings />;
      case 'targets':   return <Targets />;
      case 'manual':    return <Manual />;
    }
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div>
            <span>RSOC</span>
            <span className="sub">API Scanner</span>
          </div>
        </div>

        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id as Page)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--accent2)' }}>RSOC v1.0</div>
            <div>OWASP API Top 10</div>
            <div>Security Scanner</div>
          </div>
        </div>
      </nav>

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}
