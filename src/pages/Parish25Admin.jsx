// src/pages/Parish25Admin.jsx
// Admin dashboard for Parish 25 enquiries. Login only — no signup form.
// Admin accounts are created manually in the Supabase dashboard (Auth > Users),
// same pattern as the existing Meckury AI / IQ Ads admin pages.
// Route this at /admin. Linked subtly from the homepage footer as "Staff".

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/parish25.css';

const STATUSES = ['enquiry', 'contacted', 'confirmed', 'executed'];
const TABS = ['all', ...STATUSES];

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
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <a className="p25-navlink" href="/">← Site</a>
          {session && (
            <button className="p25-navlink" style={{ background: 'none', cursor: 'pointer' }}
                    onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          )}
        </div>
      </div>
      <main className="p25-wrap">
        {session ? <AdminHome /> : <LoginForm />}
      </main>
    </div>
  );
}

function AdminHome() {
  const [section, setSection] = useState('enquiries');

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['enquiries', 'skills'].map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              fontFamily: 'var(--body)', fontSize: '0.9rem', fontWeight: 500, padding: '0.6rem 1.1rem',
              borderRadius: '100px', cursor: 'pointer',
              border: section === s ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: section === s ? 'var(--ink)' : 'transparent',
              color: section === s ? '#fff' : 'var(--ink-soft)',
            }}
          >
            {s === 'enquiries' ? 'Enquiries' : 'Skills'}
          </button>
        ))}
      </div>
      {section === 'enquiries' ? <EnquiryDashboard /> : <SkillsManager />}
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

const emptyDraft = {
  parish_name: '', location: '', contact_name: '', phone: '', email: '', message: '', status: 'enquiry',
};

function EnquiryDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

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

  function handleDraftChange(e) {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);

    const payload = { ...draft };
    if (payload.status === 'executed') payload.completed_at = new Date().toISOString();

    // Manual entries (parishes reached in person, not via the public form)
    // insert the same way — requires the authenticated-insert policy in
    // supabase_migration.sql alongside the existing anon-insert policy.
    const { data, error } = await supabase.from('parish_enquiries').insert(payload).select().single();

    if (error) {
      console.error('Failed to add record:', error);
      setAddError('Could not save this record — check required fields.');
    } else {
      setRows((rs) => [data, ...rs]);
      setDraft(emptyDraft);
      setShowAddForm(false);
    }
    setAdding(false);
  }

  const counts = useMemo(() => {
    const c = { all: rows.length };
    for (const s of STATUSES) c[s] = rows.filter((r) => r.status === s).length;
    return c;
  }, [rows]);

  const visibleRows = activeTab === 'all' ? rows : rows.filter((r) => r.status === activeTab);

  return (
    <section>
      <div className="p25-chain-header">
        <h1 className="p25-h2" style={{ margin: 0 }}>Enquiries</h1>
        <span className="p25-chain-count"><b>{counts.executed || 0}</b> of 25 executed</span>
      </div>

      {/* -- status tabs -- */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: 'var(--body)', fontSize: '0.85rem', padding: '0.5rem 0.9rem',
              borderRadius: '100px', cursor: 'pointer',
              border: activeTab === tab ? '1px solid var(--accent)' : '1px solid var(--line)',
              background: activeTab === tab ? 'rgba(226,87,31,0.08)' : 'transparent',
              color: activeTab === tab ? 'var(--accent)' : 'var(--ink-soft)',
            }}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] || 0})
          </button>
        ))}
      </div>

      {/* -- add record -- */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          className="p25-btn"
          style={{ width: 'auto', background: showAddForm ? 'var(--bg-2)' : 'var(--accent)', color: showAddForm ? 'var(--ink)' : '#fff' }}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? 'Cancel' : '+ Add parish'}
        </button>
      </div>

      {showAddForm && (
        <div className="p25-card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleAddRecord}>
            <div className="p25-field">
              <label htmlFor="parish_name">Parish name</label>
              <input id="parish_name" name="parish_name" required value={draft.parish_name} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" required value={draft.location} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="contact_name">Contact person</label>
              <input id="contact_name" name="contact_name" required value={draft.contact_name} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" required value={draft.phone} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="email">Email (optional)</label>
              <input id="email" name="email" type="email" value={draft.email} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="message">Notes (optional)</label>
              <textarea id="message" name="message" value={draft.message} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={draft.status} onChange={handleDraftChange}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {addError && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '1rem' }}>{addError}</p>}
            <button type="submit" className="p25-btn" disabled={adding}>
              {adding ? 'Saving…' : 'Save parish'}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="p25-lede">Loading…</p>}

      {!loading && visibleRows.length === 0 && (
        <p className="p25-lede">Nothing in this list yet.</p>
      )}

      <div className="p25-card" style={{ padding: '0.5rem 1.5rem' }}>
        {visibleRows.map((r) => (
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

const emptySkillDraft = { title: '', description: '', sort_order: 0, active: true };

function SkillsManager() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState(emptySkillDraft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    setLoading(true);
    const { data, error } = await supabase
      .from('parish25_skills')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) console.error('Failed to load skills:', error);
    setSkills(data ?? []);
    setLoading(false);
  }

  function handleDraftChange(e) {
    const { name, value, type, checked } = e.target;
    setDraft((d) => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleAddSkill(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...draft, sort_order: Number(draft.sort_order) || 0 };
    const { data, error } = await supabase.from('parish25_skills').insert(payload).select().single();
    if (error) {
      console.error('Failed to add skill:', error);
    } else {
      setSkills((s) => [...s, data].sort((a, b) => a.sort_order - b.sort_order));
      setDraft(emptySkillDraft);
      setShowAddForm(false);
    }
    setSaving(false);
  }

  async function updateSkill(id, patch) {
    const { error } = await supabase.from('parish25_skills').update(patch).eq('id', id);
    if (error) {
      console.error('Failed to update skill:', error);
    } else {
      setSkills((s) => s.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    }
  }

  return (
    <section>
      <div className="p25-chain-header">
        <h1 className="p25-h2" style={{ margin: 0 }}>Skills</h1>
        <span className="p25-chain-count">{skills.filter((s) => s.active).length} live on site</span>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <button
          className="p25-btn"
          style={{ width: 'auto', background: showAddForm ? 'var(--bg-2)' : 'var(--accent)', color: showAddForm ? 'var(--ink)' : '#fff' }}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? 'Cancel' : '+ Add skill'}
        </button>
      </div>

      {showAddForm && (
        <div className="p25-card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleAddSkill}>
            <div className="p25-field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" required value={draft.title} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" required value={draft.description} onChange={handleDraftChange} />
            </div>
            <div className="p25-field">
              <label htmlFor="sort_order">Order (lower shows first)</label>
              <input id="sort_order" name="sort_order" type="number" value={draft.sort_order} onChange={handleDraftChange} />
            </div>
            <button type="submit" className="p25-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save skill'}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="p25-lede">Loading…</p>}

      <div className="p25-card" style={{ padding: '0.5rem 1.5rem' }}>
        {skills.map((s) => (
          <div key={s.id} className="p25-admin-row">
            <div style={{ opacity: s.active ? 1 : 0.5 }}>
              <div className="p25-name">{s.sort_order}. {s.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', maxWidth: '46ch' }}>{s.description}</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              <input type="checkbox" checked={s.active} onChange={(e) => updateSkill(s.id, { active: e.target.checked })} />
              Live
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
