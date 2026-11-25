import { describe, expect, it } from 'vitest';
import { buildStrictCsp, generateNonce } from './index.js';

describe('Cloudflare Worker Strict CSP & Nonce', () => {
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
});
