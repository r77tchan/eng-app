export function AppBrandHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full bg-accent"
        />
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
          Commute / EN
        </span>
      </div>
      <span className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
        v1.0
      </span>
    </header>
  );
}
