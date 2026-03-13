import { useState, useEffect } from 'react';
import api from '../api';

export default function Targets() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', base_url: '', auth_type: 'none', description: '', token: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchTargets = () => {
    setLoading(true);
    api.get('/targets').then(data => { setTargets(data); setLoading(false); });
  };
  useEffect(() => { fetchTargets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = { name: form.name, base_url: form.base_url, auth_type: form.auth_type, description: form.description, auth_config: {} };
      if (form.token) body.auth_config = { token: form.token, header: 'Authorization' };
      await api.post('/targets', body);
      setMsg('Target saved!');
      setShowForm(false);
      setForm({ name: '', base_url: '', auth_type: 'none', description: '', token: '' });
      fetchTargets();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this target?')) return;
    await api.del(`/targets/${id}`);
    fetchTargets();
  };

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>🎯 Targets</h1>
          <p>Manage your API targets and authentication credentials</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Target'}
        </button>
      </div>

      {msg && <div className="alert success">{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="two-col">
              <div className="form-group">
                <label>Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Production API" required />
              </div>
              <div className="form-group">
                <label>Base URL *</label>
                <input type="url" value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.example.com" required />
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label>Auth Type</label>
                <select value={form.auth_type} onChange={e => setForm({ ...form, auth_type: e.target.value })}>
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>
              {form.auth_type !== 'none' && (
                <div className="form-group">
                  <label>{form.auth_type === 'bearer' ? 'Bearer Token' : 'API Key'}</label>
                  <input type="password" value={form.token} onChange={e => setForm({ ...form, token: e.target.value })} placeholder="••••••••••••••••" />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this target" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Target'}</button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : targets.length === 0 ? (
          <div className="empty">
            <div className="icon">🎯</div>
            <h3>No targets yet</h3>
            <p>Add a target to save auth credentials for repeated scans</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Name</th>
                <th>Base URL</th>
                <th>Auth</th>
                <th>Description</th>
                <th>Added</th>
                <th></th>
              </tr></thead>
              <tbody>
                {targets.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td className="mono">{t.base_url}</td>
                    <td><span className="badge info">{t.auth_type}</span></td>
                    <td className="text-muted">{t.description || '—'}</td>
                    <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
