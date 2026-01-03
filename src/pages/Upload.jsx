import { useState } from "react";
import { Button } from "@/components/Button";

export const Upload = () => {
  const [images, setImages] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...previews]);
  };

  return (
    <div className="min-h-screen container mx-auto px-6 py-32">
      <h1 className="text-3xl font-bold mb-2">Upload Page</h1>
      <p className="text-muted-foreground mb-8">
        Dummy upload page (no backend connected)
      </p>

      {/* Upload Box */}
      <div className="glass rounded-2xl p-6 max-w-lg mb-10">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground"
        />

        <Button className="mt-4" disabled>
          Upload (Dummy)
        </Button>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="glass rounded-xl overflow-hidden"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-2 text-xs text-muted-foreground truncate">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
