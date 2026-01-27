import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://ai-prompt-api.aipromptweb-caa.workers.dev";

export const Upload = () => {
  const navigate = useNavigate();

  /* ---------- ACCESS ---------- */
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  /* ---------- FORM ---------- */
  const [imageName, setImageName] = useState("");
  const [imageType, setImageType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");

  /* ---------- FILES ---------- */
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(0);

  const fileInputRef = useRef(null);

  /* =====================================================
     AUTH CHECK (COOKIE → WORKER)
     ===================================================== */
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setHasAccess(false);
        } else {
          const user = await res.json();
          setHasAccess(user.role === "admin");
        }
      } catch {
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, []);

  /* =====================================================
     ACCESS STATES
     ===================================================== */
  if (checkingAccess) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen py-32 flex items-center justify-center">
          <p className="text-muted-foreground">Checking access…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen py-32 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Access Denied 🚫</h1>
            <p className="text-muted-foreground">
              You don’t have access to this page.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* =====================================================
     HELPERS
     ===================================================== */
  const removeFile = (index) => {
    if (loading) return;
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* =====================================================
     UPLOAD HANDLER (R2 + WORKER)
     ===================================================== */
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
    setCurrentUploadingIndex(0);

    try {
      /* 1️⃣ Create description */
      const descRes = await fetch(
        "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/description",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_name: imageName,
            image_type: imageType,
            description_details: description,
            priority: priority === "" ? 0 : Number(priority),
          }),
        }
      );

      if (!descRes.ok) throw new Error("Failed to create description");

      const { id: descriptionId } = await descRes.json();

      /* 2️⃣ Upload images one by one */
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentUploadingIndex(i + 1);

        const formData = new FormData();
        formData.append("file", selectedFiles[i]);
        formData.append("description_id", descriptionId);

        const uploadRes = await fetch(
          "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/upload",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        if (!uploadRes.ok) throw new Error("Image upload failed");

        const { path } = await uploadRes.json(); // ✅ read ONCE

        /* 3️⃣ Save image URL in DB */
        const imageUrlRes = await fetch(
          "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/imageUrls",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description_id: descriptionId,
              image_url: path,
            }),
          }
        );

        if (!imageUrlRes.ok) {
          throw new Error("Failed to save image URL");
        }
      }

      alert("Upload successful ✅");

      /* RESET */
      setImageName("");
      setImageType("");
      setDescription("");
      setPriority("");
      setSelectedFiles([]);

    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    } finally {
      setLoading(false);
      setCurrentUploadingIndex(0);
    }
  };

  const progressPercent =
    selectedFiles.length > 0
      ? Math.round(
        (currentUploadingIndex / selectedFiles.length) * 100
      )
      : 0;

  /* =====================================================
     UI
     ===================================================== */
  return (
    <>
      <Navbar />

      <main className="min-h-screen py-32 px-4 bg-background">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-center">
            Upload Images (Admin)
          </h1>

          <input
            placeholder="Image name"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border"
          />

          <select
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border"
          >
            <option value="" disabled>Select type</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
            <option value="other">Other</option>
          </select>

          <textarea
            rows={4}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border"
          />

          <input
            type="text"
            inputMode="numeric"
            placeholder="Priority (optional)"
            value={priority}
            onChange={(e) => setPriority(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border"
          />

          {/* FILE PICKER */}
          <div
            onClick={() => !loading && fileInputRef.current.click()}
            className={`border-2 border-dashed p-8 rounded-xl text-center cursor-pointer
              ${loading ? "opacity-50" : "hover:border-primary"}`}
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

          {/* PREVIEW */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative border rounded-xl p-2">
                  <img
                    src={URL.createObjectURL(file)}
                    className="w-full h-32 object-cover rounded-lg"
                  />

                  {!loading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PROGRESS */}
          {loading && (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Uploading {currentUploadingIndex} / {selectedFiles.length}
              </p>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </main>

      <Footer />
    </>
  );
};
