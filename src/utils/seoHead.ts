import seoHomeCatalog from '../data/seoHomeCatalog.json';
import seoUnitsCatalog from '../data/seoUnitsCatalog.json';
import { SUBJECTS, type SubjectId, type UnitId } from '../data/curriculum';
import { buildRoutePath, type AppRoute } from './router';
import { toTrustedJsonLdScript } from './trustedTypes';

export interface RouteSeoData {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl: string;
  ogType: 'website' | 'article';
  alternateMarkdownUrl: string;
  jsonLd: Record<string, unknown>;
}

interface FaqItem {
  question: string;
  answer: string;
}

export function getSiteUrl(): string {
  const envSiteUrl = import.meta.env?.VITE_SITE_URL as string | undefined;
  const base = (envSiteUrl && envSiteUrl.trim()) || seoHomeCatalog.defaultSiteUrl;
  return base.replace(/\/+$/, '');
}

function buildFaqSchema(faqId: string, faqs: FaqItem[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    '@id': faqId,
    inLanguage: 'ja',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildRouteSeoData(
  route: AppRoute,
  subject: SubjectId,
  siteUrl = getSiteUrl()
): RouteSeoData {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const ogImageUrl = `${cleanSiteUrl}${seoHomeCatalog.ogImagePath}`;
  const providerOrg = {
    '@type': 'Organization',
    '@id': `${cleanSiteUrl}/#organization`,
    name: seoHomeCatalog.siteName,
    url: `${cleanSiteUrl}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${cleanSiteUrl}/icon-512.png`,
    },
    sameAs: [seoHomeCatalog.repositoryUrl],
  };

  if (route === 'legal') {
    const meta = seoUnitsCatalog.routes.legal;
    const canonicalUrl = `${cleanSiteUrl}${meta.path}`;
    return {
      path: meta.path,
      title: meta.title,
      description: meta.description,
      canonicalUrl,
      ogImageUrl,
      ogType: 'article',
      alternateMarkdownUrl: `${cleanSiteUrl}/llms-full.txt`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          providerOrg,
          {
            '@type': 'WebPage',
            '@id': canonicalUrl,
            url: canonicalUrl,
            name: meta.h1,
            description: meta.description,
            inLanguage: 'ja',
            dateModified: seoHomeCatalog.lastModified,
            isPartOf: { '@id': `${cleanSiteUrl}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${cleanSiteUrl}/` },
              {
                '@type': 'ListItem',
                position: 2,
                name: '利用規約・免責事項・プライバシーポリシー',
                item: canonicalUrl,
              },
            ],
          },
        ],
      },
    };
  }

  if (route === 'home') {
    if (subject !== 'all') {
      const sKey = subject as Exclude<SubjectId, 'all'>;
      const sMeta = seoHomeCatalog.subjects[sKey];
      const canonicalUrl = `${cleanSiteUrl}${sMeta.path}`;
      const subjectUnits = (
        Object.entries(seoUnitsCatalog.units) as [UnitId, (typeof seoUnitsCatalog.units)[UnitId]][]
      ).filter(([, u]) => u.subjectId === sKey);

      return {
        path: sMeta.path,
        title: sMeta.title,
        description: sMeta.description,
        canonicalUrl,
        ogImageUrl,
        ogType: 'website',
        alternateMarkdownUrl: `${cleanSiteUrl}/llms-full.txt`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            providerOrg,
            {
              '@type': 'CollectionPage',
              '@id': canonicalUrl,
              url: canonicalUrl,
              name: sMeta.h1,
              description: sMeta.description,
              inLanguage: 'ja',
              dateModified: seoHomeCatalog.lastModified,
              about: { '@type': 'Thing', name: `${sMeta.name} (${sMeta.englishName})` },
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: subjectUnits.map(([, u], idx) => ({
                  '@type': 'ListItem',
                  position: idx + 1,
                  name: u.shortTitle,
                  url: `${cleanSiteUrl}${u.path}`,
                })),
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${cleanSiteUrl}/` },
                { '@type': 'ListItem', position: 2, name: sMeta.name, item: canonicalUrl },
              ],
            },
          ],
        },
      };
    }

    const homeMeta = seoHomeCatalog.routes.home;
    const canonicalUrl = `${cleanSiteUrl}/`;
    const allUnits = Object.values(seoUnitsCatalog.units);

    return {
      path: '/',
      title: homeMeta.title,
      description: homeMeta.description,
      canonicalUrl,
      ogImageUrl,
      ogType: 'website',
      alternateMarkdownUrl: `${cleanSiteUrl}/llms-full.txt`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${cleanSiteUrl}/#website`,
            name: seoHomeCatalog.siteName,
            alternateName: [`${seoHomeCatalog.siteName}｜土木工学・数理計画インタラクティブ学習ポータル`],
            url: canonicalUrl,
            inLanguage: 'ja',
            description: homeMeta.description,
            publisher: { '@id': `${cleanSiteUrl}/#organization` },
          },
          providerOrg,
          {
            '@type': 'WebApplication',
            '@id': `${cleanSiteUrl}/#webapp`,
            name: seoHomeCatalog.siteName,
            url: canonicalUrl,
            description: homeMeta.description,
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web',
            browserRequirements: 'Requires JavaScript',
            inLanguage: 'ja',
            isAccessibleForFree: true,
            publisher: { '@id': `${cleanSiteUrl}/#organization` },
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'JPY',
            },
            about: SUBJECTS.map((s) => ({
              '@type': 'Thing',
              name: `${s.name}（${s.englishName}）`,
            })),
          },
          {
            '@type': 'ItemList',
            '@id': `${cleanSiteUrl}/#unit-list`,
            name: '土木の学び舎 収録単元一覧',
            numberOfItems: allUnits.length,
            itemListElement: allUnits.map((u, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: u.shortTitle,
              url: `${cleanSiteUrl}${u.path}`,
            })),
          },
          buildFaqSchema(`${cleanSiteUrl}/#faq`, seoHomeCatalog.portalFaqs),
        ],
      },
    };
  }

  // Unit page
  const unitId = route;
  const uMeta = seoUnitsCatalog.units[unitId];
  const sMeta = seoHomeCatalog.subjects[uMeta.subjectId as Exclude<SubjectId, 'all'>];
  const canonicalUrl = `${cleanSiteUrl}${buildRoutePath(unitId)}`;
  const unitFaqs = seoUnitsCatalog.unitFaqs[unitId] ?? [];

  return {
    path: uMeta.path,
    title: uMeta.title,
    description: uMeta.description,
    canonicalUrl,
    ogImageUrl,
    ogType: 'article',
    alternateMarkdownUrl: `${cleanSiteUrl}${uMeta.markdownPath}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        providerOrg,
        {
          '@type': ['LearningResource', 'Course'],
          '@id': canonicalUrl,
          url: canonicalUrl,
          name: uMeta.shortTitle,
          headline: uMeta.h1,
          description: uMeta.description,
          inLanguage: 'ja',
          isAccessibleForFree: true,
          learningResourceType: 'Interactive Simulation',
          educationalLevel: uMeta.educationalLevel,
          timeRequired: uMeta.timeRequired,
          dateModified: seoHomeCatalog.lastModified,
          teaches: uMeta.learningObjectives,
          keywords: uMeta.keywords.join(', '),
          provider: { '@id': `${cleanSiteUrl}/#organization` },
          isPartOf: { '@id': `${cleanSiteUrl}/#website` },
          about: {
            '@type': 'Thing',
            name: `${sMeta.name} (${sMeta.englishName})`,
          },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            inLanguage: 'ja',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'JPY',
            category: 'Free',
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${cleanSiteUrl}/` },
            {
              '@type': 'ListItem',
              position: 2,
              name: sMeta.name,
              item: `${cleanSiteUrl}${sMeta.path}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: uMeta.shortTitle,
              item: canonicalUrl,
            },
          ],
        },
        ...(unitFaqs.length > 0 ? [buildFaqSchema(`${canonicalUrl}#faq`, unitFaqs)] : []),
      ],
    },
  };
}

function upsertMetaByName(name: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkRel(rel: string, href: string, type?: string): void {
  const selector = type
    ? `link[rel="${rel}"][type="${type}"]`
    : `link[rel="${rel}"]:not([type])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (type) el.setAttribute('type', type);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyRouteSeoToDocument(route: AppRoute, subject: SubjectId): void {
  if (typeof document === 'undefined') return;
  const seo = buildRouteSeoData(route, subject);

  document.title = seo.title;
  upsertMetaByName('description', seo.description);
  upsertMetaByProperty('og:type', seo.ogType);
  upsertMetaByProperty('og:title', seo.title);
  upsertMetaByProperty('og:description', seo.description);
  upsertMetaByProperty('og:url', seo.canonicalUrl);
  upsertMetaByProperty('og:image', seo.ogImageUrl);
  upsertMetaByName('twitter:title', seo.title);
  upsertMetaByName('twitter:description', seo.description);
  upsertMetaByName('twitter:image', seo.ogImageUrl);

  upsertLinkRel('canonical', seo.canonicalUrl);
  upsertLinkRel('alternate', seo.alternateMarkdownUrl, 'text/markdown');

  let ldScript = document.getElementById('route-jsonld') as HTMLScriptElement | null;
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'route-jsonld';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = toTrustedJsonLdScript(JSON.stringify(seo.jsonLd));
}
