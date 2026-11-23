import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, useStore } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): { category?: string | undefined } => ({
    category: typeof s["category"] === "string" ? s["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Products — ByteForge" },
      { name: "description", content: "Browse laptops, desktops, graphics cards and peripherals." },
      { property: "og:title", content: "Shop All Products — ByteForge" },
      { property: "og:description", content: "Browse laptops, desktops, graphics cards and peripherals." },
    ],
  }),
  component: Products,
});

function Products() {
  const { category } = Route.useSearch();
  const { products, productsLoading, productsError } = useStore();
  const list = category ? products.filter((p) => p.category === category) : products;
  const chip = (active: boolean) => `rounded-full border px-4 py-1.5 text-sm font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{category ?? "All products"}</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/products" search={{}} className={chip(!category)}>All</Link>
        {CATEGORIES.map((c) => <Link key={c} to="/products" search={{ category: c }} className={chip(category === c)}>{c}</Link>)}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {productsLoading && <p className="text-muted-foreground">Loading products…</p>}
        {productsError && (
          <p role="alert" className="text-destructive">
            {productsError}
          </p>
        )}
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {!productsLoading && !productsError && list.length === 0 && (
        <p className="mt-8 text-muted-foreground">No products in this category yet.</p>
      )}
    </div>
  );
}
