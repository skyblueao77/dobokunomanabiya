const GSC_VERIFICATION_PATH = '/googlee9c930fab0503349.html';
const GSC_VERIFICATION_BODY = 'google-site-verification: googlee9c930fab0503349.html';

export function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function buildStrictCsp(nonce) {
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'report-sample'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "require-trusted-types-for 'script'",
    'trusted-types app-jsonld app-sw',
  ].join('; ');
}

export function normalizeTrailingSlashUrl(url) {
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    const normalized = new URL(url.toString());
    normalized.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return normalized;
  }
  return null;
}

const TRUSTED_SCRIPT_IDS = new Set(['theme-init', 'vite-plugin-pwa:register-sw']);

export function isTrustedBuildScript(element) {
  const type = element.getAttribute('type');
  if (type === 'application/ld+json') return false;
  const id = element.getAttribute('id');
  if (id && TRUSTED_SCRIPT_IDS.has(id)) return true;
  const src = element.getAttribute('src');
  if (type === 'module' && typeof src === 'string' && src.startsWith('/assets/')) {
    return true;
  }
  return false;
}

function stripConditionalRequestHeaders(request) {
  if (!request.headers.has('If-None-Match') && !request.headers.has('If-Modified-Since')) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.delete('If-None-Match');
  headers.delete('If-Modified-Since');
  return new Request(request.url, {
    method: request.method,
    headers,
    redirect: request.redirect,
  });
}

function rewriteHtmlWithNonce(response, statusOverride) {
  const nonce = generateNonce();
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Content-Security-Policy', buildStrictCsp(nonce));
  // Preserve BFCache (avoid no-store) while removing validators so browsers never
  // receive a 304 Not Modified that pairs a fresh CSP header nonce with a stale HTML body.
  headers.set('Cache-Control', 'private, no-cache, must-revalidate');
  headers.delete('ETag');
  headers.delete('Last-Modified');

  const rewritten = new HTMLRewriter()
    .on('script', {
      element(element) {
        if (isTrustedBuildScript(element)) {
          element.setAttribute('nonce', nonce);
        }
      },
    })
    .transform(response);

  return new Response(rewritten.body, {
    status: statusOverride ?? response.status,
    statusText: statusOverride === 404 ? 'Not Found' : response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === GSC_VERIFICATION_PATH) {
      return new Response(GSC_VERIFICATION_BODY, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    if (url.pathname.startsWith('/.well-known/')) {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const redirectUrl = normalizeTrailingSlashUrl(url);
    if (redirectUrl) {
      return new Response(null, {
        status: 308,
        headers: {
          Location: redirectUrl.pathname + redirectUrl.search,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Markdown guides allow conditional caching; HTML documents must bypass 304 so
    // per-request CSP nonces in HTTP headers and <script> attributes always match.
    const isMarkdownAsset = url.pathname.endsWith('.md');
    const assetRequest = isMarkdownAsset ? request : stripConditionalRequestHeaders(request);
    let assetRes = await env.ASSETS.fetch(assetRequest);

    if (assetRes.status === 404) {
      const notFoundReq = stripConditionalRequestHeaders(
        new Request(new URL('/404.html', url.origin), {
          method: request.method === 'HEAD' ? 'HEAD' : 'GET',
          headers: request.headers,
        })
      );
      const notFoundRes = await env.ASSETS.fetch(notFoundReq);
      if (notFoundRes.ok) {
        return rewriteHtmlWithNonce(notFoundRes, 404);
      }
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const contentType = assetRes.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().includes('text/html')) {
      return assetRes;
    }

    // Defensive guard in case an upstream asset store still returns 304 for HTML
    if (assetRes.status === 304) {
      assetRes = await env.ASSETS.fetch(
        new Request(request.url, { method: request.method === 'HEAD' ? 'HEAD' : 'GET' })
      );
    }

    return rewriteHtmlWithNonce(assetRes);
  },
};
