import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function openImagePreview(image: string) {
  if (typeof window === "undefined" || !image) return;

  const isDataUrl = image.startsWith("data:image");
  if (isDataUrl) {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!previewWindow) return;
    previewWindow.document.write(
      `<html><head><title>Aperçu image</title></head><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;"><img src="${image}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`,
    );
    previewWindow.document.close();
    return;
  }

  window.open(image, "_blank", "noopener,noreferrer");
}
