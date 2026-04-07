import Image from "next/image";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2400&q=80";

export function Hero() {
  return (
    <section className="relative min-h-[320px] w-full md:min-h-[420px]">
      <Image
        src={HERO_IMAGE}
        alt="緑豊かな農地の風景"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/80"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-20 text-center md:py-28">
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm md:text-5xl">
          農業情報メディア
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-white/95 md:text-xl">
          農政をもっと身近に
        </p>
      </div>
    </section>
  );
}
