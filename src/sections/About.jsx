import { Lightbulb, Camera, Rocket, Palette, Users } from "lucide-react";

const highlights = [
    {
        icon: Lightbulb,
        title: "Reusable AI Prompts",
        description:
            "Carefully written AI prompts that users can directly reuse or customize to generate their own images."
    },
    {
        icon: Camera,
        title: "Photo & Image Generation",
        description:
            "Prompts designed for realistic portraits, creative scenes, social media visuals, and artistic concepts."
    },
    {
        icon: Rocket,
        title: "Optimized Results",
        description:
            "Each prompt is structured to help users achieve consistent, high-quality results across AI image tools."
    },
    {
        icon: Palette,
        title: "Creative Exploration",
        description:
            "Encouraging experimentation with styles, lighting, moods, and compositions through prompt engineering."
    },
    {
        icon: Users,
        title: "Creator-Friendly",
        description:
            "Built for creators, designers, and anyone exploring AI-powered image generation."
    }
];

export const About = () => {
    return (
        <section id="about" className="py-32 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT CONTENT */}
                    <div className="space-y-8">
                        <span className="text-secondary-foreground text-sm font-medium tracking-wider uppercase">
                            About This Website
                        </span>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight text-secondary-foreground">
                            AI prompts that help you
                            <span className="block font-serif italic font-normal text-white">
                                generate your own images
                            </span>
                        </h2>

                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                This website is a curated collection of AI image generation prompts
                                created to help users produce high-quality photos and visuals using
                                modern AI tools. Instead of guessing what works, visitors can reuse
                                proven prompts or adapt them to match their own creative ideas.
                            </p>

                            <p>
                                Each prompt is written with attention to detail, structure, and clarity,
                                making it easier to achieve realistic results, artistic styles, or
                                specific visual moods. These prompts can be used for portraits,
                                conceptual artwork, social media content, or creative experimentation.
                            </p>

                            <p>
                                The goal of this platform is to make AI image generation more accessible
                                by focusing on prompt quality. Whether you are a beginner or an
                                experienced creator, these prompts are designed to save time and help
                                you get better results faster.
                            </p>

                            <p>
                                Users are encouraged to experiment, customize prompts, and explore
                                different creative directions while using this site as a starting point
                                for their own AI-generated visuals.
                            </p>
                        </div>

                        <div className="glass rounded-2xl p-6 glow-border">
                            <p className="text-lg font-medium italic text-foreground">
                                “The aim is to provide clear, reusable AI prompts that empower users to
                                create their own images with confidence and creative freedom.”
                            </p>
                        </div>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        {highlights.map((item, idx) => (
                            <div key={idx} className="glass p-6 rounded-2xl">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};
