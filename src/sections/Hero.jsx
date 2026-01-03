import { ArrowRight, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/Button";
import { AnimatedBorderButton } from "@/components/AnimatedBorderButton";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/hero-bg.jpg"
          alt="hero background"
          className="w-full h-full object-cover opacity-40"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />

      {/* Floating Dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full opacity-60"
            style={{
              backgroundColor: "#20B2A6",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `slow-drift ${15 + Math.random() * 20}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary animate-fade-in">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              AI Prompt Expert & Content Creator
            </span>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight animate-fade-in animation-delay-100">
              The master <span className="text-primary glow-text">AI</span>
              <br />
              expert with
              <br />
              <span className="font-serif italic font-normal text-white">
                Generating Pics and Videos
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg animate-fade-in animation-delay-200">
              Hi, I’m Ahsan — AI Visual Expert. I create scroll-stopping images and
              videos for social platforms.
            </p>

            {/* Buttons */}
            <div className="flex gap-4 animate-fade-in animation-delay-300">
              <Button size="lg">
                Contact Me <ArrowRight className="w-5 h-5" />
              </Button>
              <AnimatedBorderButton>Download PDF</AnimatedBorderButton>
            </div>

            {/* Social */}
            <div className="flex gap-4 animate-fade-in animation-delay-400">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="p-2 rounded-full glass hover:text-primary"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-fade-in animation-delay-300">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
            <div className="relative glass rounded-3xl p-2 glow-border">
              <img
                src="/profile-photo.jpeg"
                alt="Profile"
                className="w-full aspect-[4/5] object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
