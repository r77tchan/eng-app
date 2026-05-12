import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export function StartSessionCTA() {
  return (
    <section className="relative z-10 flex flex-col items-stretch gap-3 px-6 pb-10">
      <Link
        href="/session"
        aria-label="学習を始める"
        className="group relative flex w-full items-center justify-between rounded-lg bg-primary px-6 py-5 text-left font-semibold text-white shadow-md transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.985] active:bg-primary-hover"
        style={{ minHeight: 56 }}
      >
        <span className="flex flex-col leading-tight">
          <span className="font-mono text-[10px] tracking-[0.22em] text-white/60 uppercase">
            Start session
          </span>
          <span className="mt-0.5 text-lg">学習を始める</span>
        </span>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <ArrowRightIcon />
        </span>
      </Link>
      <p className="text-center font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">
        Tap to begin · 5問1セット
      </p>
    </section>
  );
}
