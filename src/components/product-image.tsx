import Image from "next/image";
import { ProductArt, type Tone } from "./product-art";

type Props = {
  src: string | null;
  alt: string;
  tone?: Tone;
  className?: string;
  imageClassName?: string;
};

export function ProductImage({ src, alt, tone = "plum", className = "h-64", imageClassName = "" }: Props) {
  if (!src) return <ProductArt tone={tone} className={className} />;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-lavender-50 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className={`object-cover ${imageClassName}`}
      />
    </div>
  );
}
