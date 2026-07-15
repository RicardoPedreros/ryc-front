import { Navbar } from "@/presentation/components/home/Navbar";
import { Hero } from "@/presentation/components/home/Hero";
import { PreviewMockup } from "@/presentation/components/home/PreviewMockup";
import { Features } from "@/presentation/components/home/Features";
import { HowItWorks } from "@/presentation/components/home/HowItWorks";
import { CallToAction } from "@/presentation/components/home/CallToAction";
import { Footer } from "@/presentation/components/home/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PreviewMockup />
        <Features />
        <HowItWorks />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
