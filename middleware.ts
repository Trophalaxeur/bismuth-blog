import { next } from '@vercel/functions';

const CV_PATHS = new Set(['/cv/detailed', '/cv/career-channel', '/en/cv/detailed', '/en/cv/career-channel']);

const CV_PRINT_PATHS = new Set(['/cv/print', '/en/cv/print']);

const CV_PRINT_PROTECTED_VARIANTS = new Set(['detailed', 'career-channel']);

// Astro's static output treats `/path` and `/path/` as the same route — strip the
// trailing slash before matching so it can't be used to bypass a zone check.
function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isCvZone(url: URL): boolean {
  const path = normalizePath(url.pathname);
  if (CV_PATHS.has(path)) return true;
  if (CV_PRINT_PATHS.has(path)) {
    return CV_PRINT_PROTECTED_VARIANTS.has(url.searchParams.get('variant') ?? '');
  }
  return false;
}

function isDocsZone(url: URL): boolean {
  const path = normalizePath(url.pathname);
  return path === '/docs' || path.startsWith('/docs/');
}

// Defense in depth: cv/tailored/* content should never exist in a production
// build at all (see content.config.ts CV_BASE — the githubLoader path pattern
// can't match it, and the route's getStaticPaths() is DEV-only). This blocks
// the request unconditionally regardless of any of that holding true, so a
// future regression in either of those layers still can't serve tailored
// content publicly — no password can unlock this zone, unlike CV_PATHS.
function isTailoredZone(url: URL): boolean {
  const path = normalizePath(url.pathname);
  return path.startsWith('/cv/tailored/') || path.startsWith('/en/cv/tailored/');
}

interface Zone {
  realm: string;
  envVar: string;
  matches: (url: URL) => boolean;
}

const ZONES: Zone[] = [
  { realm: 'CV', envVar: 'CV_PASSWORD', matches: isCvZone },
  { realm: 'Docs', envVar: 'DOCS_PASSWORD', matches: isDocsZone },
];

function unauthorized(realm: string): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${realm}"` },
  });
}

export default function middleware(request: Request) {
  // Only enforce on Vercel prod/preview — local `astro dev` (and `vercel dev`) stays open.
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_ENV !== 'preview') {
    return next();
  }

  const url = new URL(request.url);

  if (isTailoredZone(url)) {
    return new Response('Not found', { status: 404 });
  }

  const zone = ZONES.find((z) => z.matches(url));
  if (!zone) return next();

  // No password configured for this zone → fail closed, never serve unprotected content.
  const password = process.env[zone.envVar];
  if (!password) return unauthorized(zone.realm);

  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return unauthorized(zone.realm);

  let decoded: string;
  try {
    decoded = atob(auth.slice('Basic '.length));
  } catch {
    return unauthorized(zone.realm);
  }
  // Split on the first ":" only — the password itself may legitimately contain one.
  const separatorIndex = decoded.indexOf(':');
  const providedPassword = separatorIndex === -1 ? undefined : decoded.slice(separatorIndex + 1);
  if (providedPassword !== password) return unauthorized(zone.realm);

  return next();
}

export const config = {
  matcher: [
    '/cv/detailed/:path*',
    '/cv/career-channel/:path*',
    '/en/cv/detailed/:path*',
    '/en/cv/career-channel/:path*',
    '/cv/print/:path*',
    '/en/cv/print/:path*',
    '/cv/tailored/:path*',
    '/en/cv/tailored/:path*',
    '/docs/:path*',
  ],
};
