import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { actions, money, TAX_RATE, useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart & Checkout — ByteForge" },
      { name: "description", content: "Review your cart and pay for your order." },
      { property: "og:title", content: "Your Cart — ByteForge" },
      { property: "og:description", content: "Review your cart and pay for your order." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, products } = useStore();
  const nav = useNavigate();
  const [payment, setPayment] = useState("Credit card");
  const lines = cart.flatMap((c) => { const p = products.find((x) => x.id === c.productId); return p ? [{ ...c, p }] : []; });
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const tax = subtotal * TAX_RATE;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const order = actions.placeOrder({
      name: String(f.get("name")), email: String(f.get("email")), phone: String(f.get("phone")), address: String(f.get("address")),
    }, payment);
    nav({ to: "/bill/$id", params: { id: order.id } });
  }

  if (lines.length === 0) return (
    <div className="p-16 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1><Link to="/products" className="btn mt-6">Start shopping</Link></div>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Cart</h1>
        {lines.map((l) => (
          <div key={l.productId} className="panel flex items-center gap-4 p-3">
            <img src={l.p.image} alt={l.p.name} className="h-16 w-24 rounded-md object-cover" />
            <div className="flex-1"><p className="font-semibold">{l.p.name}</p><p className="text-sm text-muted-foreground">{money(l.p.price)}</p></div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost px-3 py-1" onClick={() => actions.setQty(l.productId, l.qty - 1)}>−</button>
              <span className="w-6 text-center">{l.qty}</span>
              <button className="btn-ghost px-3 py-1" onClick={() => actions.setQty(l.productId, l.qty + 1)}>+</button>
            </div>
            <button className="text-sm text-destructive" onClick={() => actions.setQty(l.productId, 0)}>Remove</button>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="panel h-fit space-y-3 p-5">
        <h2 className="text-xl font-bold">Checkout</h2>
        <input name="name" required placeholder="Full name" className="field" />
        <input name="email" type="email" required placeholder="Email" className="field" />
        <input name="phone" required placeholder="Phone" className="field" />
        <textarea name="address" required placeholder="Shipping address" className="field" rows={2} />
        <p className="pt-2 text-sm font-semibold">Payment method</p>
        <div className="grid grid-cols-2 gap-2">
          {["Credit card", "Cash on delivery"].map((m) => (
            <button type="button" key={m} onClick={() => setPayment(m)} className={payment === m ? "btn text-sm" : "btn-ghost text-sm"}>{m}</button>
          ))}
        </div>
        {payment === "Credit card" && (
          <div className="space-y-2">
            <input required placeholder="Card number (demo)" inputMode="numeric" className="field" />
            <div className="flex gap-2"><input required placeholder="MM/YY" className="field" /><input required placeholder="CVC" className="field" /></div>
          </div>
        )}
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between"><span>Tax (10%)</span><span>{money(tax)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-accent">{money(subtotal + tax)}</span></div>
        </div>
        <button type="submit" className="btn w-full">Pay & place order</button>
      </form>
    </div>
  );
}
