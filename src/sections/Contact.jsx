import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/Button";
import { useState } from "react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "aipromptweb@gmail.com",
    href: "mailto:aipromptweb@gmail.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "India",
    href: "#",
  },
];

export const Contact = () => {
  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    const formData = new FormData(e.target);

    try {
      const res = await fetch(
        "https://formsubmit.co/ajax/aipromptweb@gmail.com",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
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
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-highlight/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
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

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="glass p-8 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Anti-spam */}
              <input type="text" name="_honey" style={{ display: "none" }} />

              {/* Improve deliverability */}
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_subject" value="New Website Contact" />

              {/* THIS IS CRITICAL */}
              <input type="hidden" name="_replyto" value="%email%" />

              <div>
                <label className="block text-sm mb-2">Name</label>
                <input
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl border border-border focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl border border-border focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-surface rounded-xl border border-border focus:border-primary outline-none resize-none"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : <>Send Message <Send className="w-5 h-5" /></>}
              </Button>

              {status === "success" && (
                <div className="flex gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Message sent successfully!
                </div>
              )}

              {status === "error" && (
                <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  Failed to send message.
                </div>
              )}
            </form>
          </div>

          <div className="glass rounded-3xl p-8">
            <h3 className="text-xl font-semibold mb-6">
              Contact Information
            </h3>

            <div className="space-y-4">
              {contactInfo.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="font-medium">{item.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
