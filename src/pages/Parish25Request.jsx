// src/pages/Parish25Request.jsx
// Request-visit form. Inserts directly into `parish_enquiries` via Supabase
// (anon INSERT policy required — no separate webhook/n8n needed).
// Route this at e.g. /parish25/request in your router.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/parish25.css';

const initialForm = {
  parish_name: '',
  location: '',
  contact_name: '',
  phone: '',
  email: '',
  message: '',
  skill_interest: '',
};

export default function Parish25Request() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    supabase
      .from('parish25_skills')
      .select('id, title')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load skills:', error);
        setSkills(data ?? []);
      });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');

    const { error } = await supabase.from('parish_enquiries').insert({
      ...form,
      status: 'enquiry', // pipeline starts here; admin moves it forward
    });

    if (error) {
      console.error('Failed to submit enquiry:', error);
      setStatus('error');
      return;
    }

    setStatus('success');
    setForm(initialForm);
  }

  if (status === 'success') {
    return (
      <div className="p25">
        <div className="p25-nav">
          <a className="p25-wordmark" href="/">Parish 25<span>.</span></a>
        </div>
        <main className="p25-wrap">
          <section>
            <p className="p25-eyebrow">Request sent</p>
            <h1 className="p25-title">Thank you.</h1>
            <p className="p25-lede">We've received your request and will follow up directly.</p>
            <a className="p25-btn" href="/">Back to progress</a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="p25">
      <div className="p25-nav">
        <a className="p25-wordmark" href="/">Parish 25<span>.</span></a>
        <nav><a className="p25-navlink" href="/">See progress</a></nav>
      </div>

      <main className="p25-wrap">
        <section>
          <p className="p25-eyebrow">Request a visit</p>
          <h1 className="p25-title">Bring the workshop to <em>your parish.</em></h1>
          <p className="p25-lede">
            Tell us about your parish and the best way to reach you. A member of
            the team will follow up to arrange a visit.
          </p>
        </section>

        <div className="p25-card">
          <form onSubmit={handleSubmit}>
            <div className="p25-field">
              <label htmlFor="parish_name">Parish name</label>
              <input id="parish_name" name="parish_name" type="text" required
                     value={form.parish_name} onChange={handleChange} autoComplete="organization" />
            </div>

            <div className="p25-field">
              <label htmlFor="location">Parish location / area</label>
              <input id="location" name="location" type="text" required
                     value={form.location} onChange={handleChange} autoComplete="address-level2" />
            </div>

            <div className="p25-field">
              <label htmlFor="contact_name">Contact person</label>
              <input id="contact_name" name="contact_name" type="text" required
                     value={form.contact_name} onChange={handleChange} autoComplete="name" />
            </div>

            <div className="p25-field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" type="tel" required
                     value={form.phone} onChange={handleChange} autoComplete="tel" />
            </div>

            <div className="p25-field">
              <label htmlFor="email">Email (optional)</label>
              <input id="email" name="email" type="email"
                     value={form.email} onChange={handleChange} autoComplete="email" />
            </div>

            <div className="p25-field">
              <label htmlFor="skill_interest">What are you most interested in?</label>
              <select id="skill_interest" name="skill_interest" value={form.skill_interest} onChange={handleChange}>
                <option value="">Select an area (optional)</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>

            <div className="p25-field">
              <label htmlFor="message">Anything else we should know?</label>
              <textarea id="message" name="message" value={form.message} onChange={handleChange} />
            </div>

            {status === 'error' && (
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Something went wrong sending your request — please try again.
              </p>
            )}

            <button type="submit" className="p25-btn" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send request'}
            </button>
          </form>
        </div>

        <footer className="p25-footer">
          <span>Parish 25 Initiative — a PromptIQ movement</span>
          <a href="/">Back to progress →</a>
        </footer>
      </main>
    </div>
  );
}
