// src/pages/Parish25Admin.jsx
// Admin dashboard for Parish 25 enquiries. Login only — no signup form.
// Admin accounts are created manually in the Supabase dashboard (Auth > Users),
// same pattern as the existing Meckury AI / IQ Ads admin pages.
// Route this at e.g. /parish25/admin — keep it out of any public nav.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/parish25.css';

const STATUSES = ['enquiry', 'contacted', 'confirmed', 'executed'];

export default function Parish25Admin() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checkingSession) return null;

  return (
    <div className="p25">
      <div className="p25-nav">
        <span className="p25-wordmark">Parish 25<span>.</span> Admin</span>
        {session && (
          <button className="p25-navlink" style={{ background: 'none', cursor: 'pointer' }}
                  onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        )}
      </div>
      <main className="p25-wrap">
        {session ? <EnquiryDashboard /> : <LoginForm />}
      </main>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Incorrect email or password.');
    setLoading(false);
  }

  return (
    <section style={{ maxWidth: '360px', margin: '3rem auto 0' }}>
      <h1 className="p25-h2">Admin login</h1>
      <div className="p25-card">
        <form onSubmit={handleLogin}>
          <div className="p25-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email}
                   onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="p25-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password}
                   onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="p25-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}

function EnquiryDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from('parish_enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Failed to load enquiries:', error);
    setRows(data ?? []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setSavingId(id);
    const patch = { status };
    if (status === 'executed') patch.completed_at = new Date().toISOString();

    const { error } = await supabase.from('parish_enquiries').update(patch).eq('id', id);
    if (error) {
      console.error('Failed to update status:', error);
    } else {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }
    setSavingId(null);
  }

  const executedCount = rows.filter((r) => r.status === 'executed').length;

  return (
    <section>
      <div className="p25-chain-header">
        <h1 className="p25-h2" style={{ margin: 0 }}>Enquiries</h1>
        <span className="p25-chain-count"><b>{executedCount}</b> of 25 executed</span>
      </div>

      {loading && <p className="p25-lede">Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="p25-lede">No enquiries yet.</p>
      )}

      <div className="p25-card" style={{ padding: '0.5rem 1.5rem' }}>
        {rows.map((r) => (
          <div key={r.id} className="p25-admin-row">
            <div>
              <div className="p25-name">{r.parish_name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                {r.contact_name} · {r.phone}{r.email ? ` · ${r.email}` : ''}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{r.location}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={`p25-status-badge ${r.status}`}>{r.status}</span>
              <select
                value={r.status}
                disabled={savingId === r.id}
                onChange={(e) => updateStatus(r.id, e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--line)' }}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

