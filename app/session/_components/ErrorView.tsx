import Link from "next/link";

type Props = {
  message: string;
};

export function ErrorView({ message }: Props) {
  return (
    <main className="flex min-h-screen w-full flex-col px-6">
      <header className="pt-6 pb-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-error uppercase">
          Error
        </p>
      </header>
      <div className="flex-1" />
      <div className="pb-10">
        <p className="mb-6 text-center text-base text-error">
          {message || "問題を読み込めませんでした"}
        </p>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-lg border border-ink px-6 py-4 text-center text-base font-semibold text-ink active:scale-[0.985]"
          style={{ minHeight: 48 }}
        >
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}
