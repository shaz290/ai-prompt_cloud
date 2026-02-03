import {
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/Button";
import { useState } from "react";

const Contact = () => {
  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);

  // ✅ Detect if user came from shared URL
  const isSharedUser =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("share");

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "theahsanw@gmail.com",
      href: "mailto:theahsanw@gmail.com",
    },
    {
      icon: Phone,
      label: "Phone",
      value: isSharedUser ? "##########" : "+91 70089 71654",
      href: isSharedUser ? "#" : "tel:+917008971654",
      disabled: isSharedUser,
    },
    {
      icon: MapPin,
      label: "Location",
      value: "India",
      href: "#",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    const formData = new FormData(e.target);

    try {
      const res = await fetch(
        "https://formsubmit.co/ajax/theahsanw@gmail.com",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success === "true") {
        setStatus("success");
        e.target.reset();
      } else {
        throw new Error("Submission failed");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-32 relative overflow-hidden scroll-mt-32"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-highlight/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-secondary-foreground text-sm font-medium uppercase">
            Contact
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Contact <span className="font-serif italic">Me</span>
          </h2>
          <p className="text-muted-foreground">
            Have a project or idea? Send me a message.
          </p>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* FORM */}
          <div className="glass p-8 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" name="_honey" hidden />
              <input type="hidden" name="_captcha" value="false" />

              <input
                name="name"
                placeholder="Name"
                required
                className="w-full px-4 py-3 bg-surface rounded-xl border"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-surface rounded-xl border"
              />

              <textarea
                name="message"
                rows={5}
                placeholder="Message"
                required
                className="w-full px-4 py-3 bg-surface rounded-xl border resize-none"
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </Button>

              {status === "success" && (
                <div className="text-green-400 flex gap-2">
                  <CheckCircle /> Message sent successfully
                </div>
              )}

              {status === "error" && (
                <div className="text-red-400 flex gap-2">
                  <AlertCircle /> Failed to send message
                </div>
              )}
            </form>
          </div>

          {/* INFO */}
          <div className="glass p-8 rounded-3xl space-y-4">
            {contactInfo.map((item, i) => (
              <a
                key={i}
                href={item.href}
                onClick={
                  item.disabled ? (e) => e.preventDefault() : undefined
                }
                className={`flex gap-4 items-center p-4 rounded-xl hover:bg-surface ${item.disabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.value}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
