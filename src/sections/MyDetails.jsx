import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { SiOpenai, SiGoogle, SiPerplexity } from "react-icons/si";

const PAGE_SIZE = 7;
const FILTERS = ["all", "men", "women", "kids", "other"];

/* ---------- SHARE PARAM ---------- */
const getShareIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("share");
};

/* ---------- DATE FORMATTER ---------- */
const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();
};

/* ---------- CLOUDINARY IMAGE ID ---------- */
const extractCloudinaryImageId = (url) => {
  return url?.split("/")?.[4];
};

export const MyDetails = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const [sharedId, setSharedId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeFilter, setActiveFilter] = useState("all");

  const cardRefs = useRef({});

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    const id = getShareIdFromUrl();
    if (id) setSharedId(id);
    checkAuth();
    fetchDetails();
  }, []);

  /* ---------- AUTH CHECK ---------- */
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    setIsAdmin(profile?.role === "admin");
    setCheckingAuth(false);
  };

  /* ---------- FETCH ---------- */
  const fetchDetails = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("descriptions")
      .select(`
        id,
        image_name,
        image_type,
        description_details,
        priority,
        created_on,
        image_urls ( image_url )
      `)
      .order("created_on", { ascending: false });

    if (!error) setData(data || []);
    setLoading(false);
  };

  /* ---------- DELETE ---------- */
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this?\nThis cannot be undone."
    );

    if (!confirmed) return;

    try {
      await supabase.from("descriptions").delete().eq("id", item.id);

      const imageIds =
        item.image_urls
          ?.map((img) => extractCloudinaryImageId(img.image_url))
          .filter(Boolean) || [];

      if (imageIds.length > 0) {
        await fetch("/api/delete-cloudflare-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageIds }),
        });
      }

      setData((prev) => prev.filter((d) => d.id !== item.id));
      showToast("Deleted successfully");
    } catch (err) {
      console.error(err);
      showToast("Delete failed");
    }
  };

  /* ---------- ACCESS CONTROL ---------- */
  if (!checkingAuth && !isAdmin && !sharedId) {
    return (
      <section className="py-32 text-center">
        <h2 className="text-2xl font-bold">Access Restricted 🔒</h2>
        <p className="text-muted-foreground mt-2">
          You can only view shared links.
        </p>
      </section>
    );
  }

  /* ---------- FILTER LOGIC ---------- */
  const filteredData = (() => {
    let result = data;

    // Shared link overrides everything
    if (sharedId) {
      return result.filter((item) => item.id.toString() === sharedId);
    }

    // Admin category filter
    if (isAdmin && activeFilter !== "all") {
      result = result.filter(
        (item) => item.image_type === activeFilter
      );
    }

    return result;
  })();

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const paginatedData =
    sharedId || !isAdmin
      ? filteredData
      : filteredData.slice(
          (currentPage - 1) * PAGE_SIZE,
          currentPage * PAGE_SIZE
        );

  /* ---------- TOAST ---------- */
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 1500);
  };

  if (loading) {
    return (
      <section className="py-32 text-center">
        <p>Loading details...</p>
      </section>
    );
  }

  return (
    <section id="mydetails" className="py-32">
      <div className="container mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            My <span className="font-serif italic">Creations</span>
          </h2>
          <p className="text-muted-foreground">
            Browse AI-generated visuals
          </p>
        </div>

        {/* FILTERS (ADMIN ONLY) */}
        {isAdmin && !sharedId && (
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm capitalize transition ${
                  activeFilter === filter
                    ? "bg-primary text-white"
                    : "border text-muted-foreground hover:bg-surface"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* TOAST */}
        {toastMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="px-6 py-3 bg-black text-white rounded-xl">
              {toastMessage}
            </div>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
          {paginatedData.map((item) => {
            const images = item.image_urls || [];
            const index = activeIndex[item.id] || 0;

            return (
              <div
                key={item.id}
                ref={(el) => (cardRefs.current[item.id] = el)}
                className="flex flex-col h-full space-y-4"
              >
                {/* IMAGE */}
                <img
                  src={images[index]?.image_url}
                  className="w-full aspect-[4/5] object-cover rounded-2xl"
                  alt={item.image_name}
                />

                {/* META */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  {/* <span>{item.image_type?.toUpperCase()}</span> */}
                  <span>{formatDate(item.created_on)}</span>
                </div>

                {/* DESCRIPTION */}
                <div className="description-scroll h-[96px] text-sm text-muted-foreground pr-1">
                  {item.description_details}
                </div>

                {/* ACTIONS */}
                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.description_details);
                      showToast("Copied to clipboard");
                    }}
                    className="w-full py-2 bg-primary text-white rounded-xl"
                  >
                    Copy
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}?share=${item.id}`
                      );
                      showToast("Sharable link copied");
                    }}
                    className="w-full py-2 border rounded-xl"
                  >
                    Share Link
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item)}
                      className="w-full py-2 border border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"
                    >
                      Delete
                    </button>
                  )}

                  <div className="flex justify-center gap-6 pt-2">
                    <SiGoogle
                      className="cursor-pointer"
                      onClick={() =>
                        window.open(
                          `https://gemini.google.com/app?q=${encodeURIComponent(
                            item.description_details
                          )}`,
                          "_blank"
                        )
                      }
                    />
                    <SiOpenai
                      className="cursor-pointer"
                      onClick={() =>
                        window.open("https://chat.openai.com/", "_blank")
                      }
                    />
                    <SiPerplexity
                      className="cursor-pointer"
                      onClick={() =>
                        window.open(
                          `https://www.perplexity.ai/?q=${encodeURIComponent(
                            item.description_details
                          )}`,
                          "_blank"
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {isAdmin && !sharedId && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-16">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg text-sm ${
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
