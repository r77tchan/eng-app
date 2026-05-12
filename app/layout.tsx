import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "CommuteEnglish",
  description: "通勤中の隙間時間で英単語を1セッションずつ学べる学習WEBアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ユーザーの拡大は妨げない (アクセシビリティのため)
  maximumScale: 5,
  // デザイントークンの背景色 (#ffffff) に合わせる
  themeColor: "#ffffff",
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
        {children}
      </body>
    </html>
  );
}
