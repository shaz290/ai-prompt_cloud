import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiOpenai, SiGoogle, SiPerplexity } from "react-icons/si";

const FILTERS = ["all", "men", "women", "kids", "other"];
const PAGE_SIZE = 6;

export const MyDetails = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [activeIndex, setActiveIndex] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchDetails();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchTerm]);

  const fetchDetails = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("descriptions")
      .select(`
        id,
        image_type,
        description_details,
        image_urls ( image_url )
      `)
      .order("created_on", { ascending: false });

    if (!error) setData(data);
    else console.error(error);

    setLoading(false);
  };

  /* ---------- FILTER ---------- */
  let filteredData =
    selectedType === "all"
      ? data
      : data.filter(
          (item) => item.image_type?.toLowerCase() === selectedType
        );

  /* ---------- SEARCH ---------- */
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filteredData = filteredData.filter((item) =>
      item.id.toString().includes(term)
    );
  }

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* ---------- SLIDER ---------- */
  const nextImage = (id, length) => {
    setActiveIndex((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % length,
    }));
  };

  const prevImage = (id, length) => {
    setActiveIndex((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) === 0 ? length - 1 : prev[id] - 1,
    }));
  };

  /* ---------- TOAST ---------- */
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 1500);
  };

  /* ---------- COPY ---------- */
  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  /* ---------- AI OPENERS ---------- */
  const openWithChatGPT = async (text) => {
    await navigator.clipboard.writeText(text);
    window.open("https://chat.openai.com/", "_blank");
    showToast("Copied & opened ChatGPT");
  };

  const openWithGemini = (text) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://gemini.google.com/app?q=${encoded}`, "_blank");
    showToast("Opened in Gemini");
  };

  const openWithPerplexity = (text) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://www.perplexity.ai/?q=${encoded}`, "_blank");
    showToast("Opened in Perplexity");
  };

  if (loading) {
    return (
      <section className="py-32 text-center">
        <p className="text-muted-foreground">Loading details...</p>
      </section>
    );
  }

  return (
    <section id="mydetails" className="py-32 bg-background relative">
      <div className="container mx-auto px-6">

        {/* CENTER TOAST */}
        {toastMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-3 rounded-xl bg-black/80 text-white text-sm font-medium backdrop-blur">
              {toastMessage}
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            My <span className="font-serif italic">Creations</span>
          </h2>
          <p className="text-muted-foreground">
            Browse AI-generated visuals
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          {FILTERS.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-6 py-2 rounded-full text-sm font-medium
                ${
                  selectedType === type
                    ? "bg-primary text-white"
                    : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* SEARCH */}
        <div className="max-w-md mx-auto mb-16">
          <input
            type="text"
            placeholder="Search by description ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
          {paginatedData.map((item) => {
            const images = item.image_urls || [];
            const currentIndex = activeIndex[item.id] || 0;

            return (
              <div key={item.id} className="flex flex-col space-y-4">

                {/* IMAGE */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-3xl" />
                  <div className="relative glass rounded-3xl p-2 glow-border">
                    <img
                      src={images[currentIndex]?.image_url}
                      alt="generated"
                      className="w-full aspect-[4/5] object-cover rounded-2xl"
                    />

                    {images.length > 1 && (
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
                        <button
                          onClick={() => prevImage(item.id, images.length)}
                          className="p-2 rounded-full glass"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <button
                          onClick={() => nextImage(item.id, images.length)}
                          className="p-2 rounded-full glass"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="glass rounded-2xl border border-border h-40 overflow-hidden">
                  <div className="p-5 h-full">
                    <p className="text-sm text-muted-foreground leading-relaxed h-full overflow-y-auto">
                      {item.description_details}
                    </p>
                  </div>
                </div>

                {/* COPY */}
                <button
                  onClick={() => handleCopy(item.description_details)}
                  className="w-full py-2.5 text-sm font-medium rounded-xl
                             bg-primary text-white hover:opacity-90 transition"
                >
                  Copy
                </button>

                {/* AI ICONS */}
                <div className="flex justify-center gap-6 pt-1">
                  <SiGoogle
                    title="Open in Gemini"
                    onClick={() => openWithGemini(item.description_details)}
                    className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition"
                  />
                  <SiOpenai
                    title="Open in ChatGPT"
                    onClick={() => openWithChatGPT(item.description_details)}
                    className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition"
                  />
                  <SiPerplexity
                    title="Open in Perplexity"
                    onClick={() => openWithPerplexity(item.description_details)}
                    className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-20">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg text-sm
                  ${
                    currentPage === i + 1
                      ? "bg-primary text-white"
                      : "bg-surface text-muted-foreground"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
