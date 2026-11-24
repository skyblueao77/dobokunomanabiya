import { describe, expect, it } from 'vitest';
import seoCatalog from '../data/seoCatalog.json';
import { LEARNING_UNITS, SUBJECTS, type SubjectId } from '../data/curriculum';
import { buildRoutePath, normalizePathname, parseLocation, type AppRoute } from './router';
import { buildRouteSeoData } from './seoHead';

describe('HTML5 History API router & legacy hash compatibility', () => {
  it('parses canonical History API routes cleanly', () => {
    expect(parseLocation('/', '', '')).toEqual({
      route: 'home',
      subject: 'all',
      search: '',
      legacyHashRedirectPath: null,
    });

    expect(parseLocation('/subject/soil', '', '')).toEqual({
      route: 'home',
      subject: 'soil',
      search: '',
      legacyHashRedirectPath: null,
    });

    expect(parseLocation('/subject/math-programming/', '', '')).toEqual({
      route: 'home',
      subject: 'math-programming',
      search: '',
      legacyHashRedirectPath: null,
    });

    expect(parseLocation('/unit/mohr-circle', '?s1=250&eff=1', '')).toEqual({
      route: 'mohr-circle',
      subject: 'soil',
      search: '?s1=250&eff=1',
      legacyHashRedirectPath: null,
    });

    expect(parseLocation('/legal', '', '')).toEqual({
      route: 'legal',
      subject: 'all',
      search: '',
      legacyHashRedirectPath: null,
    });
  });

  it('redirects legacy #/... hash URLs cleanly to History API paths', () => {
    expect(parseLocation('/', '', '#/unit/mohr-circle?s1=200')).toEqual({
      route: 'mohr-circle',
      subject: 'soil',
      search: '?s1=200',
      legacyHashRedirectPath: '/unit/mohr-circle?s1=200',
    });

    expect(parseLocation('/', '', '#/subject/math-programming')).toEqual({
      route: 'home',
      subject: 'math-programming',
      search: '',
      legacyHashRedirectPath: '/subject/math-programming',
    });

    expect(parseLocation('/', '', '#/legal')).toEqual({
      route: 'legal',
      subject: 'all',
      search: '',
      legacyHashRedirectPath: '/legal',
    });

    expect(parseLocation('/', '', '#/')).toEqual({
      route: 'home',
      subject: 'all',
      search: '',
      legacyHashRedirectPath: '/',
    });
  });

  it('preserves active route when clicking in-page anchors such as #main-content or #disclaimer', () => {
    expect(parseLocation('/unit/lp-optimization', '?ch=2', '#main-content')).toEqual({
      route: 'lp-optimization',
      subject: 'math-programming',
      search: '?ch=2',
      legacyHashRedirectPath: null,
    });

    expect(parseLocation('/legal', '', '#disclaimer')).toEqual({
      route: 'legal',
      subject: 'all',
      search: '',
      legacyHashRedirectPath: null,
    });
  });

  it('normalizes pathnames and builds canonical route paths', () => {
    expect(normalizePathname('/unit/beam-sfd-bmd/')).toBe('/unit/beam-sfd-bmd');
    expect(normalizePathname('//')).toBe('/');
    expect(buildRoutePath('home', 'all')).toBe('/');
    expect(buildRoutePath('home', 'hydraulics')).toBe('/subject/hydraulics');
    expect(buildRoutePath('lp-optimization', 'all', '?ch=4')).toBe('/unit/lp-optimization?ch=4');
    expect(buildRoutePath('legal')).toBe('/legal');
  });
});

describe('SEO & AEO metadata / JSON-LD parity', () => {
  it('generates unique titles, descriptions, valid live canonicals, and JSON-LD for all 13 routes', () => {
    const routesToCheck: Array<{ route: AppRoute; subject: SubjectId }> = [
      { route: 'home', subject: 'all' },
      ...SUBJECTS.map((s) => ({ route: 'home' as const, subject: s.id })),
      ...LEARNING_UNITS.map((u) => ({ route: u.id, subject: u.subjectId })),
      { route: 'legal', subject: 'all' },
    ];

    expect(routesToCheck).toHaveLength(13);

    const titles = new Set<string>();
    const canonicals = new Set<string>();

    const brokenOrigin = `://${['dobokunomanabiya', 'workers', 'dev'].join('.')}`;
    for (const item of routesToCheck) {
      const seo = buildRouteSeoData(item.route, item.subject);
      expect(seo.title.length).toBeGreaterThan(10);
      expect(seo.description.length).toBeGreaterThan(30);
      expect(seo.canonicalUrl).toMatch(/^https:\/\/dobokunomanabiya\.skyblueao77\.workers\.dev\//);
      expect(seo.canonicalUrl).not.toContain(brokenOrigin);

      titles.add(seo.title);
      canonicals.add(seo.canonicalUrl);

      const graph = seo.jsonLd['@graph'];
      expect(Array.isArray(graph)).toBe(true);
      expect((graph as unknown[]).length).toBeGreaterThanOrEqual(2);
    }

    expect(titles.size).toBe(13);
    expect(canonicals.size).toBe(13);
  });

  it('keeps FAQPage JSON-LD 100% identical to visible catalog FAQs', () => {
    const homeSeo = buildRouteSeoData('home', 'all');
    const homeGraph = homeSeo.jsonLd['@graph'] as Array<Record<string, unknown>>;
    const homeFaq = homeGraph.find((node) => node['@type'] === 'FAQPage');
    expect(homeFaq).toBeDefined();
    const homeQuestions = (homeFaq!.mainEntity as Array<Record<string, unknown>>).map((q) => ({
      question: q.name,
      answer: (q.acceptedAnswer as Record<string, unknown>).text,
    }));
    expect(homeQuestions).toEqual(seoCatalog.portalFaqs);

    for (const unit of LEARNING_UNITS) {
      const unitSeo = buildRouteSeoData(unit.id, unit.subjectId);
      const unitGraph = unitSeo.jsonLd['@graph'] as Array<Record<string, unknown>>;
      const faqNode = unitGraph.find((node) => node['@type'] === 'FAQPage');
      expect(faqNode).toBeDefined();
      const unitQuestions = (faqNode!.mainEntity as Array<Record<string, unknown>>).map((q) => ({
        question: q.name,
        answer: (q.acceptedAnswer as Record<string, unknown>).text,
      }));
      expect(unitQuestions).toEqual(seoCatalog.unitFaqs[unit.id]);
    }
  });
});
