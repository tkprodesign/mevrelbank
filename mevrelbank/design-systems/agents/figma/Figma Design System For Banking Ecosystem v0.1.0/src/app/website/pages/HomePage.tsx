import { Navbar }     from "../components/Navbar";
import { Hero }       from "../components/Hero";
import { TrustBar }   from "../components/TrustBar";
import { Features }   from "../components/Features";
import { AppPreview } from "../components/AppPreview";
import { CoreSections } from "../components/CoreSections";
import { BusinessModel } from "../components/BusinessModel";
import { CTA }        from "../components/CTA";
import { Footer }     from "../components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
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
