import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./_components/BottomNav";
import { ThemeApplier } from "./_components/ThemeApplier";
import { RegisterServiceWorker } from "./_components/RegisterServiceWorker";

// デザイントークン (--font-sans / --font-mono) に従い Inter + JetBrains Mono を採用
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

// `metadata.icons` の値は basePath を尊重するため、環境変数から動的に組み立てる。
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath =
  rawBasePath && !rawBasePath.startsWith("/") ? `/${rawBasePath}` : rawBasePath;
const withBp = (p: string) => `${basePath}${p.startsWith("/") ? p : `/${p}`}`;

export const metadata: Metadata = {
  title: "CommuteEnglish",
  description: "通勤中の隙間時間で英単語を1セッションずつ学べる学習WEBアプリ",
  applicationName: "CommuteEnglish",
  // PWA / ホーム画面追加用のアイコンと iOS Safari 用 apple-touch-icon
  icons: {
    icon: [
      { url: withBp("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: withBp("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: withBp("/icons/icon-192.png"), sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    title: "Commute EN",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ユーザーの拡大は妨げない (アクセシビリティのため)
  maximumScale: 5,
  // ライト時 / ダーク時の status bar 色をそれぞれ指定
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-bg text-ink">
        {/* テーマ反映 (描画なし) */}
        <ThemeApplier />
        {/* Service Worker 登録 (描画なし) */}
        <RegisterServiceWorker />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
