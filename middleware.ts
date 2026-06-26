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
  const zone = ZONES.find((z) => z.matches(url));
  if (!zone) return next();

  // No password configured for this zone → fail closed, never serve unprotected content.
  const password = process.env[zone.envVar];
  if (!password) return unauthorized(zone.realm);

  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return unauthorized(zone.realm);

  let providedPassword: string | undefined;
  try {
    [, providedPassword] = atob(auth.slice('Basic '.length)).split(':');
  } catch {
    return unauthorized(zone.realm);
  }
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
    '/docs/:path*',
  ],
};
