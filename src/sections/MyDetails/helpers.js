/* ---------- SHARE PARAM ---------- */
export const getShareIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("share");
};

/* ---------- DATE FORMATTER ---------- */
export const formatDate = (date) => {
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
export const extractCloudinaryImageId = (url) => {
    return url?.split("/")?.[4];
};
