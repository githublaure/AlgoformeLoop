import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function openImagePreview(image: string) {
  if (typeof window === "undefined" || !image) return;

  const isDataUrl = image.startsWith("data:image");
  if (isDataUrl) {
    const [meta, base64Data] = image.split(",", 2);
    if (!meta || !base64Data) return;
    const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(blobUrl, "_blank");
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  window.open(image, "_blank", "noopener,noreferrer");
}
