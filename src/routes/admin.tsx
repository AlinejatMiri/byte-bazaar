import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { actions, CATEGORIES, categoryImage, money, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ByteForge" },
      { name: "description", content: "Manage products and view orders." },
      { property: "og:title", content: "Admin Dashboard — ByteForge" },
      { property: "og:description", content: "Manage products and view orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { products, orders } = useStore();
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const category = String(f.get("category"));
    const specs: Record<string, string> = {};
    String(f.get("specs")).split("\n").forEach((line) => {
      const [k, ...v] = line.split(":");
      if (k && k.trim() && v.length) specs[k.trim()] = v.join(":").trim();
    });
    actions.addProduct({
      name: String(f.get("name")), category, price: Number(f.get("price")),
      image: String(f.get("image")).trim() || categoryImage[category] || "",
      description: String(f.get("description")), specs,
    });
    form.reset();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Orders", orders.length], ["Revenue", money(revenue)], ["Products", products.length]].map(([k, v]) => (
          <div key={k} className="panel p-5"><p className="text-sm text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-bold text-primary">{v}</p></div>
        ))}
      </div>
      <div className="mt-8 flex gap-2">
        <button className={tab === "orders" ? "btn" : "btn-ghost"} onClick={() => setTab("orders")}>Orders</button>
        <button className={tab === "products" ? "btn" : "btn-ghost"} onClick={() => setTab("products")}>Products</button>
      </div>

      {tab === "orders" ? (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th className="p-3 text-right">Total</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-3"><Link to="/bill/$id" params={{ id: o.id }} className="font-semibold text-primary">{o.id}</Link></td>
                  <td>{new Date(o.date).toLocaleDateString()}</td>
                  <td>{o.customer.name}<div className="text-xs text-muted-foreground">{o.customer.email}</div></td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td>{o.payment}</td>
                  <td className="p-3 text-right font-bold">{money(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={add} className="panel h-fit space-y-3 p-5">
            <h2 className="text-lg font-bold">Add product</h2>
            <input name="name" required placeholder="Product name" className="field" />
            <select name="category" className="field">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input name="price" type="number" step="0.01" min="0" required placeholder="Price (USD)" className="field" />
            <input name="image" placeholder="Image URL (optional)" className="field" />
            <textarea name="description" required placeholder="Description" rows={3} className="field" />
            <textarea name="specs" placeholder={"Specs, one per line\nCPU: Ryzen 7\nRAM: 16GB"} rows={4} className="field" />
            <button className="btn w-full">Add product</button>
          </form>
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Product</th><th>Category</th><th>Price</th><th></th></tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="flex items-center gap-3 p-3"><img src={p.image} alt="" className="h-10 w-14 rounded object-cover" />{p.name}</td>
                  <td>{p.category}</td><td>{money(p.price)}</td>
                  <td className="pr-3 text-right"><button className="text-destructive" onClick={() => actions.deleteProduct(p.id)}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
