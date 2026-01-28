import { useRef, useState } from "react";

const ImageSlider = ({ images = [], alt = "" }) => {
    const [index, setIndex] = useState(0);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    if (!images.length) return null;

    const prev = () =>
        setIndex((i) => (i === 0 ? images.length - 1 : i - 1));

    const next = () =>
        setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

    // Touch handlers (mobile swipe)
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;

        // Minimum swipe distance
        if (Math.abs(distance) > 50) {
            distance > 0 ? next() : prev();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <div
            className="relative touch-pan-y select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Image */}
            <img
                src={images[index]?.image_url}
                alt={alt}
                draggable={false}
                className="w-full aspect-[4/5] object-cover rounded-2xl
                border border-blue-500/30
                shadow-md shadow-blue-500/30
                transition-all duration-300"
            />

            {/* Desktop Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2
                        bg-black/50 text-white rounded-full w-8 h-8
                        items-center justify-center"
                    >
                        ‹
                    </button>

                    <button
                        onClick={next}
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2
                        bg-black/50 text-white rounded-full w-8 h-8
                        items-center justify-center"
                    >
                        ›
                    </button>
                </>
            )}

            {/* Dots */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`h-2 w-2 rounded-full transition ${index === i ? "bg-white" : "bg-white/40"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageSlider;
