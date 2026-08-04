const Course = require('../models/Course');
const Service = require('../models/Service');
const BlogPost = require('../models/BlogPost');

const SITE_NAME = 'KayTech Hub';

// Known social link-preview crawlers. These generally don't execute
// JavaScript, so they only ever see whatever HTML this middleware hands
// back directly — never react-helmet-async's client-side <head> updates.
const CRAWLER_PATTERNS = [
  /facebookexternalhit/i,
  /Facebot/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /TelegramBot/i,
  /Slackbot/i,
  /Discordbot/i,
  /Pinterest/i,
  /SkypeUriPreview/i,
];

const isSocialCrawler = (userAgent) => Boolean(userAgent) && CRAWLER_PATTERNS.some((pattern) => pattern.test(userAgent));

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const truncate = (value = '', max = 160) => (value.length > max ? `${value.slice(0, max - 3)}...` : value);

const renderPreviewHtml = ({ title, description, image, type, url }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body></body>
</html>
`;

const OBJECT_ID = '[a-fA-F0-9]{24}';
const COURSE_RE = new RegExp(`^/courses/(${OBJECT_ID})$`);
const SERVICE_RE = new RegExp(`^/services/(${OBJECT_ID})$`);
const BLOG_RE = new RegExp(`^/blog/(${OBJECT_ID})$`);

// Intercepts GET requests from known social crawlers hitting a Course,
// Service, or Blog post detail page and responds with a minimal, static
// HTML document carrying that record's real title/description/image in
// its <meta>/OG tags. Every other request (real users, Googlebot, any
// other path) falls straight through via next() completely unaffected.
const socialPreviewMiddleware = async (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (!isSocialCrawler(req.headers['user-agent'])) return next();

  const courseMatch = req.path.match(COURSE_RE);
  const serviceMatch = req.path.match(SERVICE_RE);
  const blogMatch = req.path.match(BLOG_RE);
  if (!courseMatch && !serviceMatch && !blogMatch) return next();

  const pageUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const fallbackImage = `${req.protocol}://${req.get('host')}/og-image.png`;

  try {
    if (courseMatch) {
      const course = await Course.findOne({ _id: courseMatch[1], status: 'published' });
      if (!course) return next();
      return res.send(renderPreviewHtml({
        title: `${course.title} | ${SITE_NAME}`,
        description: truncate(course.description),
        image: course.image_url || fallbackImage,
        type: 'website',
        url: pageUrl,
      }));
    }

    if (serviceMatch) {
      const service = await Service.findById(serviceMatch[1]);
      if (!service) return next();
      return res.send(renderPreviewHtml({
        title: `${service.title} | ${SITE_NAME}`,
        description: truncate(service.description),
        image: service.image_url || fallbackImage,
        type: 'website',
        url: pageUrl,
      }));
    }

    const post = await BlogPost.findOne({ _id: blogMatch[1], status: 'published' });
    if (!post) return next();
    return res.send(renderPreviewHtml({
      title: `${post.title} | ${SITE_NAME}`,
      description: truncate(post.content),
      image: post.image_url || fallbackImage,
      type: 'article',
      url: pageUrl,
    }));
  } catch (err) {
    // A lookup hiccup shouldn't break the page for anyone — fall through
    // to the normal SPA shell (which still carries the generic OG tags).
    return next();
  }
};

module.exports = { socialPreviewMiddleware, isSocialCrawler };
