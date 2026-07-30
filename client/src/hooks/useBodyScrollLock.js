import { useEffect } from 'react';

// Locks page scroll while `locked` is true — used by every mobile drawer
// (site nav menu, dashboard sidebars) so the page behind it can't scroll
// through/under it. Sets overflow:hidden on BOTH <html> and <body>: which
// element is actually the page's scrolling element varies by browser
// (document.scrollingElement), so locking only one is not reliable.
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    if (locked) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [locked]);
}
