import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/sections/Hero";
import Features from "../../components/sections/Features";
import HowItWorks from "../../components/sections/HowItWorks";
import CTA from "../../components/sections/CTA";
import Footer from "../../components/layout/Footer";

const Landing = () => {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;