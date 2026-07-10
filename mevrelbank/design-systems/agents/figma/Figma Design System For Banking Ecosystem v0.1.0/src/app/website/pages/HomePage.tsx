import { Navbar }     from "../components/Navbar";
import { Hero }       from "../components/Hero";
import { TrustBar }   from "../components/TrustBar";
import { Features }   from "../components/Features";
import { AppPreview } from "../components/AppPreview";
import { CoreSections } from "../components/CoreSections";
import { BusinessModel } from "../components/BusinessModel";
import { CTA }        from "../components/CTA";
import { Footer }     from "../components/Footer";
import { PageMeta }   from "../components/PageMeta";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="MevrelBank — Smarter Banking for a Modern Life"
        description="MevrelBank brings clarity, speed, and intelligence to your finances. A modern digital banking platform built for the way you live."
      />
      <Navbar />
      <main id="main-content">
        <Hero />
        <TrustBar />
        <Features />
        <AppPreview />
        <CoreSections />
        <BusinessModel />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
