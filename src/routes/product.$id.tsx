import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { actions, money, useStore } from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product Details — ByteForge" },
      { name: "description", content: "Specs, price and details for this product." },
      { property: "og:title", content: "Product Details — ByteForge" },
      { property: "og:description", content: "Specs, price and details for this product." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { products } = useStore();
  const [qty, setQty] = useState(1);
  const nav = useNavigate();
  const p = products.find((x) => x.id === id);
  if (!p) return <div className="p-10 text-center">Product not found. <Link to="/products" className="text-primary">Back to shop</Link></div>;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <div className="panel overflow-hidden"><img src={p.image} alt={p.name} className="h-full w-full object-cover" /></div>
      <div>
        <Link to="/products" search={{ category: p.category }} className="text-sm font-bold uppercase tracking-wider text-primary">{p.category}</Link>
        <h1 className="mt-2 text-3xl font-extrabold">{p.name}</h1>
        <p className="mt-4 text-3xl font-bold text-accent">{money(p.price)}</p>
        <p className="mt-4 text-muted-foreground">{p.description}</p>
        <table className="mt-6 w-full text-sm">
          <tbody>
            {Object.entries(p.specs).map(([k, v]) => (
              <tr key={k} className="border-b"><td className="py-2 text-muted-foreground">{k}</td><td className="py-2 text-right font-semibold">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex items-center gap-3">
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} className="field w-20" aria-label="Quantity" />
          <button className="btn" onClick={() => actions.addToCart(p.id, qty)}>Add to cart</button>
          <button className="btn-ghost" onClick={() => { actions.addToCart(p.id, qty); nav({ to: "/cart" }); }}>Buy now</button>
        </div>
      </div>
    </div>
  );
}
