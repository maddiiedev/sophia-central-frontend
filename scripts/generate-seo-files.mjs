import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function normalizeOrigin(value) {
  const url = new URL(value.includes('://') ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_SITE_URL must use HTTP or HTTPS.');
  }
  return url.origin;
}

const configuredSiteUrl =
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '');

if (!configuredSiteUrl && process.env.VERCEL) {
  throw new Error('Set VITE_SITE_URL in Vercel Production before building the SEO sitemap.');
}

const siteOrigin = normalizeOrigin(configuredSiteUrl || 'http://localhost:5173');
const publicRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/library', priority: '0.9', changefreq: 'daily' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/careers', priority: '0.5', changefreq: 'weekly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/financial-policy', priority: '0.2', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.2', changefreq: 'yearly' },
];
const lastModified = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...publicRoutes.map(({ path, priority, changefreq }) => [
    '  <url>',
    `    <loc>${siteOrigin}${path}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  `Sitemap: ${siteOrigin}/sitemap.xml`,
  '',
].join('\n');

const publicDirectory = resolve(process.cwd(), 'public');
await mkdir(publicDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(publicDirectory, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(resolve(publicDirectory, 'robots.txt'), robots, 'utf8'),
]);
console.info(`Generated robots.txt and sitemap.xml for ${siteOrigin}`);
