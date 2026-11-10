"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: { url: string; alt: string | null }[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex min-w-0 flex-col-reverse gap-4 md:flex-row lg:sticky lg:top-28 lg:self-start">
      {images.length > 1 && (
        <ul className="flex gap-3 md:flex-col" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === active}
                className={`relative block h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                  i === active ? "border-plum-700" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-lavender-50">
        {current && (
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
