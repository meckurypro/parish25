// src/pages/Parish25Home.jsx
// Public landing page for the Parish 25 Initiative.
// Route this at e.g. /parish25 in your router.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/parish25.css';

const TOTAL_SLOTS = 25;

export default function Parish25Home() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const trackRef = useRef(null);
  const pausedRef = useRef(false);

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

    async function loadSkills() {
      const { data, error } = await supabase
        .from('parish25_skills')
        .select('id, title, description')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (!active) return;
      if (error) console.error('Failed to load skills:', error);
      setSkills(data ?? []);
    }

    loadCompleted();
    loadSkills();
    return () => { active = false; };
  }, []);

  // Gentle continuous auto-scroll on the skills strip — pauses while the
  // user is actively touching/dragging it, resumes shortly after they let go.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || skills.length === 0) return;

    const id = setInterval(() => {
      if (pausedRef.current) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: 1, behavior: 'auto' });
      }
    }, 30);

    return () => clearInterval(id);
  }, [skills]);

  function pause() {
    pausedRef.current = true;
  }
  function resumeSoon() {
    setTimeout(() => { pausedRef.current = false; }, 2500);
  }

  const doneCount = completed.length;
  const beads = Array.from({ length: TOTAL_SLOTS }, (_, i) => i < doneCount);

  return (
    <div className="p25">
      <div className="p25-nav">
        <a className="p25-wordmark" href="/">Parish 25<span>.</span></a>
        <nav><a className="p25-navlink" href="/request">Request a visit</a></nav>
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

        {skills.length > 0 && (
          <section style={{ margin: '2.5rem 0' }}>
            <h2 className="p25-h2">What you'll learn</h2>
            <div
              className="p25-skills-track"
              ref={trackRef}
              onTouchStart={pause}
              onTouchEnd={resumeSoon}
              onMouseDown={pause}
              onMouseUp={resumeSoon}
            >
              {skills.map((s, i) => (
                <div className="p25-skill-card" key={s.id}>
                  <div className="p25-skill-index">{String(i + 1).padStart(2, '0')}</div>
                  <div className="p25-skill-title">{s.title}</div>
                  <p className="p25-skill-desc">{s.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

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
              Earned, not pledged.
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
          <a className="p25-btn" href="/request">Request a visit</a>
        </section>

        <footer className="p25-footer">
          <span>Parish 25 Initiative — a PromptIQ movement</span>
          <span style={{ display: 'flex', gap: '1rem' }}>
            <a href="https://academy.promptiq.com.ng" target="_blank" rel="noopener noreferrer">More on IQ Academy →</a>
            {/* Deliberately unstyled/low-emphasis — internal link, not meant to invite clicks */}
            <a href="/admin" style={{ color: 'var(--ink-soft)', opacity: 0.6, textDecoration: 'none' }}>Staff</a>
          </span>
        </footer>
      </main>
    </div>
  );
}
