import { Link } from 'react-router-dom';
import Reveal from './Reveal';

// Shared "this isn't live yet, here's how to reach us" banner for pages
// whose full module (Hub, Space, Site-wide Blog/Events) isn't built yet.
export default function NotifyCta({ text }) {
  return (
    <Reveal as="section" className="banner banner--accent">
      <div><p>{text}</p></div>
      <Link to="/contact" className="btn btn--primary">Contact Us</Link>
    </Reveal>
  );
}
