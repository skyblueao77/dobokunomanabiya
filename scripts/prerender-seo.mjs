import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const ssrEntryPath = path.join(rootDir, '.ssr-tmp', 'entry-server.js');
const homeCatalogPath = path.join(rootDir, 'src', 'data', 'seoHomeCatalog.json');
const unitsCatalogPath = path.join(rootDir, 'src', 'data', 'seoUnitsCatalog.json');

const homeCatalog = JSON.parse(fs.readFileSync(homeCatalogPath, 'utf8'));
const unitsCatalog = JSON.parse(fs.readFileSync(unitsCatalogPath, 'utf8'));
const catalog = {
  ...homeCatalog,
  routes: {
    ...homeCatalog.routes,
    ...unitsCatalog.routes,
  },
  units: unitsCatalog.units,
  unitFaqs: unitsCatalog.unitFaqs,
};
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

function buildAllRouteDescriptors(buildRouteSeoData) {
  const routes = [];
  const allUnits = Object.entries(catalog.units);
  const allSubjects = Object.entries(catalog.subjects);

  // 1. Home "/"
  {
    const meta = catalog.routes.home;
    const seo = buildRouteSeoData('home', 'all', siteUrl);

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
          <p><strong>開発中（WIP）</strong>：教育・学習補助専用（実務設計への利用禁止・教科書との照合必須）</p>
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
      ...seo,
      outputFile: path.join(distDir, 'index.html'),
      priority: '1.0',
      changefreq: 'weekly',
      rootHtml,
      useReactSsr: true,
    });
  }

  // 2. Subject pages "/subject/<id>"
  for (const [subjectId, sMeta] of allSubjects) {
    const seo = buildRouteSeoData('home', subjectId, siteUrl);
    const subjectUnits = allUnits.filter(([, u]) => u.subjectId === subjectId);

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
      ...seo,
      outputFile: path.join(distDir, 'subject', subjectId, 'index.html'),
      priority: '0.8',
      changefreq: 'weekly',
      rootHtml,
      useReactSsr: true,
    });
  }

  // 3. Unit pages "/unit/<id>"
  for (const [unitId, uMeta] of allUnits) {
    const sMeta = catalog.subjects[uMeta.subjectId];
    const faqs = catalog.unitFaqs[unitId] ?? [];
    const seo = buildRouteSeoData(unitId, uMeta.subjectId, siteUrl);

    const formulaItems = uMeta.keyFormulas
      .map(
        (f) =>
          `<div class="app-surface-subtle rounded-lg p-3 space-y-1"><dt class="text-xs font-bold">${escapeHtml(f.name)}</dt><dd class="text-xs font-mono-num">${escapeHtml(f.formula)} — ${escapeHtml(f.meaning)}</dd></div>`
      )
      .join('\n        ');
    const objItems = uMeta.learningObjectives
      .map((obj) => `<li>${escapeHtml(obj)}</li>`)
      .join('\n        ');
    const faqItems = faqs
      .map(
        (faq) =>
          `<article class="app-surface-subtle rounded-lg p-3.5 space-y-1"><h3 class="text-sm font-bold">${escapeHtml(faq.question)}</h3><p class="text-xs sm:text-sm app-text-muted">${escapeHtml(faq.answer)}</p></article>`
      )
      .join('\n        ');

    const rootHtml = `
      <header class="site-header border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div class="mx-auto max-w-7xl px-4 py-3 text-xs app-text-muted">
          <nav aria-label="パンくずリスト"><a href="/">ホーム</a> &gt; <a href="${escapeHtml(sMeta.path)}">${escapeHtml(sMeta.name)}</a> &gt; <span>${escapeHtml(uMeta.shortTitle)}</span></nav>
        </div>
      </header>
      <main id="main-content" class="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <aside aria-label="開発中および内容の正確性に関する重要なお知らせ" class="app-notice-banner rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed">
          <p><strong class="app-notice-accent">開発中（WIP）</strong>：掲載内容・計算結果には誤りが含まれる可能性があります。教育・学習補助限定とし、実務設計・施工・意思決定には使用しないでください。</p>
        </aside>
        <article class="app-surface rounded-xl p-6 space-y-4">
          <h1 class="text-xl sm:text-2xl font-bold">${escapeHtml(uMeta.h1)}</h1>
          <p class="text-sm app-text-muted">${escapeHtml(uMeta.lead)}</p>
          <p class="text-xs app-text-muted">対象水準：${escapeHtml(uMeta.educationalLevel)} ｜ Markdown版：<a href="${escapeHtml(uMeta.markdownPath)}">${escapeHtml(uMeta.markdownPath)}</a></p>
          <section class="space-y-2">
            <h2 class="text-base font-bold">学習目標</h2>
            <ul class="list-disc pl-5 space-y-1 text-sm app-text-muted">
        ${objItems}
            </ul>
          </section>
          <section class="space-y-2">
            <h2 class="text-base font-bold">主要公式と定義</h2>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${formulaItems}
            </dl>
          </section>
          <section class="space-y-2">
            <h2 class="text-base font-bold">よくある質問（FAQ）</h2>
        ${faqItems}
          </section>
        </article>
      </main>`;

    routes.push({
      ...seo,
      outputFile: path.join(distDir, 'unit', unitId, 'index.html'),
      priority: '0.9',
      changefreq: 'weekly',
      rootHtml,
      useReactSsr: false,
    });
  }

  // 4. Legal page "/legal"
  {
    const meta = catalog.routes.legal;
    const seo = buildRouteSeoData('legal', 'all', siteUrl);

    const objItems = meta.learningObjectives
      .map((obj) => `<li>${escapeHtml(obj)}</li>`)
      .join('\n        ');
    const rootHtml = `
      <header class="site-header border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div class="mx-auto max-w-7xl px-4 py-3 text-xs app-text-muted">
          <nav aria-label="パンくずリスト"><a href="/">ホーム</a> &gt; <span>利用規約・免責事項・プライバシーポリシー</span></nav>
        </div>
      </header>
      <main id="main-content" class="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <article class="app-surface rounded-xl p-6 space-y-4">
          <h1 class="text-xl sm:text-2xl font-bold">${escapeHtml(meta.h1)}</h1>
          <p class="text-sm app-text-muted">${escapeHtml(meta.lead)}</p>
          <ul class="list-disc pl-5 space-y-1 text-sm app-text-muted">
        ${objItems}
          </ul>
          <p class="text-sm"><a href="/" class="underline">ポータル一覧へ戻る</a></p>
        </article>
      </main>`;

    routes.push({
      ...seo,
      outputFile: path.join(distDir, 'legal', 'index.html'),
      priority: '0.4',
      changefreq: 'monthly',
      rootHtml,
      useReactSsr: false,
    });
  }

  return routes;
}

function extractScriptElements(html) {
  const lower = html.toLowerCase();
  const results = [];
  let cursor = 0;

  while (cursor < lower.length) {
    const start = lower.indexOf('<script', cursor);
    if (start === -1) break;

    const afterName = lower[start + 7];
    if (afterName !== undefined && !/[\s>]/.test(afterName)) {
      cursor = start + 7;
      continue;
    }

    const openEnd = html.indexOf('>', start + 7);
    if (openEnd === -1) {
      throw new Error(`Unterminated <script> opening tag at index ${start}`);
    }

    let closeStart = lower.indexOf('</script', openEnd + 1);
    while (closeStart !== -1) {
      const ch = lower[closeStart + 8];
      if (ch === '>' || (ch !== undefined && /\s/.test(ch))) {
        break;
      }
      closeStart = lower.indexOf('</script', closeStart + 8);
    }
    if (closeStart === -1) {
      throw new Error(`Missing </script> closing tag for <script> at index ${start}`);
    }

    const closeEnd = html.indexOf('>', closeStart + 8);
    if (closeEnd === -1) {
      throw new Error(`Unterminated </script> closing tag at index ${closeStart}`);
    }

    results.push({
      start,
      end: closeEnd + 1,
      attrs: html.slice(start + 7, openEnd),
      body: html.slice(openEnd + 1, closeStart),
    });
    cursor = closeEnd + 1;
  }

  return results;
}

function replaceTitleElement(html, newTitle) {
  const lower = html.toLowerCase();
  const start = lower.indexOf('<title>');
  if (start === -1) return html;
  const closeStart = lower.indexOf('</title', start + 7);
  if (closeStart === -1) return html;
  const closeEnd = html.indexOf('>', closeStart + 7);
  if (closeEnd === -1) return html;
  return (
    html.slice(0, start) +
    `<title>${escapeHtml(newTitle)}</title>` +
    html.slice(closeEnd + 1)
  );
}

function inlineAppStylesheet(html) {
  const linkMatch =
    html.match(
      /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'](\/assets\/index-[^"']+\.css)["'][^>]*>/i
    ) ||
    html.match(
      /<link\b[^>]*\bhref=["'](\/assets\/index-[^"']+\.css)["'][^>]*\brel=["']stylesheet["'][^>]*>/i
    );
  if (!linkMatch) {
    throw new Error('Could not find entry stylesheet <link> in template index.html');
  }
  const relCssPath = linkMatch[1].replace(/^\/+/, '');
  const cssFilePath = path.join(distDir, relCssPath);
  if (!fs.existsSync(cssFilePath)) {
    throw new Error(`Entry stylesheet not found at ${cssFilePath}`);
  }
  const cssText = fs.readFileSync(cssFilePath, 'utf8');
  if (/<\/style/i.test(cssText)) {
    throw new Error(`Unsafe </style sequence found inside ${cssFilePath}`);
  }
  return html.replace(linkMatch[0], () => `<style id="app-styles">${cssText}</style>`);
}

function renderHtmlFromTemplate(template, descriptor, renderRouteToHtml) {
  let html = replaceTitleElement(template, descriptor.title);

  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/i,
    `$1${escapeHtml(descriptor.description)}$2`
  );
  if (descriptor.robots) {
    html = html.replace(
      /(<meta\s+name="robots"\s+content=")[^"]*(")/i,
      `$1${escapeHtml(descriptor.robots)}$2`
    );
  }
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

  const jsonLdEl = extractScriptElements(html).find((el) =>
    /id\s*=\s*["']route-jsonld["']/i.test(el.attrs)
  );
  if (!jsonLdEl) {
    throw new Error('Template index.html is missing <script id="route-jsonld">');
  }
  html =
    html.slice(0, jsonLdEl.start) +
    `<script id="route-jsonld" type="application/ld+json">${escapeJsonForHtmlScript(descriptor.jsonLd)}</script>` +
    html.slice(jsonLdEl.end);

  const rootMarker = '<div id="root"></div>';
  const rootIdx = html.indexOf(rootMarker);
  if (rootIdx === -1) {
    throw new Error('Template index.html is missing <div id="root"></div>');
  }
  const renderedRoot = descriptor.useReactSsr
    ? `<div id="root" data-ssr-path="${escapeHtml(descriptor.path)}">${renderRouteToHtml(descriptor.path)}</div>`
    : `<div id="root">${descriptor.rootHtml}\n    </div>`;
  html = html.slice(0, rootIdx) + renderedRoot + html.slice(rootIdx + rootMarker.length);

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

function writeTrustedRegisterSw() {
  const regSwPath = path.join(distDir, 'registerSW.js');
  if (!fs.existsSync(regSwPath)) {
    return;
  }
  const content =
    "if('serviceWorker'in navigator){window.addEventListener('load',()=>{let u='/sw.js';const t=globalThis.trustedTypes;if(t&&typeof t.createPolicy==='function'){try{const p=t.createPolicy('app-sw',{createScriptURL:(v)=>{if(v!=='/sw.js')throw new TypeError('Disallowed SW URL');return v;}});u=p.createScriptURL('/sw.js');}catch{}}navigator.serviceWorker.register(u,{scope:'/'});});}\n";
  writeUtf8Lf(regSwPath, content);

  const swPath = path.join(distDir, 'sw.js');
  if (fs.existsSync(swPath)) {
    const md5 = crypto.createHash('md5').update(content, 'utf8').digest('hex');
    const swContent = fs.readFileSync(swPath, 'utf8');
    const updated = swContent.replace(
      /(\{url:"registerSW\.js",revision:")[a-f0-9]+("\})/i,
      `$1${md5}$2`
    );
    if (updated !== swContent) {
      writeUtf8Lf(swPath, updated);
      console.log(`[prerender-seo] Updated dist/sw.js registerSW.js precache revision => ${md5}`);
    }
  }
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

function getCspHeaderLine() {
  const headersPath = fs.existsSync(path.join(distDir, '_headers'))
    ? path.join(distDir, '_headers')
    : path.join(publicDir, '_headers');
  const headersText = fs.readFileSync(headersPath, 'utf8');
  const cspMatch = headersText.match(/^\s*Content-Security-Policy:\s*(.+)$/im);
  if (!cspMatch) {
    throw new Error(`Missing Content-Security-Policy in ${headersPath}`);
  }
  return cspMatch[1];
}

function getAllowedInlineScriptSha256Set() {
  const cspValue = getCspHeaderLine();
  const scriptSrcMatch = cspValue.match(/\bscript-src\s+([^;]+)/i);
  if (!scriptSrcMatch) {
    throw new Error('Missing script-src directive in Content-Security-Policy');
  }
  const hashes = new Set();
  for (const m of scriptSrcMatch[1].matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)) {
    hashes.add(m[1]);
  }
  return hashes;
}

function verifyGeneratedOutputs(routes) {
  const seenTitles = new Set();
  const seenCanonicals = new Set();
  const cspValue = getCspHeaderLine();
  if (!/\bbase-uri\s+'none'/i.test(cspValue)) {
    throw new Error("Missing base-uri 'none' in Content-Security-Policy");
  }
  if (!/\brequire-trusted-types-for\s+'script'/i.test(cspValue)) {
    throw new Error("Missing require-trusted-types-for 'script' in Content-Security-Policy");
  }
  if (!/\btrusted-types\b[^;]*\bapp-jsonld\b[^;]*\bapp-sw\b/i.test(cspValue)) {
    throw new Error('Missing trusted-types app-jsonld app-sw in Content-Security-Policy');
  }
  const regSwPath = path.join(distDir, 'registerSW.js');
  if (fs.existsSync(regSwPath)) {
    const regSw = fs.readFileSync(regSwPath, 'utf8');
    if (!regSw.includes('app-sw') || !regSw.includes('createScriptURL')) {
      throw new Error('dist/registerSW.js must enforce Trusted Types policy app-sw');
    }
  }
  const swPath = path.join(distDir, 'sw.js');
  if (fs.existsSync(swPath)) {
    const swText = fs.readFileSync(swPath, 'utf8');
    if (
      !swText.includes('skipWaiting') ||
      !swText.includes('clientsClaim') ||
      !swText.includes('NetworkFirst') ||
      !swText.includes('html-pages-cache')
    ) {
      throw new Error('dist/sw.js must configure skipWaiting, clientsClaim, and NetworkFirst html-pages-cache');
    }
    if (
      swText.includes('createHandlerBoundToURL("index.html")') ||
      swText.includes("createHandlerBoundToURL('index.html')")
    ) {
      throw new Error('dist/sw.js must not use Cache-First createHandlerBoundToURL("index.html")');
    }
  }
  const allowedScriptHashes = getAllowedInlineScriptSha256Set();

  for (const r of routes) {
    const html = fs.readFileSync(r.outputFile, 'utf8');
    if (/<link\b[^>]*rel=["']stylesheet["']/i.test(html)) {
      throw new Error(`Render-blocking external stylesheet link remains in ${r.outputFile}`);
    }
    if (!/<style\b[^>]*id=["']app-styles["']/i.test(html)) {
      throw new Error(`Missing inlined <style id="app-styles"> in ${r.outputFile}`);
    }
    if (r.path === '/') {
      if (!html.includes('data-ssr-path="/"') || !html.includes('app-notice-banner')) {
        throw new Error(`Missing SSR prerender content in ${r.outputFile}`);
      }
      if (
        !html.includes('href="/favicon.png" sizes="96x96" type="image/png"') ||
        !html.includes('property="og:site_name" content="土木の学び舎"')
      ) {
        throw new Error(`Missing site name or 96x96 favicon signal in ${r.outputFile}`);
      }
    }
    for (const [rawUrl] of html.matchAll(/\bhttps?:\/\/[^\s"'<>]+/gi)) {
      let parsedHost = '';
      try {
        parsedHost = new URL(rawUrl).hostname.toLowerCase();
      } catch {
        continue;
      }
      if (parsedHost === 'fonts.googleapis.com' || parsedHost === 'fonts.gstatic.com') {
        throw new Error(`External Google Fonts reference still present in ${r.outputFile}`);
      }
    }
    const scripts = extractScriptElements(html);
    for (const scriptEl of scripts) {
      const { attrs, body } = scriptEl;
      const hasSrc = /\bsrc\s*=/.test(attrs);
      const isJsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);
      if (hasSrc && /registerSW\.js/i.test(attrs) && !/\bdefer\b/i.test(attrs)) {
        throw new Error(`Render-blocking registerSW.js without defer in ${r.outputFile}`);
      }
      if (!hasSrc && !isJsonLd) {
        const digest = `sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;
        if (!allowedScriptHashes.has(digest)) {
          throw new Error(
            `CSP violation (inline script hash ${digest} not in script-src) in ${r.outputFile}: ${attrs}`
          );
        }
      }
      if (isJsonLd) {
        const parsedLd = JSON.parse(body);
        const graph = Array.isArray(parsedLd['@graph']) ? parsedLd['@graph'] : [parsedLd];
        const webSiteNodes = graph.filter((node) => node && node['@type'] === 'WebSite');
        if (r.path === '/') {
          if (
            webSiteNodes.length !== 1 ||
            webSiteNodes[0].name !== catalog.siteName ||
            !Array.isArray(webSiteNodes[0].alternateName) ||
            webSiteNodes[0].alternateName.length === 0 ||
            webSiteNodes[0].url !== `${siteUrl}/`
          ) {
            throw new Error(`Invalid or missing WebSite JSON-LD on home route ${r.outputFile}`);
          }
        } else if (webSiteNodes.length > 0) {
          throw new Error(`Unexpected WebSite JSON-LD on non-home route ${r.outputFile}`);
        }
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

function buildNotFoundDescriptor(buildRouteSeoData) {
  const seo = buildRouteSeoData('not-found', 'all', siteUrl);
  const rootHtml = `
      <header class="site-header border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div class="mx-auto max-w-7xl px-4 py-3 text-xs app-text-muted">
          <nav aria-label="主要ナビゲーション"><a href="/"><strong>${escapeHtml(catalog.siteName)}</strong></a></nav>
        </div>
      </header>
      <main id="main-content" class="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-4">
        <section class="app-surface rounded-2xl p-6 space-y-3">
          <p class="text-xs font-mono-num app-text-muted">404 Not Found</p>
          <h1 class="text-xl sm:text-2xl font-bold">お探しのページが見つかりませんでした</h1>
          <p class="text-sm app-text-muted">${escapeHtml(seo.description)}</p>
          <p class="text-sm"><a href="/" class="underline font-semibold">ポータル一覧へ戻る</a></p>
        </section>
      </main>`;

  return {
    ...seo,
    outputFile: path.join(distDir, '404.html'),
    rootHtml,
    useReactSsr: false,
  };
}

// Main execution
if (!fs.existsSync(ssrEntryPath)) {
  throw new Error(`SSR entry bundle not found: ${ssrEntryPath}`);
}
const { renderRouteToHtml, buildRouteSeoData } = await import(pathToFileURL(ssrEntryPath).href);

const rawTemplateHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const templateHtml = inlineAppStylesheet(rawTemplateHtml);
const routes = buildAllRouteDescriptors(buildRouteSeoData);
const notFoundDescriptor = buildNotFoundDescriptor(buildRouteSeoData);

for (const descriptor of routes) {
  const rendered = renderHtmlFromTemplate(templateHtml, descriptor, renderRouteToHtml);
  writeUtf8Lf(descriptor.outputFile, rendered);
}
writeUtf8Lf(
  notFoundDescriptor.outputFile,
  renderHtmlFromTemplate(templateHtml, notFoundDescriptor, renderRouteToHtml)
);

writeTrustedRegisterSw();
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
const notFoundHtml = fs.readFileSync(notFoundDescriptor.outputFile, 'utf8');
if (!notFoundHtml.includes('content="noindex, nofollow"')) {
  throw new Error('dist/404.html must include meta robots noindex, nofollow');
}
console.log(
  `[prerender-seo] Generated ${routes.length} HTML routes + 404.html (with React SSR & inline CSS), ${Object.keys(catalog.units).length} unit .md guides, sitemap.xml, robots.txt, llms.txt, llms-full.txt for ${siteUrl}`
);
