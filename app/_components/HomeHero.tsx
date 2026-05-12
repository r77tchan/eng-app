type Stat = {
  label: string;
  value: string;
};

const STATS: Stat[] = [
  { label: "Set", value: "5Q" },
  { label: "Time", value: "~90s" },
  { label: "Hands", value: "01" },
];

export function HomeHero() {
  return (
    <section className="relative z-10 flex flex-1 flex-col justify-center px-6 pt-6">
      <p className="font-mono text-[11px] tracking-[0.24em] text-ink-muted uppercase">
        5 questions / 1 session
      </p>
      <h1 className="mt-3 text-[44px] leading-[1.05] font-bold tracking-[-0.02em] text-ink">
        移動時間を、
        <br />
        <span className="relative inline-block">
          <span className="relative z-10">英語の時間</span>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-1 z-0 h-3 bg-accent/15"
          />
        </span>
        に。
      </h1>
      <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
        1セッション約90秒。電車1区間で1サイクルが完結する、
        片手専用の英単語ドリル。
      </p>

      <div className="mt-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase">
          <span className="text-ink">03</span>
          <span className="mx-1.5">/</span>
          Format
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-ink/90 pt-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">
                {stat.label}
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
