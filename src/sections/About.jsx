
import { Palette, Camera, Rocket, Lightbulb, Users } from "lucide-react";


const highlights = [
    {
        icon: Palette,
        title: "AI-Powered Art",
        description: "Creating stunning AI-generated images using the latest tools and creative prompts."
    },
    {
        icon: Camera,
        title: "Daily Content",
        description: "Consistently posting fresh images and creative content every day."
    },
    {
        icon: Rocket,
        title: "High-Quality Visuals",
        description: "High-resolution, social-media-ready images perfect for reels, posts, and thumbnails."
    },
    {
        icon: Lightbulb,
        title: "Custom Prompts",
        description: "Well-crafted AI prompts to achieve detailed, realistic, and artistic results."
    },
    {
        icon: Users,
        title: "Collaboration",
        description: "Open to collaborations with brands, creators, and digital artists."
    }
];


export const About = () => {
    return (
        <section id="about" className="py-32 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left column */}
                    <div className="space-y-8">
                        <div className="animate-fade-in">
                            <span className="text-secondary-foreground text-sm font-medium tracking-wider uppercase">
                                About Me
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight animate-fade-in animation-delay-100 text-secondary-foreground">
                            Building the future,
                            <span className="block font-serif italic font-normal text-white">
                                One Picture at a time
                            </span>
                        </h2>

                        <div className="space-y-4 text-muted-foreground animate-fade-in animation delay-200">
                            <p>
                                I’m a digital content creator who brings ideas to life through AI-generated visuals.
                                By combining creativity with modern AI tools, I create unique, high-quality images
                                that are designed to capture attention and tell a story. Each piece is crafted with a focus on detail,
                                mood, and originality, making every image feel intentional and visually engaging.
                            </p>
                            <p>
                                My work is driven by consistency, experimentation, and a passion for visual storytelling.
                                I enjoy exploring new styles, refining prompts,
                                and pushing creative boundaries to deliver content that stands out across digital platforms.
                                Open to collaborations with brands and fellow creators, I aim to build visuals that inspire, connect, and leave a lasting impression.
                            </p>
                        </div>

                        <div className="glass rounded-2xl p-6 glow-border animate-fade-in animation-delay-300">
                            <p className="text-lg font-medium italic text-foreground ">
                                "My mission is to create visually powerful AI-generated content that inspires, engages,
                                and helps ideas come to life through creativity and technology."
                            </p>
                        </div>
                    </div>

                    {/* Right column (placeholder for cards / image / highlights) */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        {highlights.map((item, idx) => (
                            <div key={idx} className="glass p-6 rounded-2xl animate-fade-in"
                                style={{ animationDelay: `${(idx + 1) * 100}ms` }}>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 hover:bg-primary/20">
                                    <item.icon className="w-6 h-6 text-primary"/>
                                </div>
                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};
