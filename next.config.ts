import type { NextConfig } from "next";

// GitHub Pages のサブパス配信を想定。
// 環境変数 NEXT_PUBLIC_BASE_PATH（例: "/eng-app"）を設定するとサブパスでビルドされる。
// 未設定（ローカル開発や独自ドメインのルート配信）の場合は basePath なしで動作する。
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = rawBasePath && !rawBasePath.startsWith("/") ? `/${rawBasePath}` : rawBasePath;

const nextConfig: NextConfig = {
  // 静的書き出し (GitHub Pages 等の静的ホスティング向け)
  output: "export",

  // ディレクトリ形式で配信したいので末尾スラッシュを付与
  // (GitHub Pages は /foo/ -> /foo/index.html を解決するためこの方が安全)
  trailingSlash: true,

  // サブパス配信対応
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,

  // 静的書き出しでは next/image のデフォルト最適化が使えないため無効化
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
