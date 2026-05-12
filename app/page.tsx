import { AppBrandHeader } from "./_components/AppBrandHeader";
import { HomeHero } from "./_components/HomeHero";
import { StartSessionCTA } from "./_components/StartSessionCTA";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <div
        className="bg-dotgrid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <AppBrandHeader />
      <HomeHero />
      <StartSessionCTA />
    </main>
  );
}
