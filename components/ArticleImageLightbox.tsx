"use client";

import { useEffect, useState } from "react";

type LightboxImage = {
  src: string;
  alt: string;
};

export function ArticleImageLightbox() {
  const [image, setImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const img = target?.closest(".article-body img") as HTMLImageElement | null;
      if (!img) return;
      setImage({
        src: img.currentSrc || img.src,
        alt: img.alt || "記事画像",
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setImage(null);
      }
    }

    document.addEventListener("click", onDocumentClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="画像拡大表示"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={() => setImage(null)}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="max-h-[90vh] max-w-[95vw] rounded-md bg-white object-contain"
      />
    </div>
  );
}
