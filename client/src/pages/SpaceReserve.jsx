import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import FormPanel from '../components/common/FormPanel';
import HoneypotField from '../components/common/HoneypotField';
import api from '../api/axios';

const DURATION_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };
const ID_TYPES = ['National ID (NIN)', "Driver's License", 'International Passport', "Voter's Card", 'Other'];
const PURPOSE_OPTIONS = ['Remote Work', 'Business / Startup', 'Academic Research', 'Study / Exam Prep', 'Other'];

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', address: '',
  occupation_or_purpose: '', valid_id_type: '', valid_id_number: '',
  emergency_contact_name: '', emergency_contact_phone: '', website: '',
};

export default function SpaceReserve() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/space/plans/${planId}`)
      .then((res) => setPlan(res.data.plan))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [planId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post('/space/reserve', { ...form, plan_id: planId });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (notFound || !plan) {
    return (
      <section className="section coming-soon">
        <h1>Plan not found</h1>
        <p>We couldn't find that workspace plan.</p>
        <Link to="/space" className="btn btn--primary">Back to Space</Link>
      </section>
    );
  }

  return (
    <section className="section">
      <Reveal as="div" className="form-page__header">
        <Link to="/space" className="btn btn--ghost form-page__back">&larr; Back to Space</Link>
        <h1>Reserve: {plan.name}</h1>
        <p className="prose">
          {DURATION_LABELS[plan.duration] || plan.duration} access — ₦{Number(plan.price).toLocaleString()}. Tell us a bit about
          yourself; payment is handled offline (bank transfer/cash) once we confirm your spot.
        </p>
      </Reveal>

      <Reveal as="div" delay={0.1}>
        <FormPanel>
          {submitted ? (
            <div className="dark-form">
              <h3>Reservation received</h3>
              <p className="form-success">Thanks, {form.full_name.split(' ')[0]} — we'll be in touch with payment details and next steps.</p>
            </div>
          ) : (
            <form className="dark-form" onSubmit={handleSubmit}>
              {submitError && <p className="form-error">{submitError}</p>}

              <HoneypotField value={form.website} onChange={handleChange} />

              <label>
                Full name
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
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
                Address
                <input type="text" name="address" value={form.address} onChange={handleChange} required />
              </label>
              <label>
                Occupation / purpose
                <select name="occupation_or_purpose" value={form.occupation_or_purpose} onChange={handleChange} required>
                  <option value="">Select...</option>
                  {PURPOSE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label>
                Valid ID type
                <select name="valid_id_type" value={form.valid_id_type} onChange={handleChange} required>
                  <option value="">Select...</option>
                  {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                Valid ID number
                <input type="text" name="valid_id_number" value={form.valid_id_number} onChange={handleChange} required />
              </label>
              <label>
                Emergency contact name
                <input type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} required />
              </label>
              <label>
                Emergency contact phone
                <input type="tel" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} required />
              </label>

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Reserve My Spot'}
              </button>
            </form>
          )}
        </FormPanel>
      </Reveal>
    </section>
  );
}
