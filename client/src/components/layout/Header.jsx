import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from '../../utils/roleRoutes';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// Primary links stay inline on desktop; MORE_LABELS get grouped into a
// "More" dropdown so the nav never has enough items to wrap. The mobile
// drawer ignores this split and just shows every link in original order.
const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/courses', label: 'Courses' },
  { to: '/services', label: 'Services' },
  { to: '/mentorship', label: 'Mentorship' },
  { to: '/space', label: 'Space' },
  { to: '/blog', label: 'Blog' },
  { to: '/events', label: 'Events' },
  { to: '/careers', label: 'Careers' },
  { to: '/scholarships', label: 'Scholarships' },
  { to: '/contact', label: 'Contact' },
];
const MORE_LABELS = ['Blog', 'Events', 'Careers', 'Scholarships'];
const PRIMARY_LINKS = NAV_LINKS.filter((l) => !MORE_LABELS.includes(l.label));
const MORE_LINKS = NAV_LINKS.filter((l) => MORE_LABELS.includes(l.label));

function NavItem({ link, onClick }) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onClick}
      className={({ isActive }) => `site-header__link${isActive ? ' is-active' : ''}`}
    >
      {link.label}
    </NavLink>
  );
}

function MoreDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="site-header__more" ref={ref}>
      <button
        type="button"
        className="site-header__more-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        More <span className="site-header__more-caret">&#9662;</span>
      </button>
      {open && (
        <div className="site-header__more-menu">
          {MORE_LINKS.map((link) => (
            <NavItem key={link.to} link={link} onClick={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderActions({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/');
  };

  if (user) {
    return (
      <>
        {user.role !== 'member' && (
          <Link to={getDashboardPath(user.role)} className="btn btn--ghost" onClick={onNavigate}>
            {user.role === 'admin' ? 'Admin' : 'Dashboard'}
          </Link>
        )}
        <button onClick={handleLogout} className="btn btn--primary">Log out</button>
      </>
    );
  }

  return (
    <>
      <Link to="/login" className="btn btn--ghost" onClick={onNavigate}>Log in</Link>
      <Link to="/register" className="btn btn--primary" onClick={onNavigate}>Sign up</Link>
    </>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Frosted-glass effect once the page scrolls past the top — the "flat"
  // look only reads as premium while it's sitting right at the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock background scroll while the mobile drawer is open — otherwise
  // the page behind it scrolls right through the (semi-transparent) drawer.
  useBodyScrollLock(menuOpen);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link to="/" className="site-header__logo" onClick={closeMenu}>
          <span className="site-header__logo-icon">
            <span /><span /><span />
          </span>
          <span className="site-header__logo-text">Kay<span>Tech Hub</span></span>
        </Link>

        {/* Desktop (>=1081px): primary links inline + More dropdown + auth buttons */}
        <nav className="site-header__nav-desktop">
          {PRIMARY_LINKS.map((link) => (
            <NavItem key={link.to} link={link} />
          ))}
          <MoreDropdown />
        </nav>
        <div className="site-header__actions-desktop">
          <HeaderActions />
        </div>

        {/* Mobile/tablet (<1081px): hamburger opens a right-side drawer */}
        <button
          type="button"
          className="site-header__menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        {menuOpen && <div className="mobile-drawer-overlay" onClick={closeMenu} />}

        <div className={`site-header__menu${menuOpen ? ' is-open' : ''}`}>
          <div className="site-header__menu-head">
            <span className="site-header__menu-brand">Menu</span>
            <button type="button" className="site-header__menu-close" onClick={closeMenu} aria-label="Close menu">
              &times;
            </button>
          </div>

          <nav className="site-header__nav">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.to} link={link} onClick={closeMenu} />
            ))}
          </nav>

          <div className="site-header__actions">
            <HeaderActions onNavigate={closeMenu} />
          </div>
        </div>
      </div>
    </header>
  );
}
