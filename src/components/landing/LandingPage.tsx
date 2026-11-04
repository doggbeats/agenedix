"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { HowItWorks } from "./components/HowItWorks";
import { LiveBookingSimulator } from "./components/LiveBookingSimulator";
import { NicheShowcase } from "./components/NicheShowcase";
import { RoiCalculator } from "./components/RoiCalculator";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { PricingSection } from "./components/PricingSection";
import { FaqSection } from "./components/FaqSection";
import { CtaBanner } from "./components/CtaBanner";
import { Footer } from "./components/Footer";
import type { PricingPlan } from "./types";

export function LandingPage({ plans }: { plans?: PricingPlan[] }) {
  const router = useRouter();

  const openSignup = (planSlug?: string) => {
    router.push(planSlug ? `/cadastro?plano=${encodeURIComponent(planSlug)}` : "/cadastro");
  };

  const openTeamLogin = () => {
    router.push("/login");
  };

  const openBookingDemo = () => {
    const el = document.getElementById("demonstracao");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const openAgendaDirectory = () => {
    router.push("/agendar");
  };

  return (
    <div className="landing-scope flex min-h-screen flex-col bg-white">
      <Navbar
        onOpenSignup={openSignup}
        onOpenTeamLogin={openTeamLogin}
        onOpenBookingDemo={openAgendaDirectory}
      />

      <main className="flex-1">
        <HeroSection onOpenSignup={openSignup} onOpenBookingModal={openAgendaDirectory} />

        <FeaturesGrid onOpenBookingDemo={openBookingDemo} />

        <HowItWorks />

        <LiveBookingSimulator />

        <NicheShowcase onOpenSignup={openSignup} />

        <RoiCalculator onOpenSignup={openSignup} />

        <PricingSection plans={plans} />

        <TestimonialsSection />

        <FaqSection />

        <CtaBanner onOpenSignup={openSignup} onOpenBookingDemo={openBookingDemo} />
      </main>

      <Footer
        onOpenSignup={openSignup}
        onOpenTeamLogin={openTeamLogin}
        onOpenBookingDemo={openAgendaDirectory}
      />
    </div>
  );
}

export default LandingPage;
