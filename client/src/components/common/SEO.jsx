import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'KayTech Hub';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://kaytechhub.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

// Shared per-page SEO tags (title, meta description, Open Graph) — reuse
// this on every public page instead of hand-rolling <Helmet> per page.
// `image` may be a relative path or an already-absolute URL (e.g. an R2
// cover image); falls back to the site's general branding image.
export default function SEO({ title, titleOverride, description, image, type = 'website' }) {
  // titleOverride bypasses the "[Page] | KayTech Hub" pattern for the one
  // page (Home) that leads with the site name instead of following it.
  const fullTitle = titleOverride || (title ? `${title} | ${SITE_NAME}` : SITE_NAME);
  const resolvedImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={resolvedImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={resolvedImage} />
    </Helmet>
  );
}
