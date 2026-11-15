# Sophis Central SEO configuration

## Production site origin

Set `VITE_SITE_URL` in the Vercel **Production** environment to the canonical public origin, including the protocol, for example:

```env
VITE_SITE_URL=https://your-current-production-domain.example
```

The value is intentionally not embedded in application source. Route metadata uses this value when configured and otherwise uses the browser's current origin. The pre-build script uses `VITE_SITE_URL`, then `SITE_URL`, then Vercel's `VERCEL_PROJECT_PRODUCTION_URL`. A Vercel production build fails clearly if none is configured; local builds fall back to `http://localhost:5173`.

When the domain changes:
1. Add and verify the new domain in Vercel.
2. Update `VITE_SITE_URL` to the new canonical origin in Vercel Production.
3. Keep the old domain redirecting permanently to the new domain with a single 301 redirect where possible.
4. Redeploy so the generated `sitemap.xml` and `robots.txt` use the new origin.
5. Update the property in Google Search Console and submit the generated `/sitemap.xml`.

## SEO implementation

- Public pages receive route-specific title, description, canonical, Open Graph and Twitter metadata.
- Account, authentication, onboarding and other non-public routes receive `noindex,nofollow`.
- JSON-LD describes the organization, website, educational software application and public page.
- `scripts/generate-seo-files.mjs` creates `public/sitemap.xml` and `public/robots.txt` before each production build.
- Only public, stable routes are included in the sitemap. Authenticated pages and user-specific resource routes are excluded.

## Important limitation

The frontend is a React single-page application. Client-side route metadata improves browser and modern search crawler rendering, but it does not provide full server-side rendering or pre-rendered HTML for every route. For the strongest indexing of public resource detail pages and social previews, consider a later server-side rendering or static pre-rendering phase.
