import { ArrowLeft, BookOpen, Lock, Scale, ShieldAlert } from 'lucide-react';

interface LegalPageProps {
  onBackToPortal: () => void;
}

export default function LegalPage({ onBackToPortal }: LegalPageProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToPortal}
          className="interactive-btn inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ポータルへ戻る
        </button>

        <nav aria-label="法的・倫理的情報ナビゲーション" className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => scrollToSection('disclaimer')}
            className="interactive-btn rounded-md border border-[var(--border-subtle)] px-2.5 py-1 cursor-pointer"
          >
            免責事項
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('terms')}
            className="interactive-btn rounded-md border border-[var(--border-subtle)] px-2.5 py-1 cursor-pointer"
          >
            利用規約
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('privacy')}
            className="interactive-btn rounded-md border border-[var(--border-subtle)] px-2.5 py-1 cursor-pointer"
          >
            プライバシーポリシー
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ethics')}
            className="interactive-btn rounded-md border border-[var(--border-subtle)] px-2.5 py-1 cursor-pointer"
          >
            技術者倫理・学術的誠実性
          </button>
        </nav>
      </div>

      <header className="app-surface rounded-xl p-6 space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold">
          利用規約・免責事項・プライバシーポリシー・技術者倫理
        </h1>
        <p className="text-sm app-text-muted">
          「土木の学び舎」（以下「本サイト」といいます）をご利用いただくにあたり、法的・倫理的な観点から以下の事項をご確認ください。本サイトを利用した時点で、これらの内容に同意したものとみなします。
        </p>
      </header>

      {/* 1. 免責事項 */}
      <section id="disclaimer" className="app-surface rounded-xl p-6 space-y-4 scroll-mt-6">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
          <h2 className="text-lg font-bold">1. 免責事項（実務設計への使用禁止）</h2>
        </div>

        <div className="space-y-3 text-sm leading-relaxed">
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-1.5">
            <p className="font-bold text-amber-700 dark:text-amber-300">
              重要：教育・学習目的限定（実務設計・施工への使用禁止）
            </p>
            <p>
              本サイトで提供される計算結果、グラフ、図解およびシミュレーションは、土木工学の概念理解および学習支援のみを目的としています。
              <strong>
                実際の土木構造物・建築物の設計、施工計画、安全照査、公的機関への申請等には絶対に使用しないでください。
              </strong>
              実務においては、必ず関係法令、最新の各種設計基準（道路橋示方書、地盤工学会基準、水理公式集等）および有資格者（技術士等）の専門的判断に従ってください。
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2 app-text-muted">
            <li>
              <strong className="text-[var(--text-primary)]">モデルの単純化と計算精度：</strong>
              本サイトのシミュレーションは教育上の分かりやすさを優先し、一様地盤・理想弾塑性体・定常流などの単純化された仮定に基づいています。また、数値計算上の丸め誤差やプログラム上の不具合等により、厳密解や実際の物理現象と異なる結果が生じる場合があります。
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">損害賠償の免責：</strong>
              本サイトの利用、または利用できなかったことにより生じた直接的・間接的ないかなる損害についても、運営者は一切の責任を負いません。
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">外部リンク：</strong>
              本サイトから外部サイトへのリンクが含まれる場合、リンク先の内容や安全性について運営者は責任を負いません。
            </li>
          </ul>
        </div>
      </section>

      {/* 2. 利用規約 */}
      <section id="terms" className="app-surface rounded-xl p-6 space-y-4 scroll-mt-6">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3">
          <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          <h2 className="text-lg font-bold">2. 利用規約</h2>
        </div>

        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed app-text-muted">
          <li>
            <strong className="text-[var(--text-primary)]">適用範囲：</strong>
            本規約は、本サイトの閲覧およびすべての機能の利用に適用されます。
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">知的財産権：</strong>
            本サイトに掲載されている文章、数式表現、図表、プログラムコード等の著作権および知的財産権は、運営者または正当な権利者に帰属します。私的利用の範囲を超えた無断転載、複製、再配布、商用利用を禁止します。
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">禁止事項：</strong>
            本サイトの運営を妨害する行為、過度な負荷をかける自動アクセス、不正アクセス、法令または公序良俗に反する行為を禁止します。
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">内容の変更・終了：</strong>
            運営者は、事前の予告なく本サイトの内容を変更、一時中断、または終了する場合があります。
          </li>
        </ul>
      </section>

      {/* 3. プライバシーポリシー */}
      <section id="privacy" className="app-surface rounded-xl p-6 space-y-4 scroll-mt-6">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3">
          <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <h2 className="text-lg font-bold">3. プライバシーポリシー</h2>
        </div>

        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed app-text-muted">
          <li>
            <strong className="text-[var(--text-primary)]">個人情報の不収集（クライアント完結型）：</strong>
            本サイトはブラウザ上で完結する静的ウェブアプリケーションであり、氏名、メールアドレス、アカウント情報などの個人情報をサーバー側で収集・保存することはありません。
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">ブラウザ保存領域（localStorage）の利用：</strong>
            本サイトでは、学習の進捗状況（完了した単元・問題）および画面表示テーマ設定（ライト／ダークモード）を保持するために、お使いのブラウザの <code className="px-1 py-0.5 rounded bg-[var(--surface-subtle)] text-xs">localStorage</code> を使用しています。これらのデータはお客様の端末内にのみ保存され、外部サーバーへ送信されることはありません。ブラウザの設定からいつでも削除可能です。
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Cookie・広告トラッキング：</strong>
            本サイトは広告配信や行動追跡を目的としたサードパーティ Cookie を使用していません。
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">ホスティング基盤におけるログ：</strong>
            本サイトの配信には Cloudflare 等の静的ホスティング基盤を利用しており、インフラ提供者のセキュリティおよび安定運用のため、アクセス元の IP アドレス等の標準的な通信ログが処理される場合があります。
          </li>
        </ul>
      </section>

      {/* 4. 技術者倫理・学術的誠実性 */}
      <section id="ethics" className="app-surface rounded-xl p-6 space-y-4 scroll-mt-6">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-3">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
          <h2 className="text-lg font-bold">4. 技術者倫理と学術的誠実性</h2>
        </div>

        <div className="space-y-3 text-sm leading-relaxed app-text-muted">
          <p>
            土木工学は、道路・橋梁・河川・地盤などの社会インフラを通じて、人々の生命・財産および安全な暮らしを支える重要な学問・技術分野です。本サイトは、以下の倫理的姿勢を重視しています。
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-[var(--text-primary)]">ブラックボックス化への戒め：</strong>
              計算ツールやソフトウェアの出力を無批判に鵜呑みにせず、常に背後にある力学原理・仮定条件・物理的意味を理解し、妥当性を自ら検証する姿勢を大切にしてください。
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">学術的誠実性（Academic Integrity）：</strong>
              本サイトの計算機能や演習解説は、自らの理解を深めるための補助教材として提供されています。学校の課題や試験において、理解を伴わないまま結果を転記する等の不正行為には使用しないでください。
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">アクセシビリティへの配慮：</strong>
              年齢、障害の有無、利用環境にかかわらず誰もが学びやすいよう、キーボード操作や配色コントラスト等のアクセシビリティ向上に努めています。
            </li>
          </ul>
        </div>
      </section>

      {/* 5. お問い合わせ・著作権表記 */}
      <section className="app-surface rounded-xl p-6 space-y-2 text-sm app-text-muted">
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          5. お問い合わせ・著作権表記
        </h2>
        <p>
          本サイトの内容に関するご質問、不具合の報告、改善のご提案などは、プロジェクトの公式 GitHub リポジトリの Issues 等を通じてお寄せください。
        </p>
        <p className="pt-1 text-xs">
          © {new Date().getFullYear()} 土木の学び舎 (doboku-lab). All rights reserved.
        </p>
      </section>
    </div>
  );
}
