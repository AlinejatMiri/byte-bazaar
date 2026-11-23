import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, useStore } from "@/lib/store";
export const Route = createFileRoute("/branch-sale")({ component: BranchSale });
function BranchSale() {
  const { products, authenticated, role, productsLoading, productsError } = useStore();
  const [error, setError] = useState("");
  useEffect(() => {
    if (authenticated && (role === "ADMIN" || role === "STAFF")) {
      actions.loadBranchCart().catch((e) => {
        setError(e instanceof Error ? e.message : "Unable to load branch cart");
      });
    }
  }, [authenticated, role]);
  async function start() {
    try {
      await actions.createBranchCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start branch sale");
    }
  }
  async function add(id: string) {
    try {
      await actions.addToCart(id, 1, "BRANCH");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add item");
    }
  }
  if (!authenticated)
    return (
      <div className="p-16 text-center">
        <h1 className="text-2xl font-bold">Staff sign in required</h1>
        <Link to="/login" className="btn mt-5">
          Sign in
        </Link>
      </div>
    );
  if (role !== "ADMIN" && role !== "STAFF")
    return (
      <div className="p-16 text-center">
        <h1 className="text-2xl font-bold">Staff access required</h1>
        <p className="mt-2 text-muted-foreground">Your account cannot create branch sales.</p>
        <Link to="/orders" className="btn mt-5">
          View your orders
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Branch sale</h1>
      <p className="mt-2 text-muted-foreground">
        Create a BRANCH channel cart and add products for the in-store sale.
      </p>
      <button className="btn mt-4" onClick={start}>
        Start new branch cart
      </button>
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          {error}
        </p>
      )}
      {productsLoading && <p className="mt-4 text-muted-foreground">Loading products…</p>}
      {productsError && (
        <p role="alert" className="mt-4 text-destructive">
          {productsError}
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <article className="panel p-4" key={p.id}>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">{p.sku}</p>
            <button className="btn mt-4 w-full" onClick={() => add(p.id)}>
              Add to branch cart
            </button>
          </article>
        ))}
      </div>
      {!productsLoading && !productsError && products.length === 0 && (
        <p className="mt-6 text-muted-foreground">No products are available for sale.</p>
      )}
      <Link to="/cart" search={{ channel: "BRANCH" }} className="btn mt-6 inline-block">
        Continue to checkout
      </Link>
    </div>
  );
}
