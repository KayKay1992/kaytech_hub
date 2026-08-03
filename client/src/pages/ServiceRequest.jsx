import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const EMPTY_FORM = { name: '', email: '', phone: '', company_name: '', message: '', website: '' };

export default function ServiceRequest() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/services/${id}`)
      .then((res) => setService(res.data.service))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/services/${id}/request`, form);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (notFound || !service) {
    return (
      <section className="section coming-soon">
        <h1>Service not found</h1>
        <p>We couldn't find that service.</p>
        <Link to="/services" className="btn btn--primary">Back to Services</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <Reveal as="div" className="form-page__header">
        <Link to={`/services/${id}`} className="btn btn--ghost form-page__back">&larr; Back to {service.title}</Link>
        <h1>Request {service.title}</h1>
        <p className="prose">
          Tell us a bit about what you need. Our team will follow up to scope the work and arrange payment (bank transfer/cash, offline).
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>Request received</h3>
              <p className="form-success">Thanks, {form.name.split(' ')[0]} — we'll be in touch shortly.</p>
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
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </label>
              <label>
                Company name
                <input type="text" name="company_name" value={form.company_name} onChange={handleChange} />
              </label>
              <label>
                Message
                <textarea name="message" rows={4} value={form.message} onChange={handleChange} required />
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
