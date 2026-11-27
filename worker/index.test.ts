import { describe, expect, it } from 'vitest';
import worker, { buildStrictCsp, generateNonce, normalizeTrailingSlashUrl } from './index.js';

describe('Cloudflare Worker Strict CSP, Nonce, Redirects & 404', () => {
  it('generates distinct base64 nonces of 128-bit entropy', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(b).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(a).not.toBe(b);
  });

  it('builds Strict CSP with nonce, strict-dynamic, base-uri none, and Trusted Types', () => {
    const csp = buildStrictCsp('TEST_NONCE_123');
    expect(csp).toContain("script-src 'nonce-TEST_NONCE_123' 'strict-dynamic'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("require-trusted-types-for 'script'");
    expect(csp).toContain('trusted-types app-jsonld app-sw');
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
