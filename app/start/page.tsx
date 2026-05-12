import { StartSelectionForm } from "./_components/StartSelectionForm";

/**
 * Sprint 4: カテゴリ・難易度選択画面。
 *
 * ホームの「学習を始める」CTA からの遷移先。ここでカテゴリ・難易度を
 * (それぞれ「すべて」含む単一選択で) 決めて `/session/` に進む。
 *
 * 静的書き出し対応のため、選択値の引き渡しは sessionStorage 経由とし、
 * URL クエリ + useSearchParams (Suspense 必須) は使わない。
 */
export default function StartPage() {
  return <StartSelectionForm />;
}
