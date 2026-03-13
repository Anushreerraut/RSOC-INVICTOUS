import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'bot'; text: string };

const KNOWLEDGE: Record<string, string> = {
  // Greetings
  'hello': 'Hi there! 👋 I\'m RSOC Assistant, your API security guide. Ask me anything about vulnerabilities, how to use RSOC, or what a finding means!',
  'hi': 'Hey! 👋 Need help understanding a vulnerability or how to use RSOC? I\'m here!',
  'help': 'I can help you with:\n• Understanding vulnerabilities (SQLi, SSRF, Mass Assignment…)\n• How to run a scan\n• What OWASP API Top 10 means\n• How to fix findings\n\nJust ask!',

  // Features
  'scan': 'To run a scan:\n1. Go to **New Scan** in the sidebar\n2. Enter your API\'s base URL\n3. Optionally paste an OpenAPI spec for deeper coverage\n4. Click **Launch Scan** and watch real-time results appear!',
  'export': 'On the **Findings** page, click **⬇️ Export CSV** to download all current findings as a spreadsheet. Filters apply — so you can export just Critical findings if you want!',
  'delete': 'In **Scan History**, click the **🗑️ Delete All** button to clear your history. Individual scans also have a Delete button per row.',
  'history': 'The **Scan History** page shows all past scans with status, risk score, and C/H/M/L finding counts. Click **↻ Refresh** to update live.',
  'filter': 'On the Findings page you can:\n• Search by keyword (title, endpoint, category)\n• Filter by Severity using the dropdown\n• Filter by a specific Scan\n\nAll filters stack together!',
  'dashboard': 'The Dashboard shows your overall security posture:\n• Total scans and findings\n• Critical/High counts\n• Bar chart of findings per scan\n• Severity distribution pie chart\n• Recent scans table',
  'target': 'The **Targets** page lets you save an API URL + auth headers so you don\'t have to re-enter them every time you run a new scan.',
  'manual': 'The **User Manual** page has a complete guide to every section of RSOC with visual walkthroughs.',

  // Vulnerabilities
  'sql': 'SQL Injection (SQLi) is when an attacker inserts malicious SQL code into an API parameter to manipulate the database.\n\n**Fix:** Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.',
  'sqli': 'SQL Injection (SQLi) is when an attacker inserts malicious SQL code into an API parameter to manipulate the database.\n\n**Fix:** Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.',
  'injection': 'Injection attacks occur when untrusted data is sent to an interpreter (SQL, shell, LDAP). RSOC checks for SQLi, SSRF, and Path Traversal automatically.',
  'ssrf': 'Server-Side Request Forgery (SSRF) tricks your server into making HTTP requests to internal systems.\n\n**Fix:** Validate and whitelist all URLs your server fetches. Block access to `169.254.x.x` and `127.x.x.x`.',
  'path traversal': 'Path Traversal allows attackers to access files outside the intended directory using `../../../etc/passwd`.\n\n**Fix:** Sanitize file paths, use `realpath()`, and never expose raw file path inputs.',
  'auth': 'Broken Authentication means your API endpoints are accessible without a valid token or with weak credentials.\n\n**Fix:** Require a valid Bearer token on every protected route. Use JWT with short expiry and rotation.',
  'authentication': 'Broken Authentication means your API endpoints are accessible without a valid token or with weak credentials.\n\n**Fix:** Require a valid Bearer token on every protected route. Use JWT with short expiry and rotation.',
  'rate limit': 'Missing rate limiting allows attackers to brute-force logins or spam endpoints.\n\n**Fix:** Add rate limiting middleware (e.g., `slowapi` in Python or `express-rate-limit` in Node.js).',
  'rate limiting': 'Missing rate limiting allows attackers to brute-force logins or spam endpoints.\n\n**Fix:** Add rate limiting middleware (e.g., `slowapi` in Python or `express-rate-limit` in Node.js).',
  'mass assignment': 'Mass Assignment (OWASP API6) happens when an API binds all client-supplied JSON fields to a database model, including ones like `is_admin: true`.\n\n**Fix:** Use allowlists (DTOs/schemas) to only accept expected fields.',
  'data exposure': 'Data Exposure occurs when APIs return more data than needed — like passwords, tokens, or PII in responses.\n\n**Fix:** Filter all API responses to return only the necessary fields. Never send raw DB objects.',
  'misconfiguration': 'Misconfigurations include open CORS, missing security headers, and dangerous HTTP methods left enabled.\n\n**Fix:** Set `Content-Security-Policy`, `X-Frame-Options`, restrict CORS origins, and disable TRACE/DELETE where not needed.',
  'cors': 'CORS misconfiguration (`Access-Control-Allow-Origin: *`) allows any website to make requests to your API.\n\n**Fix:** Restrict to specific trusted origins only.',
  'waf': 'WAF (Web Application Firewall), IPS, and IDS are defense systems that block malicious traffic. RSOC\'s WAF Detector checks if your API is protected by systems like Cloudflare or AWS WAF.',
  'firewall': 'RSOC\'s WAF/Firewall Detector probes your API with known malicious payloads and checks if the response is blocked (403/406), indicating active defense.',
  'cvss': 'CVSS (Common Vulnerability Scoring System) is a 0–10 score for vulnerability severity:\n• 9–10 = Critical\n• 7–8.9 = High\n• 4–6.9 = Medium\n• 0–3.9 = Low',
  'owasp': 'OWASP API Top 10 is the industry standard list of the most critical API security risks:\nAPI1: Broken Object Auth\nAPI2: Broken Authentication\nAPI4: Rate Limiting\nAPI6: Mass Assignment\nAPI7: SSRF\nAPI8: Misconfiguration',
  'bola': 'BOLA (Broken Object Level Authorization) = OWASP API1. It means a user can access another user\'s resources by changing an ID in the URL (e.g., `/users/123` → `/users/456`).\n\n**Fix:** Verify object ownership on every request.',
};

function getReply(input: string): string {
  const q = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(KNOWLEDGE)) {
    if (q.includes(key)) return val;
  }
  return `I'm not sure about that one! Try asking about:\n• A specific vulnerability (SQLi, SSRF, Mass Assignment, BOLA)\n• How to use a feature (scan, export, filter, delete)\n• OWASP or CVSS scores`;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: 'Hi! 👋 I\'m RSOC Assistant. Ask me anything about API security or how to use this tool!' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'bot', text: getReply(text) }]);
      setTyping(false);
    }, 600);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          border: 'none', cursor: 'pointer', fontSize: 24,
          boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title="RSOC Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 998,
          width: 360, height: 500,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))',
            borderRadius: '16px 16px 0 0',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>RSOC Assistant</div>
              <div style={{ fontSize: 11, color: 'var(--low)' }}>● Online — Knowledge Base Mode</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--bg3)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  border: m.role === 'bot' ? '1px solid var(--border)' : 'none',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: 'var(--accent2)',
                    animation: 'pulse 1s infinite', animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about SQLi, CORS, scanning..."
              style={{ flex: 1, padding: '9px 13px', borderRadius: 10, fontSize: 13 }}
            />
            <button
              onClick={send}
              style={{
                padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff',
                fontWeight: 700, fontSize: 16, transition: 'transform 0.15s',
              }}
            >➤</button>
          </div>

          {/* Quick Suggestions */}
          <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['SQLi', 'Mass Assignment', 'How to scan', 'Export CSV'].map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--muted)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent2)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
