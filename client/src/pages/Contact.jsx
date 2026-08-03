import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import api from '../api/axios';

// Placeholder contact details — swap these for the real ones once confirmed.
const CONTACT_EMAIL = 'hello@kaytechhub.com';
const CONTACT_PHONE = '+234 800 000 0000';
const CONTACT_LOCATION = 'Port Harcourt, Rivers State, Nigeria';
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT_LOCATION)}&output=embed`;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '', type: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Get In Touch"
        title="Contact"
        description="Questions about courses, mentorship, or space membership? Send us a message."
      />

      <section className="section section--flush-top contact-info">
        <Reveal as="div" className="contact-info__item" index={0}>
          <Mail size={20} aria-hidden="true" />
          <div>
            <h4>Email</h4>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </Reveal>
        <Reveal as="div" className="contact-info__item" index={1}>
          <Phone size={20} aria-hidden="true" />
          <div>
            <h4>Phone</h4>
            <a href={`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`}>{CONTACT_PHONE}</a>
          </div>
        </Reveal>
        <Reveal as="div" className="contact-info__item" index={2}>
          <MapPin size={20} aria-hidden="true" />
          <div>
            <h4>Location</h4>
            <span>{CONTACT_LOCATION}</span>
          </div>
        </Reveal>
      </section>

      <section className="section section--flush-top">
        <Reveal as="div" className="contact-map-wrap">
          <iframe
            title="KayTech Hub location"
            className="contact-map"
            src={MAP_EMBED_SRC}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </section>

      <section className="auth-page">
        <Reveal as="form" className="auth-form contact-form" onSubmit={handleSubmit}>
          {sent ? (
            <>
              <h1>Message sent</h1>
              <p className="form-success">Thanks for reaching out — we'll get back to you soon.</p>
            </>
          ) : (
            <>
              <h1>Send a message</h1>
              {error && <p className="form-error">{error}</p>}

              <label>
                Full name
                <input type="text" name="name" value={form.name} onChange={handleChange} required />
              </label>

              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>

              <label>
                What's this about?
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="general">General inquiry</option>
                  <option value="partnership">Partnership</option>
                  <option value="corporate">Corporate</option>
                </select>
              </label>

              <label>
                Message
                <textarea name="message" rows={5} value={form.message} onChange={handleChange} required />
              </label>

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </>
          )}
        </Reveal>
      </section>
    </>
  );
}
