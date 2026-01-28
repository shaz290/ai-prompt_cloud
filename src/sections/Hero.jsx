import {
  ArrowRight,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";

export const Hero = () => {
  const scrollToContact = () => {
    const contactSection = document.querySelector("#contact");
    const navbar = document.querySelector("header");
    const navbarHeight = navbar?.offsetHeight || 80;

    if (!contactSection) return;

    const top =
      contactSection.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight -
      16;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  };

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

      {/* Content */}
      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT CONTENT */}
          <div className="space-y-8">            {/* ROLE TAG */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              AI Prompt Expert & Content Creator
            </span>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              The master <span className="text-primary">AI</span>
              <br />
              expert with
              <br />
              <span className="font-serif italic font-normal text-white">
                Generating Pics and Videos
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Hi, I’m Ahsan — AI Visual Expert. I create scroll-stopping images and
              videos for social platforms.
            </p>

            {/* CONTACT BUTTON */}
            <div className="flex gap-4">
              <button
                onClick={scrollToContact}
                className="
                  group inline-flex items-center gap-3
                  px-8 py-4 rounded-2xl
                  bg-primary text-white font-semibold
                  shadow-lg shadow-primary/30
                  hover:shadow-primary/50 hover:scale-[1.03]
                  active:scale-95
                  transition-all duration-300
                "
              >
                <span>Contact Me</span>
                <ArrowRight
                  className="
                    w-5 h-5
                    transition-transform duration-300
                    group-hover:translate-x-1
                  "
                />
              </button>
            </div>

            {/* SOCIAL ICONS */}
            <div className="flex gap-4 pt-2">
              {[
                {
                  Icon: Instagram,
                  link: "https://www.instagram.com/af4ash?igsh=MXI1M2h1bWFvYTZkbA==",
                },
                { Icon: Facebook, link: "#" },
                { Icon: Youtube, link: "#" },
                { Icon: Twitter, link: "#" },
              ].map(({ Icon, link }, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full glass hover:text-primary transition"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative">
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
