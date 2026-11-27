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
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
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

function rewriteHtmlWithNonce(response, statusOverride) {
  const nonce = generateNonce();
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Content-Security-Policy', buildStrictCsp(nonce));
  headers.set('Cache-Control', 'private, no-cache, must-revalidate');

  const rewritten = new HTMLRewriter()
    .on('script', {
      element(element) {
        if (element.getAttribute('type') !== 'application/ld+json') {
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

    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status === 404) {
      const notFoundReq = new Request(new URL('/404.html', url.origin), {
        method: request.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: request.headers,
      });
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

    return rewriteHtmlWithNonce(assetRes);
  },
};
