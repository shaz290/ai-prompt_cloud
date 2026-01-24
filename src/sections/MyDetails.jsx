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
  return new Date(date)
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
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

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const sectionRef = useRef(null);
  const firstRender = useRef(true);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    const init = async () => {
      const id = getShareIdFromUrl();
      if (id) setSharedId(id);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const admin = profile?.role === "admin";
        setIsAdmin(admin);

        if (admin || id) {
          await fetchDetails();
        }
      } else if (id) {
        await fetchDetails();
      }

      setCheckingAuth(false);
    };

    init();
  }, []);

  /* ---------- SCROLL ON PAGINATION ---------- */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentPage]);

  /* ---------- SCROLL ON SHARED ---------- */
  useEffect(() => {
    if (sharedId && !loading) {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [sharedId, loading]);

  /* ---------- AUTH CHECK ---------- */
  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setIsAdmin(false);
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const admin = profile?.role === "admin";
    setIsAdmin(admin);
    return admin;
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

  /* ---------- UPDATE ---------- */
  const handleUpdate = async (itemId) => {
    if (!editValue.trim()) {
      showToast("Description cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("descriptions")
      .update({ description_details: editValue })
      .eq("id", itemId);

    if (!error) {
      setData((prev) =>
        prev.map((d) =>
          d.id === itemId
            ? { ...d, description_details: editValue }
            : d
        )
      );
      setEditingId(null);
      setEditValue("");
      showToast("Updated successfully");
    } else {
      showToast("Update failed");
    }
  };

  /* ---------- DELETE ---------- */
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this?\nThis cannot be undone."
    );
    if (!confirmed) return;

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
  };

  /* ---------- AUTH LOADING GUARD ---------- */
  if (checkingAuth) {
    return (
      <section className="py-32 text-center">
        <p>Checking access...</p>
      </section>
    );
  }

  /* ---------- ACCESS CONTROL ---------- */
  if (!isAdmin && !sharedId) {
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

    if (sharedId) {
      return result.filter((item) => item.id.toString() === sharedId);
    }

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
    <section ref={sectionRef} id="mydetails" className="py-32">
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

        {/* FILTERS */}
        {isAdmin && !sharedId && (
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl capitalize transition ${activeFilter === filter
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
              <div key={item.id} className="flex flex-col h-full space-y-4">
                <img
                  src={images[index]?.image_url}
                  className="w-full aspect-[4/5] object-cover rounded-2xl
                  border border-blue-500/30
                  shadow-md shadow-blue-500/30
                  hover:shadow-xl hover:shadow-blue-500/60
                  hover:border-blue-500/50
                  transition-all duration-300"
                  alt={item.image_name}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatDate(item.created_on)}</span>
                </div>

                {editingId === item.id ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="description-scroll h-[96px] text-sm border rounded-xl p-2 resize-none"
                  />
                ) : (
                  <div className="description-scroll h-[96px] text-sm text-muted-foreground pr-1">
                    {item.description_details}
                  </div>
                )}

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
                    <>
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(item.id)}
                            className="w-full py-2 bg-green-600 text-white rounded-xl"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                            className="w-full py-2 border rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditValue(item.description_details);
                          }}
                          className="w-full py-2 border rounded-xl"
                        >
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item)}
                        className="w-full py-2 border border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"
                      >
                        Delete
                      </button>
                    </>
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
          <div className="flex justify-center items-center gap-2 mt-16">

            {/* FIRST */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-sm bg-surface text-muted-foreground
                 transition-all duration-200 ease-out
                 hover:bg-primary/10 hover:text-primary
                 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              First
            </button>

            {/* PREVIOUS */}
            {/* <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-sm bg-surface text-muted-foreground
                 transition-all duration-200 ease-out
                 hover:bg-primary/10 hover:text-primary
                 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button> */}

            {/* PAGE NUMBERS (MAX 3) */}
            {(() => {
              let start = Math.max(currentPage - 1, 1);
              let end = Math.min(start + 2, totalPages);

              if (end - start < 2) {
                start = Math.max(end - 2, 1);
              }

              return Array.from(
                { length: end - start + 1 },
                (_, i) => start + i
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-xl text-sm
            transition-all duration-200 ease-out
            ${currentPage === page
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                >
                  {page}
                </button>
              ));
            })()}

            {/* NEXT
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-sm bg-surface text-muted-foreground
                 transition-all duration-200 ease-out
                 hover:bg-primary/10 hover:text-primary
                 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button> */}

            {/* LAST */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-sm bg-surface text-muted-foreground
                 transition-all duration-200 ease-out
                 hover:bg-primary/10 hover:text-primary
                 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Last
            </button>

          </div>
        )}
      </div>
    </section>
  );
};
