import { describe, expect, it } from 'vitest';
import worker, {
  buildStrictCsp,
  generateNonce,
  isTrustedBuildScript,
  normalizeTrailingSlashUrl,
} from './index.js';

describe('Cloudflare Worker Strict CSP, Nonce, Redirects & 404', () => {
  it('generates distinct base64 nonces of 128-bit entropy', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(b).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(a).not.toBe(b);
  });

  it('builds Strict CSP with nonce, strict-dynamic, report-sample, base-uri none, and Trusted Types', () => {
    const csp = buildStrictCsp('TEST_NONCE_123');
    expect(csp).toContain("script-src 'nonce-TEST_NONCE_123' 'strict-dynamic' 'report-sample'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("require-trusted-types-for 'script'");
    expect(csp).toContain('trusted-types app-jsonld app-sw');
  });

  it('only stamps CSP nonces on known build-time script tags', () => {
    const makeEl = (attrs: Record<string, string>) => ({
      getAttribute: (name: string) => attrs[name] ?? null,
    });
    expect(isTrustedBuildScript(makeEl({ id: 'theme-init' }))).toBe(true);
    expect(
      isTrustedBuildScript(makeEl({ id: 'vite-plugin-pwa:register-sw', src: '/registerSW.js' }))
    ).toBe(true);
    expect(
      isTrustedBuildScript(makeEl({ type: 'module', src: '/assets/index-abc123.js' }))
    ).toBe(true);
    expect(isTrustedBuildScript(makeEl({ type: 'application/ld+json' }))).toBe(false);
    expect(isTrustedBuildScript(makeEl({ src: 'https://evil.example/x.js' }))).toBe(false);
    expect(isTrustedBuildScript(makeEl({}))).toBe(false);
  });

  it('normalizes trailing slash URLs while preserving root and query string', () => {
    expect(normalizeTrailingSlashUrl(new URL('https://example.com/'))).toBeNull();
    expect(normalizeTrailingSlashUrl(new URL('https://example.com/unit/mohr-circle'))).toBeNull();
    const normalized = normalizeTrailingSlashUrl(
      new URL('https://example.com/unit/mohr-circle/?s1=200')
    );
    expect(normalized?.pathname).toBe('/unit/mohr-circle');
    expect(normalized?.search).toBe('?s1=200');
  });

  it('returns 308 Permanent Redirect for trailing slash paths', async () => {
    const req = new Request('https://dobokunomanabiya.skyblueao77.workers.dev/unit/mohr-circle/?s1=200');
    const res = await worker.fetch(req, {
      ASSETS: { fetch: async () => new Response('unexpected', { status: 500 }) },
    });
    expect(res.status).toBe(308);
    expect(res.headers.get('Location')).toBe('/unit/mohr-circle?s1=200');
  });

  it('strips If-None-Match/If-Modified-Since before fetching HTML so 304 never mismatches nonces', async () => {
    let seenIfNoneMatch: string | null = 'unset';
    let seenIfModifiedSince: string | null = 'unset';
    // Minimal HTMLRewriter polyfill for Node unit test environment
    const originalRewriter = (globalThis as { HTMLRewriter?: unknown }).HTMLRewriter;
    class MockHTMLRewriter {
      on() {
        return this;
      }
      transform(res: Response) {
        return res;
      }
    }
    (globalThis as { HTMLRewriter?: unknown }).HTMLRewriter = MockHTMLRewriter;
    try {
      const req = new Request('https://dobokunomanabiya.skyblueao77.workers.dev/', {
        headers: {
          'If-None-Match': '"abc123"',
          'If-Modified-Since': 'Wed, 21 Oct 2025 07:28:00 GMT',
        },
      });
      const res = await worker.fetch(req, {
        ASSETS: {
          fetch: async (forwarded: Request) => {
            seenIfNoneMatch = forwarded.headers.get('If-None-Match');
            seenIfModifiedSince = forwarded.headers.get('If-Modified-Since');
            return new Response('<!doctype html><html><body>OK</body></html>', {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                ETag: '"abc123"',
                'Last-Modified': 'Wed, 21 Oct 2025 07:28:00 GMT',
              },
            });
          },
        },
      });
      expect(seenIfNoneMatch).toBeNull();
      expect(seenIfModifiedSince).toBeNull();
      expect(res.status).toBe(200);
      expect(res.headers.get('ETag')).toBeNull();
      expect(res.headers.get('Last-Modified')).toBeNull();
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, must-revalidate');
      expect(res.headers.get('Content-Security-Policy')).toContain("'strict-dynamic' 'report-sample'");
    } finally {
      (globalThis as { HTMLRewriter?: unknown }).HTMLRewriter = originalRewriter;
    }
  });

  it('returns HTTP 404 when asset lookup misses (no Soft-404)', async () => {
    const req = new Request('https://dobokunomanabiya.skyblueao77.workers.dev/nonexistent-page');
    const res = await worker.fetch(req, {
      ASSETS: {
        fetch: async () => new Response('Not Found', { status: 404 }),
      },
    });
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('charset=utf-8');
  });
});
