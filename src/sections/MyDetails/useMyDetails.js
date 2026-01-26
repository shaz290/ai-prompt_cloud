import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PAGE_SIZE } from "./constants";
import {
    extractCloudinaryImageId,
    getShareIdFromUrl,
} from "./helpers";

export const useMyDetails = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [activeIndex, setActiveIndex] = useState({});
    const [toastMessage, setToastMessage] = useState("");

    const [sharedId, setSharedId] = useState(null);
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

            await fetchDetails();
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

    /* ---------- FETCH ---------- */
    const fetchDetails = async (page = 1) => {
        setLoading(true);

        try {
            const res = await fetch(
                `https://ai-prompt-api.aipromptweb-caa.workers.dev/api/descriptions?page=${page}&pageSize=${PAGE_SIZE}`
            );

            const result = await res.json();

            setData(result.data || []);

            // optional: if you need pagination info
            // setTotalPages(result.pagination.totalPages);

        } catch (err) {
            console.error("Fetch failed", err);
        }

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

    /* ---------- TOAST ---------- */
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 1500);
    };

    /* ---------- FILTER ---------- */
    const filteredData = (() => {
        let result = data;

        if (sharedId) {
            return result.filter((item) => item.id.toString() === sharedId);
        }

        if (activeFilter !== "all") {
            result = result.filter(
                (item) => item.image_type === activeFilter
            );
        }

        return result;
    })();

    /* ---------- PAGINATION ---------- */
    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

    const paginatedData = sharedId
        ? filteredData
        : filteredData.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE
        );

    return {
        loading,
        sharedId,
        activeFilter,
        currentPage,
        editingId,
        editValue,
        toastMessage,
        activeIndex,

        paginatedData,
        totalPages,
        sectionRef,

        setActiveFilter,
        setCurrentPage,
        setEditingId,
        setEditValue,
        setActiveIndex,

        handleUpdate,
        handleDelete,
        showToast,
    };
};
