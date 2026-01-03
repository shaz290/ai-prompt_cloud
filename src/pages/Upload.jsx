import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export const Upload = () => {
  const [imageName, setImageName] = useState("");
  const [imageType, setImageType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;

  const handleUpload = async () => {
    if (!imageName || !imageType || !description) {
      alert("Please fill all fields");
      return;
    }

    if (selectedFiles.length === 0) {
      alert("Please select images");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Insert description
      const { data: desc, error } = await supabase
        .from("descriptions")
        .insert({
          image_name: imageName,
          image_type: imageType,
          description_details: description,
          priority: priority,
          created_on: Date.now(),
        })
        .select("id")
        .single();

      if (error) throw error;

      // 2️⃣ Upload images
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
        );

        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: "POST",
          body: formData,
        });

        const uploaded = await res.json();

        await supabase.from("image_urls").insert({
          description_id: desc.id,
          image_url: uploaded.secure_url,
          created_on: Date.now(),
        });
      }

      alert("Upload successful ✅");

      setImageName("");
      setImageType("");
      setDescription("");
      setPriority(0);
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-24 px-4 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center">
          Upload Images
        </h1>

        {/* Image Name */}
        <input
          placeholder="Image name"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background
                     focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* Image Type (Styled Select) */}
        <div className="relative">
          <select
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
            className="
              w-full
              px-4 py-3 pr-10
              border border-border
              rounded-xl
              bg-background
              text-foreground
              appearance-none
              focus:outline-none
              focus:ring-2
              focus:ring-primary
              focus:border-primary
            "
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
            <option value="other">Other</option>
          </select>

          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Description */}
        <textarea
          rows={4}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background
                     focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />

        {/* Priority */}
        <input
          type="number"
          placeholder="Priority (higher = shown first)"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background
                     focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* File Picker */}
        <div
          onClick={() => fileInputRef.current.click()}
          className="border-2 border-dashed border-border p-8 rounded-xl
                     text-center cursor-pointer hover:border-primary transition"
        >
          Click to select images
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept="image/*"
            onChange={(e) =>
              setSelectedFiles(Array.from(e.target.files || []))
            }
          />
        </div>

        {selectedFiles.length > 0 && (
          <p className="text-sm text-center text-muted-foreground">
            {selectedFiles.length} image(s) selected
          </p>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="
            w-full py-3 rounded-xl font-semibold
            bg-primary text-white
            hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition
          "
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

      </div>
    </div>
  );
};
