import { Link } from "@tanstack/react-router";
import { actions, money, type Product } from "@/lib/store";

export function ProductCard({ p }: { p: Product }) {
  return (
    <div className="panel group overflow-hidden flex flex-col">
      <Link to="/product/$id" params={{ id: p.id }} className="block aspect-video overflow-hidden">
        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs uppercase tracking-wider text-primary">{p.category}</span>
        <Link to="/product/$id" params={{ id: p.id }} className="font-display font-semibold hover:text-primary">{p.name}</Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{money(p.price)}</span>
          <button className="btn text-sm" onClick={() => actions.addToCart(p.id)}>Add to cart</button>
        </div>
      </div>
    </div>
  );
}
