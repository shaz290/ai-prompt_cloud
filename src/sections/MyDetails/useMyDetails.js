import { useEffect, useRef, useState } from "react";
import { PAGE_SIZE } from "./constants";
import { getShareIdFromUrl } from "./helpers";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not defined");
}

export const useMyDetails = () => {
    /* ================= AUTH ================= */
    const [authDetails, setAuthDetails] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/me`, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                setAuthDetails(data);
                setAuthLoading(false);
            })
            .catch(() => setAuthLoading(false));
    }, []);

    const isAdmin = authDetails?.role === "admin";

    /* ================= DATA ================= */
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [toastMessage, setToastMessage] = useState("");

    const [sharedId, setSharedId] = useState(null);
    const isSharedView = useRef(false); // 🔒 hard lock

    const [activeFilter, setActiveFilter] = useState("all");

    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");

    const [pageDetails, setPageDetails] = useState({
        page: 1,
        pageSize: PAGE_SIZE,
        totalPages: 1,
        totalRecords: 0,
    });

    const sectionRef = useRef(null);
    const firstRender = useRef(true);

    /* ================= FETCH PAGINATED ================= */
    const fetchDetails = async (page) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/descriptions?page=${page}&pageSize=${PAGE_SIZE}`
            );
            if (!res.ok) throw new Error("Fetch failed");

            const result = await res.json();
            setData(result.data || []);
            if (result.pagination) setPageDetails(result.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= FETCH SINGLE (SHARE) ================= */
    const fetchSingleDescription = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/description?id=${id}`
            );
            if (!res.ok) throw new Error("Fetch failed");

            const result = await res.json();
            setData(result.data ? [result.data] : []);

            // Disable pagination completely
            setPageDetails({
                page: 1,
                pageSize: 1,
                totalPages: 1,
                totalRecords: 1,
            });
        } catch (err) {
            console.error(err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    /* ================= INITIAL LOAD ================= */
    useEffect(() => {
        if (authLoading) return;

        const id = getShareIdFromUrl();

        if (id) {
            isSharedView.current = true;   // 🔒 LOCK pagination forever
            setSharedId(id);
            fetchSingleDescription(id);    // ✅ ONLY API CALL
            return;                        // ⛔ STOP
        }

        fetchDetails(1);                   // normal flow
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading]);

    /* ================= PAGE CHANGE ================= */
    useEffect(() => {
        if (isSharedView.current) return; // ⛔ HARD BLOCK
        fetchDetails(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    /* ================= SCROLL ================= */
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

    /* ================= UPDATE ================= */
    const handleUpdate = async (itemId) => {
        if (!isAdmin || !editValue.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/description`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: itemId,
                    description_details: editValue,
                }),
            });

            if (!res.ok) throw new Error();

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
        } catch {
            showToast("Update failed");
        }
    };

    /* ================= DELETE ================= */
    const handleDelete = async (item) => {
        if (!isAdmin) return;
        if (!window.confirm("Are you sure?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/delete-description`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description_id: item.id }),
            });

            if (!res.ok) throw new Error();
            setData((prev) => prev.filter((d) => d.id !== item.id));
            showToast("Deleted successfully");
        } catch {
            showToast("Delete failed");
        }
    };

    /* ================= TOAST ================= */
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 1500);
    };

    /* ================= FILTER ================= */
    const filteredData =
        activeFilter === "all"
            ? data
            : data.filter((d) => d.image_type === activeFilter);

    return {
        loading: loading || authLoading,
        isAdmin,
        sharedId,
        activeFilter,
        currentPage,
        editingId,
        editValue,
        toastMessage,
        paginatedData: filteredData,
        totalPages: pageDetails.totalPages,
        sectionRef,

        setActiveFilter,
        setCurrentPage,
        setEditingId,
        setEditValue,

        handleUpdate,
        handleDelete,
        showToast,
    };
};
