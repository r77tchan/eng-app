export function LoadingView() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-1 w-24 overflow-hidden rounded-full bg-bg-secondary"
          aria-hidden="true"
        >
          <div className="h-full w-1/3 animate-pulse bg-ink" />
        </div>
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
          Loading questions
        </p>
      </div>
    </main>
  );
}
