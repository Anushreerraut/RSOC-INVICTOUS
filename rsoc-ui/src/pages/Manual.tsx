import React from 'react';

export default function Manual() {
  return (
    <div className="page-container fadeIn">
      <header className="page-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: 10,  background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>User Manual</h2>
          <p className="subtitle" style={{ fontSize: '1.1rem' }}>Your guide to mastering the RSOC Automated API Security Scanner</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
        
        {/* Section 1 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'row', gap: 30, padding: 30, alignItems: 'center', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 15, color: 'var(--accent)' }}>1. Security Dashboard</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 15 }}>
              The <strong>Dashboard</strong> provides a high-level overview of your API security posture. It instantly highlights critical vulnerabilities and tracks your recent scanning activity.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              <li><strong>Total Scans:</strong> Track your organization's testing frequency.</li>
              <li><strong>Critical & High Vulnerabilities:</strong> Immediate issues requiring your attention.</li>
            </ul>
          </div>
          <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <img src="/img/dashboard.png" alt="Dashboard Illustration" style={{ width: '100%', display: 'block', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        </div>

        {/* Section 2 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'row-reverse', gap: 30, padding: 30, alignItems: 'center', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 15, color: '#ff9800' }}>2. Launching Scans</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 15 }}>
              Navigate to <strong>New Scan</strong> to initiate an automated test. The scanner uses intelligent fuzzing to locate vulnerabilities.
            </p>
             <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              <li><strong>Target URL:</strong> Enter the base URL of your API.</li>
              <li><strong>OpenAPI Spec:</strong> Provide a Swagger JSON/YAML file for comprehensive coverage.</li>
              <li><strong>Authentication:</strong> Add Bearer tokens or API keys to scan protected endpoints seamlessly.</li>
            </ul>
          </div>
          <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <img src="/img/scan.png" alt="Scan Illustration" style={{ width: '100%', display: 'block', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        </div>

        {/* Section 3 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'row', gap: 30, padding: 30, alignItems: 'center', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 15, color: '#f44336' }}>3. Analyzing Findings</h3>
            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 15 }}>
              The <strong>Findings</strong> page presents detailed, actionable intelligence on every detected vulnerability, categorized by severity.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              <li><strong>Details & Remediation:</strong> Clear steps to patch the vulnerability.</li>
              <li><strong>Evidence:</strong> View the exact raw HTTP Request and Response causing the issue.</li>
              <li><strong>Active Defenses:</strong> Detects if WAFs or Intrusion Prevention Systems (IPS) are active.</li>
            </ul>
          </div>
          <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <img src="/img/findings.png" alt="Findings Illustration" style={{ width: '100%', display: 'block', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        </div>

      </div>
    </div>
  );
}
