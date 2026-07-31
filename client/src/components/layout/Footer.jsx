import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">KayTech Hub</span>
          <p>Academy, Hub and Space — one place to learn, grow, and work.</p>
        </div>

        <div className="site-footer__links">
          <div>
            <h4>Explore</h4>
            <Link to="/courses">Courses</Link>
            <Link to="/scholarships">Scholarships</Link>
            <Link to="/services">Services</Link>
            <Link to="/mentorship">Mentorship</Link>
            <Link to="/space">Space</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/events">Events</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        &copy; {new Date().getFullYear()} KayTech Hub. All rights reserved.
      </div>
    </footer>
  );
}
