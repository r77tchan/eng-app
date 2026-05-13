import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowRightIcon({
  width = 16,
  height = 16,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M3 8h10" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  );
}

export function CheckIcon({
  width = 14,
  height = 14,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  );
}

export function XIcon({
  width = 14,
  height = 14,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function HomeIcon({
  width = 18,
  height = 18,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9z" />
    </svg>
  );
}

export function HistoryIcon({
  width = 18,
  height = 18,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M3 10a7 7 0 1 0 2.05-4.95" />
      <path d="M3 4v3h3" />
      <path d="M10 6v5l3 2" />
    </svg>
  );
}

export function SettingsIcon({
  width = 18,
  height = 18,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <circle cx="10" cy="10" r="2.4" />
      <path d="M10 1.5v2.4M10 16.1v2.4M2.6 5.7l2.1 1.2M15.3 13.1l2.1 1.2M1.5 10h2.4M16.1 10h2.4M2.6 14.3l2.1-1.2M15.3 6.9l2.1-1.2" />
    </svg>
  );
}

export function RefreshIcon({
  width = 14,
  height = 14,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M14 8a6 6 0 11-1.76-4.24" />
      <path d="M14 2v4h-4" />
    </svg>
  );
}

/**
 * Sprint 9: ダウンロード矢印 (トレイへ向かう矢印)。
 * 「オフライン用にダウンロード」のプライマリ CTA に使う。
 */
export function DownloadIcon({
  width = 16,
  height = 16,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M8 2v8" />
      <path d="M4.5 7l3.5 3.5L11.5 7" />
      <path d="M2.5 13h11" />
    </svg>
  );
}

/**
 * Sprint 9: エラー表示用の三角警告アイコン。
 * `--color-error` と組み合わせて使う。
 */
export function AlertIcon({
  width = 14,
  height = 14,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M8 2L1.5 13.5h13L8 2z" />
      <path d="M8 6.5v3" />
      <path d="M8 11.5v.01" />
    </svg>
  );
}

/**
 * Sprint 9: ゴミ箱 (キャッシュ削除) アイコン。
 */
export function TrashIcon({
  width = 14,
  height = 14,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M2.5 4.5h11" />
      <path d="M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
      <path d="M4 4.5l.75 8.5a1 1 0 0 0 1 .9h4.5a1 1 0 0 0 1-.9L12 4.5" />
      <path d="M6.5 7.5v3.5" />
      <path d="M9.5 7.5v3.5" />
    </svg>
  );
}

/**
 * Sprint 9: 完了円形バッジ用の太いチェック (CheckIcon と区別)。
 * 円形 success バッジ内に大きく置くために、bold な stroke を使う。
 */
export function CheckBoldIcon({
  width = 18,
  height = 18,
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M4 10.5l4 4 8-8.5" />
    </svg>
  );
}
