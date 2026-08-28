// src/pages/Parish25Home.jsx
// Public landing page for the Parish 25 Initiative.
// Route this at e.g. /parish25 in your router.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/parish25.css';

const TOTAL_SLOTS = 25;

export default function Parish25Home() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCompleted() {
      // Public read: only rows with status = 'executed' are ever fetched here.
      // RLS should restrict SELECT on parish_enquiries to this filtered view
      // (or expose it via a public `parish25_completed` view instead of the raw table).
      const { data, error } = await supabase
        .from('parish_enquiries')
        .select('parish_name, completed_at')
        .eq('status', 'executed')
        .order('completed_at', { ascending: true });

      if (!active) return;
      if (error) {
        console.error('Failed to load completed parishes:', error);
        setCompleted([]);
      } else {
        setCompleted(data ?? []);
      }
      setLoading(false);
    }

    loadCompleted();
    return () => { active = false; };
  }, []);

  const doneCount = completed.length;
  const beads = Array.from({ length: TOTAL_SLOTS }, (_, i) => i < doneCount);

  return (
    <div className="p25">
      <div className="p25-nav">
        <a className="p25-wordmark" href="/parish25">Parish 25<span>.</span></a>
        <nav><a className="p25-navlink" href="/parish25/request">Request a visit</a></nav>
      </div>

      <main className="p25-wrap">
        <section>
          <p className="p25-eyebrow">A PromptIQ movement</p>
          <h1 className="p25-title">AI literacy, carried <em>parish by parish.</em></h1>
          <p className="p25-lede">
            We're visiting 25 Catholic parishes across Lagos to teach practical AI
            skills — in person, taught by the same team each time. Every bead below
            is a parish. Filled means the work there is done.
          </p>
        </section>

        <section className="p25-chain-section">
          <div className="p25-chain-header">
            <h2 className="p25-h2" style={{ margin: 0 }}>The chain</h2>
            <span className="p25-chain-count">
              <b>{loading ? '…' : doneCount}</b> of {TOTAL_SLOTS} complete
            </span>
          </div>

          <div className="p25-card">
            <div className="p25-chain" aria-label={`Progress: ${doneCount} of ${TOTAL_SLOTS} parishes completed`}>
              {beads.map((done, i) => (
                <span key={i} className={`p25-bead${done ? ' done' : ''}`} title={done ? 'Completed' : undefined} />
              ))}
            </div>
            <p className="p25-chain-note">
              Parishes appear here once their workshop series is fully complete —
              not when a visit is first proposed.
            </p>
          </div>
        </section>

        <section>
          <h2 className="p25-h2">Completed</h2>
          <ul className="p25-list">
            {!loading && completed.length === 0 && (
              <li><span className="p25-name" style={{ color: 'var(--ink-soft)' }}>Nothing here yet — check back soon.</span></li>
            )}
            {completed.map((p) => (
              <li key={p.parish_name}>
                <span className="p25-dot" />
                <span className="p25-name">{p.parish_name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginTop: '2.5rem' }}>
          <h2 className="p25-h2">Is your parish next?</h2>
          <p className="p25-lede" style={{ marginBottom: '1.25rem' }}>
            Tell us about your parish and we'll follow up to arrange a visit.
          </p>
          <a className="p25-btn" href="/parish25/request">Request a visit</a>
        </section>

        <footer className="p25-footer">
          <span>Parish 25 Initiative — a PromptIQ movement</span>
          <a href="https://academy.promptiq.com.ng" target="_blank" rel="noopener noreferrer">More on IQ Academy →</a>
        </footer>
      </main>
    </div>
  );
}

