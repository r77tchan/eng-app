import { AppBrandHeader } from "./_components/AppBrandHeader";
import { DashboardStats } from "./_components/DashboardStats";
import { HomeHero } from "./_components/HomeHero";
import { ReviewQueueStat } from "./_components/ReviewQueueStat";
import { StartSessionCTA } from "./_components/StartSessionCTA";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden pb-24">
      <div
        className="bg-dotgrid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <AppBrandHeader />
      <DashboardStats />
      <ReviewQueueStat />
      <HomeHero />
      <StartSessionCTA />
    </main>
  );
}
