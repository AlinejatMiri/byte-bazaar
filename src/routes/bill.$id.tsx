import { createFileRoute, Link } from "@tanstack/react-router";
import { money, useStore } from "@/lib/store";

export const Route = createFileRoute("/bill/$id")({
  head: () => ({
    meta: [
      { title: "Your Invoice — ByteForge" },
      { name: "description", content: "Invoice for your ByteForge order." },
      { property: "og:title", content: "Invoice — ByteForge" },
      { property: "og:description", content: "Invoice for your ByteForge order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Bill,
});

function Bill() {
  const { id } = Route.useParams();
  const { orders } = useStore();
  const o = orders.find((x) => x.id === id);
  if (!o) return <div className="p-10 text-center">Invoice not found.</div>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="no-print mb-4 rounded-lg border border-accent p-3 text-center font-semibold text-accent">Thank you! Your order has been placed.</p>
      <div className="panel p-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div><h1 className="text-2xl font-extrabold">Byte<span className="text-primary">Forge</span></h1><p className="text-sm text-muted-foreground">Computers & Components</p></div>
          <div className="text-right"><p className="text-xl font-bold">INVOICE</p><p className="text-sm">{o.id}</p><p className="text-sm text-muted-foreground">{new Date(o.date).toLocaleString()}</p></div>
        </div>
        <div className="mt-6 text-sm">
          <p className="font-semibold">Bill to</p>
          <p>{o.customer.name}</p><p>{o.customer.email} · {o.customer.phone}</p><p>{o.customer.address}</p>
          <p className="mt-2">Payment: <b>{o.payment}</b> — {o.payment === "Credit card" ? "Paid" : "Due on delivery"}</p>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Item</th><th>Qty</th><th>Price</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{o.items.map((i) => (
            <tr key={i.productId} className="border-b"><td className="py-2">{i.name}</td><td>{i.qty}</td><td>{money(i.price)}</td><td className="text-right">{money(i.price * i.qty)}</td></tr>
          ))}</tbody>
        </table>
        <div className="ml-auto mt-4 w-56 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{money(o.tax)}</span></div>
          <div className="flex justify-between border-t pt-1 text-lg font-bold"><span>Total</span><span>{money(o.total)}</span></div>
        </div>
      </div>
      <div className="no-print mt-6 flex justify-center gap-3">
        <button className="btn" onClick={() => window.print()}>Print / Save PDF</button>
        <Link to="/products" className="btn-ghost">Continue shopping</Link>
      </div>
    </div>
  );
}
