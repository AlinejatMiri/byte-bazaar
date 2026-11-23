import { createFileRoute, Link } from "@tanstack/react-router";
import { actions, money, useStore } from "@/lib/store";
import { useState } from "react";
export const Route = createFileRoute("/orders")({ component: Orders });
function Orders() {
  const { orders, authenticated, ordersLoading, ordersError } = useStore();
  const [error, setError] = useState("");
  async function request(id: string) {
    try {
      await actions.requestReturn(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Return request failed");
    }
  }
  if (!authenticated)
    return (
      <div className="p-16 text-center">
        <h1 className="text-2xl font-bold">Sign in to view your orders</h1>
        <Link to="/login" className="btn mt-5">
          Sign in
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your orders</h1>
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {ordersLoading && <p className="text-muted-foreground">Loading orders…</p>}
        {ordersError && (
          <p role="alert" className="text-destructive">
            {ordersError}
          </p>
        )}
        {orders.map((o) => (
          <article
            key={o.id}
            className="panel flex flex-wrap items-center justify-between gap-4 p-4"
          >
            <div>
              <Link to="/bill/$id" params={{ id: o.id }} className="font-semibold text-primary">
                {o.id}
              </Link>
              <p className="text-sm text-muted-foreground">
                {new Date(o.date).toLocaleString()} · {o.status}
              </p>
            </div>
            <strong>{money(o.total)}</strong>
            {["CONFIRMED", "PICKING", "PACKED", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED"].includes(o.status) && (
              <button className="btn-ghost" onClick={() => request(o.id)}>
                Request return
              </button>
            )}
          </article>
        ))}
        {!ordersLoading && !ordersError && orders.length === 0 && (
          <p className="text-muted-foreground">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
