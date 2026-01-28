import { SiOpenai, SiGoogle, SiPerplexity } from "react-icons/si";
import { FILTERS } from "./constants";
import { formatDate } from "./helpers";
import { useMyDetails } from "./useMyDetails";
import ImageSlider from "../../components/ImageSlider";

export const MyDetails = () => {
    const {
        loading,
        isLoggedIn,
        isAdmin,
        sharedId,
        activeFilter,
        currentPage,
        editingId,
        editValue,
        toastMessage,
        paginatedData,
        totalPages,
        sectionRef,
        setActiveFilter,
        setCurrentPage,
        setEditingId,
        setEditValue,
        handleUpdate,
        handleDelete,
        showToast,
    } = useMyDetails();

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
                {!sharedId && (
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
                    {paginatedData.map((item) => (
                        <div key={item.id} className="flex flex-col h-full space-y-4">

                            {/* IMAGE */}
                            {item.image_urls?.length > 1 ? (
                                <ImageSlider images={item.image_urls} alt={item.image_name} />
                            ) : (
                                <img
                                    src={item.image_urls?.[0]?.image_url}
                                    alt={item.image_name}
                                    className="w-full aspect-[4/5] object-cover rounded-2xl"
                                />
                            )}

                            {/* DATE */}
                            <div className="text-xs text-muted-foreground">
                                {formatDate(item.created_on)}
                            </div>

                            {/* DESCRIPTION OR MESSAGE */}
                            {isAdmin ? (
                                editingId === item.id ? (
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-[96px] text-sm border rounded-xl p-2 resize-none"
                                    />
                                ) : (
                                    <div className="h-[96px] text-sm text-muted-foreground overflow-auto">
                                        {item.description_details}
                                    </div>
                                )
                            ) : (
                                <div
                                    className="h-[96px] flex items-center justify-center rounded-xl
                border border-emerald-400/30
                bg-gradient-to-br from-emerald-400/10 to-transparent
                text-center px-4"
                                >
                                    <p
                                        className="text-sm font-medium text-emerald-500
                  animate-pulse
                  drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                                    >
                                        {!isLoggedIn
                                            ? "Please Sign up and Login we are going to show the prompts soon"
                                            : "✨ Thanks for logging in! Exciting prompts are coming your way soon."}
                                    </p>
                                </div>
                            )}

                            {/* ACTIONS — ADMIN ONLY */}
                            {isAdmin && (
                                <div className="mt-auto space-y-3">

                                    {/* COPY */}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.description_details);
                                            showToast("Copied to clipboard");
                                        }}
                                        className="w-full py-2 bg-primary text-white rounded-xl"
                                    >
                                        Copy
                                    </button>

                                    {/* SHARE */}
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

                                    {/* EDIT / SAVE */}
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

                                    {/* DELETE */}
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="w-full py-2 border border-red-500 text-red-500 rounded-xl"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}

                            {/* AI ICONS (always visible) */}
                            <div className="flex justify-center gap-6 pt-2">
                                <SiGoogle
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
                                    onClick={() =>
                                        window.open("https://chat.openai.com/", "_blank")
                                    }
                                />
                                <SiPerplexity
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
                    ))}
                </div>

                {/* PAGINATION */}
                {!sharedId && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-16">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                            First
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        <span>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Last
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};
