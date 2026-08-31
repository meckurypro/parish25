// src/pages/Parish25Home.jsx
// Public landing page for the Parish 25 Initiative.
// Route this at e.g. /parish25 in your router.
//
// CHANGED: "Parishes Visited" now pulls in the IQ Academy media
// (photos/videos) linked to each executed parish via
// parish_enquiries.academy_training_id -> academy_trainings.id
// -> academy_media.training_id. The admin links a parish to a training
// in Parish25Admin; nothing is re-uploaded here, we just read what
// IQ Academy already has.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/parish25.css';

const TOTAL_SLOTS = 25;

// ── One media item (image or video) inside a parish's strip ──────
// Same play/pause pattern IQ Academy's GalleryPage already uses:
// videos sit paused on their poster frame until tapped.
function ParishMediaItem({ media }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    setPlaying(true);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  }

  return (
    <div className="p25-media-item">
      {media.media_type === 'video' ? (
        <>
          <video
            ref={videoRef}
            src={media.url}
            poster={media.poster_url || undefined}
            preload="metadata"
            playsInline
            controls={playing}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {!playing && (
            <button className="p25-play-btn" onClick={handlePlay} aria-label="Play video">
              <span className="p25-play-btn-inner">
                <svg width="16" height="18" viewBox="0 0 20 22" fill="none">
                  <path d="M2 2.5C2 1.06 3.57 0.17 4.82 0.9L18.4 8.9C19.62 9.62 19.62 11.38 18.4 12.1L4.82 20.1C3.57 20.83 2 19.94 2 18.5V2.5Z" fill="white" />
                </svg>
              </span>
            </button>
          )}
        </>
      ) : (
        <img
          src={media.url}
          alt={media.caption || ''}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  );
}

// ── Horizontal swipeable strip of a parish's linked media ────────
function ParishMediaStrip({ media }) {
  if (!media || media.length === 0) return null;
  return (
    <div className="p25-parish-media-track">
      {media.map((m) => (
        <ParishMediaItem key={m.id} media={m} />
      ))}
    </div>
  );
}

export default function Parish25Home() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadCompleted() {
      // Public read: only rows with status = 'executed' are ever fetched here.
      // RLS should restrict SELECT on parish_enquiries to this filtered view
      // (or expose it via a public `parish25_completed` view instead of the raw table).
      //
      // The embed follows academy_training_id -> academy_trainings, then
      // -> academy_media. Both FK names are given explicitly because
      // academy_trainings has more than one relationship to academy_media
      // (training_id AND thumbnail_media_id), so PostgREST needs to be told
      // which path to walk — same reason IQ Academy's GalleryPage does it.
      const { data, error } = await supabase
        .from('parish_enquiries')
        .select(`
          parish_name,
          completed_at,
          academy_training_id,
          academy_trainings!parish_enquiries_academy_training_id_fkey (
            id,
            title,
            academy_media!academy_media_training_id_fkey (
              id, media_type, url, poster_url, caption, sort_order
            )
          )
        `)
        .eq('status', 'executed')
        .order('completed_at', { ascending: true });

      if (!active) return;
      if (error) {
        console.error('Failed to load completed parishes:', error);
        setCompleted([]);
      } else {
        // Sort each parish's media by sort_order client-side (simpler than
        // a nested foreignTable order across a two-level embed).
        const withSortedMedia = (data ?? []).map((p) => ({
          ...p,
          media: [...(p.academy_trainings?.academy_media ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order
          ),
        }));
        setCompleted(withSortedMedia);
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

        <section className="p25-chain-section">
          <div className="p25-chain-header">
            <h2 className="p25-h2" style={{ margin: 0 }}>Parish25 Progress</h2>
            <span className="p25-chain-count">
              <b>{loading ? '…' : doneCount}</b> of {TOTAL_SLOTS}
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
          <h2 className="p25-h2">Parishes Visited</h2>
          {!loading && completed.length === 0 && (
            <p className="p25-lede" style={{ marginBottom: 0 }}>Nothing here yet — check back soon.</p>
          )}
          <ul className="p25-list">
            {completed.map((p) => (
              <li key={p.parish_name} style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <span className="p25-dot" />
                  <span className="p25-name">{p.parish_name}</span>
                </div>
                {p.media.length > 0 && (
                  <>
                    <ParishMediaStrip media={p.media} />
                    {p.media.length > 1 && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: '0.4rem 0 0' }}>
                        Swipe to see more · {p.media.length} files
                      </p>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {skills.length > 0 && (
          <section style={{ margin: '2.5rem 0' }}>
            <h2 className="p25-h2">Modules</h2>
            <p className="p25-lede" style={{ marginBottom: '1.25rem' }}>
              Each cohort covers one module, not all {skills.length}. Swipe to see them.
            </p>
            <div className="p25-skills-track">
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
