import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

export default function CallToAction() {
  return (
    <Reveal as="section" className="cta">
      <span className="badge badge--on-dark">Get Started</span>
      <h2>Ready to get started?</h2>
      <p>Create your free account and explore everything KayTech Hub has to offer.</p>
      <Link to="/register" className="btn btn--primary btn--lg">Sign Up Now</Link>
    </Reveal>
  );
}
