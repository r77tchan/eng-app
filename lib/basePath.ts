/**
 * GitHub Pages のサブパス配信に対応するための basePath ユーティリティ。
 *
 * Next.js では `next/link` を使ったページ間遷移には自動的に basePath が付与されるが、
 * `fetch('/data/foo.json')` のように public 配下のリソースへ直接アクセスする場合は
 * 手動で basePath を付与する必要がある。
 *
 * 環境変数 `NEXT_PUBLIC_BASE_PATH` は `next.config.ts` と同じ値を参照する。
 */
const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const basePath = raw && !raw.startsWith("/") ? `/${raw}` : raw;

/**
 * public 配下のリソースへのパスを basePath 込みで組み立てる。
 * 例: withBasePath('/data/questions.json') -> '/eng-app/data/questions.json'
 */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    return `${basePath}/${path}`;
  }
  return `${basePath}${path}`;
}
