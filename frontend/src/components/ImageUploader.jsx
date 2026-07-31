import { useState } from "react";

export default function ImageUploader({ images, setImages, maxFiles = 5 }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (files) => {
    setError("");
    const validFiles = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isImage) {
        setError("Only image files are allowed!");
      } else if (!isLt5M) {
        setError("Image must be smaller than 5MB!");
      }
      return isImage && isLt5M;
    });

    if (images.length + validFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images.`);
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700">Listing Photos</label>
        <span className="text-xs text-gray-400">
          {images.length} / {maxFiles} images
        </span>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition relative ${
          dragActive
            ? "border-teal-500 bg-teal-50/30"
            : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-2">
          <div className="text-3xl">📸</div>
          <p className="text-sm font-medium text-gray-700">
            Drag and drop your photos here, or <span className="text-teal-600 hover:underline">browse</span>
          </p>
          <p className="text-xs text-gray-400">Supports JPG, PNG, WEBP, GIF up to 5MB</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {images.map((file, idx) => {
            const previewUrl = typeof file === "string" ? file : URL.createObjectURL(file);
            return (
              <div key={idx} className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-gray-150 group">
                <img src={previewUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/75 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
