import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface WipNoticeBannerProps {
  showDisclaimerLink?: boolean;
  onOpenDisclaimer?: () => void;
}

export const WipNoticeBanner: React.FC<WipNoticeBannerProps> = ({
  showDisclaimerLink = true,
  onOpenDisclaimer,
}) => {
  return (
    <aside
      aria-label="開発中および内容の正確性に関する重要なお知らせ"
      className="app-notice-banner rounded-xl px-4 py-3 mb-5 text-xs sm:text-sm leading-relaxed"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 shrink-0 mt-0.5 app-notice-accent"
          aria-hidden="true"
        />
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="app-notice-badge inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wide">
              開発中（WIP）
            </span>
            <strong className="font-bold">
              現在開発中のため、掲載内容・計算結果には多くの間違いが存在します
            </strong>
          </div>
          <p className="text-xs sm:text-sm">
            本サイトは制作途上であり、解説文・数式・計算ロジック・図解・演習問題の解答に多くの誤りや未検証の記述が含まれています。学習の補助参考としてのみご利用いただき、必ず大学・高専の教科書や公的基準と照合してください（実務設計・施工・試験解答等への利用は厳禁です）。
          </p>
          {showDisclaimerLink && onOpenDisclaimer && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={onOpenDisclaimer}
                className="app-notice-accent inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 cursor-pointer py-1"
              >
                免責事項・利用上の注意を確認する
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
