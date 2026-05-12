import type { MetadataRoute } from "next";

// `output: 'export'` (静的書き出し) と整合させるため、
// このメタデータルートをビルド時に 1 度だけ評価し、
// `out/manifest.webmanifest` として書き出す。
export const dynamic = "force-static";

/**
 * Web App Manifest (PWA)
 *
 * Sprint 5: ホーム画面追加とスタンドアロン起動に対応する。
 *
 * - GitHub Pages のサブパス配信に対応するため、`start_url` / `scope` /
 *   `icons[].src` には `NEXT_PUBLIC_BASE_PATH` をプレフィックスとして付与する
 * - 192x192 と 512x512 の 2 サイズ + maskable バリアントを同梱
 * - `display: standalone` を指定し、ホーム画面アイコンからの起動時に
 *   ブラウザのアドレスバーを非表示にする
 *
 * 静的書き出し (`output: 'export'`) の下では `manifest.webmanifest` という
 * ファイルとして `out/` に生成される (Next.js 16 の MetadataRoute による)。
 */

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath =
  rawBasePath && !rawBasePath.startsWith("/") ? `/${rawBasePath}` : rawBasePath;

function withBasePath(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${basePath}${path}`;
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommuteEnglish — 通勤英語",
    short_name: "Commute EN",
    description:
      "通勤中の隙間時間で英単語を1セッションずつ学べる学習WEBアプリ",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "ja",
    categories: ["education", "productivity"],
    icons: [
      {
        src: withBasePath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/icon-192-maskable.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/icons/icon-512-maskable.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
