import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const TRAINING_TYPES = [
  { value: 'staff_training', label: 'General Staff Training' },
  { value: 'ai_training', label: 'AI Training' },
  { value: 'software_training', label: 'Software Training' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  company_name: '', contact_person_name: '', contact_email: '', contact_phone: '',
  training_type: '', number_of_participants: '', preferred_timeline: '', message: '', website: '',
};

export default function CorporateTrainingRequest() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post('/corporate-training', form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <SEO
        title="Corporate Training"
        description="Bring KayTech Hub's staff, AI, and software training to your team — tell us about your company and we'll follow up with a proposal."
      />
      <Reveal as="div" className="form-page__header">
        <Link to="/services" className="btn btn--ghost form-page__back">&larr; Back to Services</Link>
        <h1>Corporate Training</h1>
        <p className="prose">
          Tell us about your company and training needs. Our team will follow up with a proposal — payment is arranged offline (bank transfer/cash) once agreed.
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>Request received</h3>
              <p className="form-success">Thanks — our team will be in touch shortly to discuss {form.company_name}'s training needs.</p>
            </div>
          ) : (
            <form className="dark-form" onSubmit={handleSubmit}>
              {submitError && <p className="form-error">{submitError}</p>}

              <HoneypotField value={form.website} onChange={handleChange} />

              <label>
                Company name
                <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required />
              </label>
              <label>
                Contact person
                <input type="text" name="contact_person_name" value={form.contact_person_name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} required />
              </label>
              <label>
                Phone
                <input type="tel" name="contact_phone" value={form.contact_phone} onChange={handleChange} required />
              </label>
              <label>
                Training type
                <select name="training_type" value={form.training_type} onChange={handleChange} required>
                  <option value="">Select a training type...</option>
                  {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label>
                Number of participants (approx., optional)
                <input type="number" name="number_of_participants" min="1" value={form.number_of_participants} onChange={handleChange} />
              </label>
              <label>
                Preferred timeline (optional)
                <input type="text" name="preferred_timeline" value={form.preferred_timeline} onChange={handleChange} placeholder="e.g. Within the next 2 months" />
              </label>
              <label>
                Message
                <textarea name="message" rows={4} value={form.message} onChange={handleChange} required placeholder="Tell us about your team and what you'd like the training to cover..." />
              </label>

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </FormPanel>
      </Reveal>
    </section>
  );
}
