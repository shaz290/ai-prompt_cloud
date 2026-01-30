import { Navbar } from "@/layout/Navbar";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { MyDetails } from "@/sections/MyDetails/MyDetails";
import Contact from "@/sections/Contact";
import { Footer } from "@/layout/Footer";

export const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MyDetails />
        <About />
        <Contact />
      </main>
      {/* <Footer /> */}
    </>
  );
};
