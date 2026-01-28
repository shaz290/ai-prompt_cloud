// src/helpers/imageCompression.js

export const compressImage = (
    file,
    {
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.7,
    } = {}
) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = e => {
            img.src = e.target.result;
        };

        reader.onerror = reject;

        img.onload = () => {
            let { width, height } = img;

            // Maintain aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const scale = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                blob => {
                    if (!blob) {
                        reject(new Error("Compression failed"));
                        return;
                    }

                    resolve(
                        new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        })
                    );
                },
                file.type,
                quality
            );
        };

        reader.readAsDataURL(file);
    });
};
