import { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import api from '../api/axios';

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
