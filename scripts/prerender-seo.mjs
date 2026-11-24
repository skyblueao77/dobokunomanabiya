import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const catalogPath = path.join(rootDir, 'src', 'data', 'seoCatalog.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const rawSiteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || catalog.defaultSiteUrl;
const siteUrl = rawSiteUrl.replace(/\/+$/, '');
const ogImageUrl = `${siteUrl}${catalog.ogImagePath}`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForHtmlScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function writeUtf8Lf(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.replace(/\r\n/g, '\n'), 'utf8');
}

function buildFaqSchema(faqId, faqs) {
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

const providerOrg = {
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: catalog.siteName,
  url: `${siteUrl}/`,
  sameAs: [catalog.repositoryUrl],
};

function buildAllRouteDescriptors() {
  const routes = [];
  const allUnits = Object.entries(catalog.units);
  const allSubjects = Object.entries(catalog.subjects);

  // 1. Home "/"
  {
    const meta = catalog.routes.home;
    const canonicalUrl = `${siteUrl}/`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          name: catalog.siteName,
          url: canonicalUrl,
          inLanguage: 'ja',
          description: meta.description,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        providerOrg,
        {
          '@type': 'WebApplication',
          '@id': `${siteUrl}/#webapp`,
          name: catalog.siteName,
          url: canonicalUrl,
          description: meta.description,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          browserRequirements: 'Requires JavaScript',
          inLanguage: 'ja',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
          about: allSubjects.map(([, s]) => ({
            '@type': 'Thing',
            name: `${s.name}（${s.englishName}）`,
          })),
        },
        {
          '@type': 'ItemList',
          '@id': `${siteUrl}/#unit-list`,
          name: '土木の学び舎 収録単元一覧',
          numberOfItems: allUnits.length,
          itemListElement: allUnits.map(([, u], idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: u.shortTitle,
            url: `${siteUrl}${u.path}`,
          })),
        },
        buildFaqSchema(`${siteUrl}/#faq`, catalog.portalFaqs),
      ],
    };

    const navLinks = allSubjects
      .map(([, s]) => `<a href="${escapeHtml(s.path)}">${escapeHtml(s.name)}</a>`)
      .join(' / ');
    const unitLinks = allUnits
      .map(
        ([, u]) =>
          `<li><a href="${escapeHtml(u.path)}">${escapeHtml(u.shortTitle)}</a> — ${escapeHtml(u.description)}</li>`
      )
      .join('\n        ');
    const formulaItems = meta.keyFormulas
      .map(
        (f) =>
          `<div><dt>${escapeHtml(f.name)}</dt><dd><code>${escapeHtml(f.formula)}</code> — ${escapeHtml(f.meaning)}</dd></div>`
      )
      .join('\n        ');
    const faqItems = catalog.portalFaqs
      .map(
        (faq) =>
          `<article><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></article>`
      )
      .join('\n        ');

    const rootHtml = `
      <header class="mx-auto max-w-7xl px-4 py-4 border-b">
        <nav aria-label="主要ナビゲーション">
          <a href="/"><strong>${escapeHtml(catalog.siteName)}</strong></a> ｜ ${navLinks} ｜ <a href="/legal">免責・利用規約</a>
        </nav>
      </header>
      <main id="main-content" class="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <aside aria-label="開発中および内容の正確性に関する重要なお知らせ">
          <p><strong>開発中（WIP）</strong>：本サイトは教育・学習補助目的で開発中であり、掲載内容・計算結果に誤りを含む可能性があります。必ず教科書・公的基準と照合し、実務設計・意思決定への利用は避けてください。</p>
        </aside>
        <section>
          <h1>${escapeHtml(meta.h1)}</h1>
          <p>${escapeHtml(meta.lead)}</p>
        </section>
        <section>
          <h2>収録単元シミュレーター一覧</h2>
          <ul>
        ${unitLinks}
          </ul>
        </section>
        <section>
          <h2>主要公式リファレンス</h2>
          <dl>
        ${formulaItems}
          </dl>
        </section>
        <section>
          <h2>よくある質問（FAQ）</h2>
        ${faqItems}
        </section>
      </main>`;

    routes.push({
      path: '/',
      outputFile: path.join(distDir, 'index.html'),
      priority: '1.0',
      changefreq: 'weekly',
      title: meta.title,
      description: meta.description,
      canonicalUrl,
      ogType: 'website',
      alternateMarkdownUrl: `${siteUrl}/llms-full.txt`,
      jsonLd,
      rootHtml,
    });
  }

  // 2. Subject pages "/subject/<id>"
  for (const [subjectId, sMeta] of allSubjects) {
    const canonicalUrl = `${siteUrl}${sMeta.path}`;
    const subjectUnits = allUnits.filter(([, u]) => u.subjectId === subjectId);
    const jsonLd = {
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
          dateModified: catalog.lastModified,
          about: { '@type': 'Thing', name: `${sMeta.name} (${sMeta.englishName})` },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: subjectUnits.map(([, u], idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: u.shortTitle,
              url: `${siteUrl}${u.path}`,
            })),
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: sMeta.name, item: canonicalUrl },
          ],
        },
      ],
    };

    const unitItems = subjectUnits
      .map(
        ([, u]) =>
          `<li><a href="${escapeHtml(u.path)}">${escapeHtml(u.shortTitle)}</a>（${escapeHtml(u.educationalLevel)}）— ${escapeHtml(u.description)}</li>`
      )
      .join('\n        ');
    const formulaItems = sMeta.keyFormulas
      .map(
        (f) =>
          `<div><dt>${escapeHtml(f.name)}</dt><dd><code>${escapeHtml(f.formula)}</code> — ${escapeHtml(f.meaning)}</dd></div>`
      )
      .join('\n        ');

    const rootHtml = `
      <header class="mx-auto max-w-7xl px-4 py-4 border-b">
        <nav aria-label="パンくずリスト"><a href="/">ホーム</a> &gt; <span>${escapeHtml(sMeta.name)}</span></nav>
      </header>
      <main id="main-content" class="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <aside aria-label="開発中および内容の正確性に関する重要なお知らせ">
          <p><strong>開発中（WIP）</strong>：本サイトは学習補助目的の試作アプリです。実務設計・試験解答等には使用せず、教科書・公的基準と照合してください。</p>
        </aside>
        <section>
          <h1>${escapeHtml(sMeta.h1)}</h1>
          <p>${escapeHtml(sMeta.lead)}</p>
        </section>
        <section>
          <h2>${escapeHtml(sMeta.name)}の収録単元</h2>
          <ul>
        ${unitItems}
          </ul>
        </section>
        <section>
          <h2>主要公式</h2>
          <dl>
        ${formulaItems}
          </dl>
        </section>
      </main>`;

    routes.push({
      path: sMeta.path,
      outputFile: path.join(distDir, 'subject', subjectId, 'index.html'),
      priority: '0.8',
      changefreq: 'weekly',
      title: sMeta.title,
      description: sMeta.description,
      canonicalUrl,
      ogType: 'website',
      alternateMarkdownUrl: `${siteUrl}/llms-full.txt`,
      jsonLd,
      rootHtml,
    });
  }

  // 3. Unit pages "/unit/<id>"
  for (const [unitId, uMeta] of allUnits) {
    const sMeta = catalog.subjects[uMeta.subjectId];
    const canonicalUrl = `${siteUrl}${uMeta.path}`;
    const faqs = catalog.unitFaqs[unitId] ?? [];
    const jsonLd = {
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
          dateModified: catalog.lastModified,
          teaches: uMeta.learningObjectives,
          keywords: uMeta.keywords.join(', '),
          provider: { '@id': `${siteUrl}/#organization` },
          about: { '@type': 'Thing', name: `${sMeta.name} (${sMeta.englishName})` },
          hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', inLanguage: 'ja' },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY', category: 'Free' },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: sMeta.name, item: `${siteUrl}${sMeta.path}` },
            { '@type': 'ListItem', position: 3, name: uMeta.shortTitle, item: canonicalUrl },
          ],
        },
        ...(faqs.length > 0 ? [buildFaqSchema(`${canonicalUrl}#faq`, faqs)] : []),
      ],
    };

    const formulaItems = uMeta.keyFormulas
      .map(
        (f) =>
          `<div><dt>${escapeHtml(f.name)}</dt><dd><code>${escapeHtml(f.formula)}</code> — ${escapeHtml(f.meaning)}</dd></div>`
      )
      .join('\n        ');
    const objItems = uMeta.learningObjectives
      .map((obj) => `<li>${escapeHtml(obj)}</li>`)
      .join('\n        ');
    const faqItems = faqs
      .map(
        (faq) =>
          `<article><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></article>`
      )
      .join('\n        ');

    const rootHtml = `
      <header class="mx-auto max-w-7xl px-4 py-4 border-b">
        <nav aria-label="パンくずリスト"><a href="/">ホーム</a> &gt; <a href="${escapeHtml(sMeta.path)}">${escapeHtml(sMeta.name)}</a> &gt; <span>${escapeHtml(uMeta.shortTitle)}</span></nav>
      </header>
      <main id="main-content" class="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <aside aria-label="開発中および内容の正確性に関する重要なお知らせ">
          <p><strong>開発中（WIP）</strong>：掲載内容・計算結果には誤りが含まれる可能性があります。教育・学習補助限定とし、実務設計・施工・意思決定には使用しないでください。</p>
        </aside>
        <article>
          <h1>${escapeHtml(uMeta.h1)}</h1>
          <p>${escapeHtml(uMeta.lead)}</p>
          <p>対象水準：${escapeHtml(uMeta.educationalLevel)} ｜ Markdown版：<a href="${escapeHtml(uMeta.markdownPath)}">${escapeHtml(uMeta.markdownPath)}</a></p>
          <section>
            <h2>学習目標</h2>
            <ul>
        ${objItems}
            </ul>
          </section>
          <section>
            <h2>主要公式と定義</h2>
            <dl>
        ${formulaItems}
            </dl>
          </section>
          <section>
            <h2>よくある質問（FAQ）</h2>
        ${faqItems}
          </section>
        </article>
      </main>`;

    routes.push({
      path: uMeta.path,
      outputFile: path.join(distDir, 'unit', unitId, 'index.html'),
      priority: '0.9',
      changefreq: 'weekly',
      title: uMeta.title,
      description: uMeta.description,
      canonicalUrl,
      ogType: 'article',
      alternateMarkdownUrl: `${siteUrl}${uMeta.markdownPath}`,
      jsonLd,
      rootHtml,
    });
  }

  // 4. Legal page "/legal"
  {
    const meta = catalog.routes.legal;
    const canonicalUrl = `${siteUrl}${meta.path}`;
    const jsonLd = {
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
          dateModified: catalog.lastModified,
          isPartOf: { '@id': `${siteUrl}/#website` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            {
              '@type': 'ListItem',
              position: 2,
              name: '利用規約・免責事項・プライバシーポリシー',
              item: canonicalUrl,
            },
          ],
        },
      ],
    };

    const objItems = meta.learningObjectives
      .map((obj) => `<li>${escapeHtml(obj)}</li>`)
      .join('\n        ');
    const rootHtml = `
      <header class="mx-auto max-w-7xl px-4 py-4 border-b">
        <nav aria-label="パンくずリスト"><a href="/">ホーム</a> &gt; <span>利用規約・免責事項・プライバシーポリシー</span></nav>
      </header>
      <main id="main-content" class="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <article>
          <h1>${escapeHtml(meta.h1)}</h1>
          <p>${escapeHtml(meta.lead)}</p>
          <ul>
        ${objItems}
          </ul>
          <p><a href="/">ポータル一覧へ戻る</a></p>
        </article>
      </main>`;

    routes.push({
      path: meta.path,
      outputFile: path.join(distDir, 'legal', 'index.html'),
      priority: '0.4',
      changefreq: 'monthly',
      title: meta.title,
      description: meta.description,
      canonicalUrl,
      ogType: 'article',
      alternateMarkdownUrl: `${siteUrl}/llms-full.txt`,
      jsonLd,
      rootHtml,
    });
  }

  return routes;
}

function renderHtmlFromTemplate(template, descriptor) {
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(descriptor.title)}</title>`);

  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.description)}$2`
  );
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.canonicalUrl)}$2`
  );
  html = html.replace(
    /(<link\b[^>]*rel="alternate"[^>]*type="text\/markdown"[^>]*href=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.alternateMarkdownUrl)}$2`
  );

  html = html.replace(
    /(<meta\s+property="og:type"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.ogType)}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.canonicalUrl)}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.title)}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.description)}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:image"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(ogImageUrl)}$2`
  );

  html = html.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.title)}$2`
  );
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.description)}$2`
  );
  html = html.replace(
    /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(ogImageUrl)}$2`
  );

  html = html.replace(
    /<script\s+id="route-jsonld"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script id="route-jsonld" type="application/ld+json">${escapeJsonForHtmlScript(descriptor.jsonLd)}</script>`
  );

  html = html.replace(
    /<div\s+id="root"><\/div>/i,
    `<div id="root">${descriptor.rootHtml}\n    </div>`
  );

  return html;
}

function generateSitemapXml(routes) {
  const entries = routes
    .map(
      (r) => `  <url>
    <loc>${escapeHtml(r.canonicalUrl)}</loc>
    <lastmod>${catalog.lastModified}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function generateUnitMarkdown(unitId, uMeta) {
  const sMeta = catalog.subjects[uMeta.subjectId];
  const faqs = catalog.unitFaqs[unitId] ?? [];
  const formulasMd = uMeta.keyFormulas
    .map((f) => `- **${f.name}**: \`${f.formula}\` — ${f.meaning}`)
    .join('\n');
  const objectivesMd = uMeta.learningObjectives.map((o) => `- ${o}`).join('\n');
  const faqsMd = faqs.map((q) => `### ${q.question}\n${q.answer}`).join('\n\n');

  return `# ${uMeta.h1}

> ${uMeta.lead}

- サイト: [${catalog.siteName}](${siteUrl}/)
- 科目: [${sMeta.name}（${sMeta.englishName}）](${siteUrl}${sMeta.path})
- インタラクティブ画面: ${siteUrl}${uMeta.path}
- 対象水準: ${uMeta.educationalLevel} / 所要目安: ${uMeta.timeRequired}
- 規約・注記: 現在開発中（WIP）の教育補助ツールです。土質力学は圧縮正（＋）規約を採用しています。実務設計・施工・意思決定への利用は禁止しています。

## 学習目標
${objectivesMd}

## 主要公式と定義
${formulasMd}

## よくある質問（FAQ）
${faqsMd}
`;
}

function generateLlmsTxt() {
  const subjectLines = Object.values(catalog.subjects)
    .map((s) => `- [${s.name}（${s.englishName}）](${siteUrl}${s.path}): ${s.description}`)
    .join('\n');
  const unitLines = Object.values(catalog.units)
    .map((u) => `- [${u.shortTitle}](${siteUrl}${u.path}): ${u.description}`)
    .join('\n');
  const mdLines = Object.values(catalog.units)
    .map((u) => `- [${u.shortTitle} (Markdown)](${siteUrl}${u.markdownPath}): 主要公式・学習目標・FAQの要約`)
    .join('\n');

  return `# ${catalog.siteName}

> ${catalog.routes.home.lead} 日本の標準教科書規約（土質力学：圧縮正、BMD：下側引張正）に準拠し、個人情報は一切収集しません（現在開発中・教育学習補助限定・実務利用禁止）。

## 収録科目
${subjectLines}

## 学習単元シミュレーター
${unitLines}

## 単元別 Markdown リファレンス
${mdLines}

## 全単元統合ガイド
- [llms-full.txt](${siteUrl}/llms-full.txt): 全4科目・全7単元の主要公式、符号規約、学習目標、FAQ の統合ドキュメント

## Optional
- [利用規約・免責事項・プライバシーポリシー・技術者倫理](${siteUrl}/legal): 開発中注記、実務利用禁止、localStorage利用、WCAG 2.2 AA方針、OSSライセンス
`;
}

function generateLlmsFullTxt() {
  const unitSections = Object.entries(catalog.units)
    .map(([id, u]) => generateUnitMarkdown(id, u))
    .join('\n---\n\n');
  const portalFaqMd = catalog.portalFaqs
    .map((q) => `### ${q.question}\n${q.answer}`)
    .join('\n\n');

  return `# ${catalog.siteName}｜完全リファレンス（llms-full.txt）

> ${catalog.routes.home.description}

- 公開URL: ${siteUrl}/
- サイトマップ: ${siteUrl}/sitemap.xml
- 最終更新日: ${catalog.lastModified}
- 注意事項: 本サイトは現在開発中（WIP）であり、掲載内容・計算結果に誤りを含む可能性があります。教育・学習補助目的のみに利用し、実務設計・施工・意思決定には使用しないでください。

## ポータル全体 FAQ
${portalFaqMd}

---

${unitSections}`;
}

function updateServiceWorkerIndexRevision(indexHtmlContent) {
  const swPath = path.join(distDir, 'sw.js');
  if (!fs.existsSync(swPath)) {
    return;
  }
  const md5 = crypto.createHash('md5').update(indexHtmlContent, 'utf8').digest('hex');
  const swContent = fs.readFileSync(swPath, 'utf8');
  const updated = swContent.replace(
    /(\{url:"index\.html",revision:")[a-f0-9]+("\})/i,
    `$1${md5}$2`
  );
  if (updated !== swContent) {
    writeUtf8Lf(swPath, updated);
    console.log(`[prerender-seo] Updated dist/sw.js index.html precache revision => ${md5}`);
  }
}

function verifyGeneratedOutputs(routes) {
  const seenTitles = new Set();
  const seenCanonicals = new Set();

  for (const r of routes) {
    const html = fs.readFileSync(r.outputFile, 'utf8');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const m of scripts) {
      const attrs = m[1];
      const body = m[2];
      const hasSrc = /\bsrc\s*=/.test(attrs);
      const isJsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);
      if (!hasSrc && !isJsonLd) {
        throw new Error(`CSP violation (inline script) in ${r.outputFile}: ${attrs}`);
      }
      if (isJsonLd) {
        JSON.parse(body);
      }
    }
    if (seenTitles.has(r.title)) {
      throw new Error(`Duplicate <title> detected: ${r.title}`);
    }
    seenTitles.add(r.title);
    if (seenCanonicals.has(r.canonicalUrl)) {
      throw new Error(`Duplicate canonical URL detected: ${r.canonicalUrl}`);
    }
    seenCanonicals.add(r.canonicalUrl);
    const brokenHost = ['dobokunomanabiya', 'workers', 'dev'].join('.');
    if (html.includes(`://${brokenHost}`)) {
      throw new Error(`Broken legacy domain found in ${r.outputFile}`);
    }
  }
}

// Main execution
const templateHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const routes = buildAllRouteDescriptors();

for (const descriptor of routes) {
  const rendered = renderHtmlFromTemplate(templateHtml, descriptor);
  writeUtf8Lf(descriptor.outputFile, rendered);
}

const finalHomeHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
updateServiceWorkerIndexRevision(finalHomeHtml);

// Unit Markdown equivalents
for (const [unitId, uMeta] of Object.entries(catalog.units)) {
  const md = generateUnitMarkdown(unitId, uMeta);
  writeUtf8Lf(path.join(distDir, 'unit', `${unitId}.md`), md);
}

// Crawler & AI agent files in both public/ and dist/
const sitemapXml = generateSitemapXml(routes);
const robotsTxt = generateRobotsTxt();
const llmsTxt = generateLlmsTxt();
const llmsFullTxt = generateLlmsFullTxt();

for (const targetDir of [publicDir, distDir]) {
  writeUtf8Lf(path.join(targetDir, 'sitemap.xml'), sitemapXml);
  writeUtf8Lf(path.join(targetDir, 'robots.txt'), robotsTxt);
  writeUtf8Lf(path.join(targetDir, 'llms.txt'), llmsTxt);
  writeUtf8Lf(path.join(targetDir, 'llms-full.txt'), llmsFullTxt);
}

verifyGeneratedOutputs(routes);
console.log(
  `[prerender-seo] Generated ${routes.length} HTML routes, ${Object.keys(catalog.units).length} unit .md guides, sitemap.xml, robots.txt, llms.txt, llms-full.txt for ${siteUrl}`
);
