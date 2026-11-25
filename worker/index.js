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

    const assetRes = await env.ASSETS.fetch(request);
    const contentType = assetRes.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().includes('text/html')) {
      return assetRes;
    }

    const nonce = generateNonce();
    const headers = new Headers(assetRes.headers);
    headers.set('Content-Security-Policy', buildStrictCsp(nonce));
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const rewritten = new HTMLRewriter()
      .on('script', {
        element(element) {
          if (element.getAttribute('type') !== 'application/ld+json') {
            element.setAttribute('nonce', nonce);
          }
        },
      })
      .transform(assetRes);

    return new Response(rewritten.body, {
      status: assetRes.status,
      statusText: assetRes.statusText,
      headers,
    });
  },
};
