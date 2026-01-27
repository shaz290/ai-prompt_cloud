import { SiOpenai, SiGoogle, SiPerplexity } from "react-icons/si";
import { FILTERS } from "./constants";
import { formatDate } from "./helpers";
import { useMyDetails } from "./useMyDetails";

export const MyDetails = () => {
    const {
        loading,
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

                            <img
                                src={item.image_urls?.[0]?.image_url}
                                className="w-full aspect-[4/5] object-cover rounded-2xl
                                border border-blue-500/30
                                shadow-md shadow-blue-500/30
                                hover:shadow-xl hover:shadow-blue-500/60
                                hover:border-blue-500/50
                                transition-all duration-300"
                                alt={item.image_name}
                            />

                            <div className="text-xs text-muted-foreground">
                                {formatDate(item.created_on)}
                            </div>

                            {editingId === item.id ? (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-[96px] text-sm border rounded-xl p-2 resize-none"
                                />
                            ) : (
                                <div className="h-[96px] text-sm text-muted-foreground overflow-auto">
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
                                    className="w-full py-2 border border-red-500 text-red-500 rounded-xl"
                                >
                                    Delete
                                </button>

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
                    ))}
                </div>

                {/* PAGINATION */}
                {!sharedId && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-16">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl text-sm disabled:opacity-40"
                        >
                            First
                        </button>

                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl text-sm disabled:opacity-40"
                        >
                            Prev
                        </button>

                        <span className="px-4 py-2 text-sm">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl text-sm disabled:opacity-40"
                        >
                            Next
                        </button>

                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl text-sm disabled:opacity-40"
                        >
                            Last
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};
