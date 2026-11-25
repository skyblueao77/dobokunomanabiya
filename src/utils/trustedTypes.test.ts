import { describe, expect, it } from 'vitest';
import { toTrustedJsonLdScript } from './trustedTypes';

describe('toTrustedJsonLdScript', () => {
  it('accepts valid JSON-LD strings', () => {
    const payload = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite' });
    expect(toTrustedJsonLdScript(payload)).toBe(payload);
  });

  it('rejects malformed or executable strings that are not valid JSON', () => {
    expect(() => toTrustedJsonLdScript('alert(1)')).toThrow();
    expect(() => toTrustedJsonLdScript('</script><script>alert(1)</script>')).toThrow();
  });
});
