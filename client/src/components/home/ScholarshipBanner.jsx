import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

export default function ScholarshipBanner() {
  return (
    <Reveal as="section" className="banner banner--accent">
      <div>
        <h2>Scholarships available for select courses</h2>
        <p>We're reducing the cost of learning for students who qualify.</p>
      </div>
      <Link to="/courses" className="btn btn--primary">View Scholarship Courses</Link>
    </Reveal>
  );
}
