import { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const EMPTY_FORM = { name: '', role_or_organization: '', message: '', rating: '', website: '' };

export default function TestimonialSubmit() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (photoFile) data.append('photo', photoFile);
      await api.post('/testimonials', data);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit your testimonial. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <Reveal as="div" className="form-page__header">
        <Link to="/" className="btn btn--ghost form-page__back">&larr; Back to Home</Link>
        <h1>Share Your Experience</h1>
        <p className="prose">
          Whether you trained with us, worked with our mentors, used our services, or used the workspace — we'd love to hear about it.
          Submissions are reviewed before appearing on our site.
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>Thank you!</h3>
              <p className="form-success">Your testimonial has been submitted and is pending review.</p>
            </div>
          ) : (
            <form className="dark-form" onSubmit={handleSubmit}>
              {submitError && <p className="form-error">{submitError}</p>}

              <HoneypotField value={form.website} onChange={handleChange} />

              <label>
                Full name
                <input type="text" name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Role / organization
                <input
                  type="text" name="role_or_organization" value={form.role_or_organization} onChange={handleChange}
                  placeholder="e.g. Frontend Developer, CEO of XYZ Company, Parent of a student"
                />
              </label>
              <label>
                Your message
                <textarea name="message" rows={4} value={form.message} onChange={handleChange} required />
              </label>
              <label>
                Rating (optional)
                <select name="rating" value={form.rating} onChange={handleChange}>
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>
                  ))}
                </select>
              </label>
              <label>
                Photo (optional)
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0] || null)} />
              </label>

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Testimonial'}
              </button>
            </form>
          )}
        </FormPanel>
      </Reveal>
    </section>
  );
}
