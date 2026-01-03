import { Navbar } from "@/layout/Navbar";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { MyDetails } from "@/sections/MyDetails";
import { Contact } from "@/sections/Contact";

export const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <MyDetails />
        <Contact />
      </main>
    </>
  );
};
