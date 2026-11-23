import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, categoryImage, useStore } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import laptop from "@/assets/laptop.jpg";
import gpu from "@/assets/gpu.jpg";
import desktop from "@/assets/desktop.jpg";
import peripherals from "@/assets/peripherals.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ByteForge — Computers, Laptops & PC Components" },
      { name: "description", content: "Shop gaming laptops, custom desktops, graphics cards and peripherals." },
      { property: "og:title", content: "ByteForge — Computers & Components" },
      { property: "og:description", content: "Shop gaming laptops, custom desktops, graphics cards and peripherals." },
    ],
  }),
  component: Index,
});

const slides = [
  { img: laptop, title: "Gaming laptops that fly", sub: "RTX 40-series power on the go", cat: "Laptops" },
  { img: gpu, title: "Next-gen graphics", sub: "Upgrade to 4K ray tracing", cat: "Graphics Cards" },
  { img: desktop, title: "Custom-built towers", sub: "Liquid cooled. RGB everything.", cat: "Desktops" },
  { img: peripherals, title: "Complete your setup", sub: "Keyboards, mice and 4K monitors", cat: "Peripherals" },
];

function Index() {
  const [i, setI] = useState(0);
  const { products, productsLoading, productsError } = useStore();
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <section className="relative h-[60vh] min-h-[380px] overflow-hidden">
        {slides.map((s, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <img src={s.img} alt={s.title} width={1280} height={720} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-center px-4">
              <p className="text-sm font-bold uppercase tracking-widest text-accent">{s.sub}</p>
              <h1 className="mt-2 max-w-lg text-4xl font-extrabold md:text-6xl">{s.title}</h1>
              <Link to="/products" search={{ category: s.cat }} className="btn mt-6 w-fit">Shop {s.cat}</Link>
            </div>
          </div>
        ))}
        <button aria-label="Previous" onClick={() => setI((i - 1 + slides.length) % slides.length)} className="btn-ghost absolute left-3 top-1/2 -translate-y-1/2 bg-background/60">‹</button>
        <button aria-label="Next" onClick={() => setI((i + 1) % slides.length)} className="btn-ghost absolute right-3 top-1/2 -translate-y-1/2 bg-background/60">›</button>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button key={idx} aria-label={`Slide ${idx + 1}`} onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground"}`} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c} to="/products" search={{ category: c }} className="panel group relative aspect-square overflow-hidden">
              <img src={categoryImage[c]} alt={c} loading="lazy" className="h-full w-full object-cover opacity-70 transition group-hover:scale-110 group-hover:opacity-100" />
              <span className="absolute bottom-3 left-3 font-display text-lg font-bold">{c}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured products</h2>
          <Link to="/products" className="text-sm font-semibold text-primary">View all →</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productsLoading && <p className="text-muted-foreground">Loading products…</p>}
          {productsError && (
            <p role="alert" className="text-destructive">
              {productsError}
            </p>
          )}
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
          {!productsLoading && !productsError && products.length === 0 && (
            <p className="text-muted-foreground">No products are available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
