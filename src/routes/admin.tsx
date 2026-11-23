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
  const {
    products,
    orders,
    authenticated,
    role,
    productsLoading,
    ordersLoading,
    productsError,
    ordersError,
  } = useStore();
  const [tab, setTab] = useState<"orders" | "products" | "stock" | "promos">("orders");
  const [message, setMessage] = useState("");
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const category = String(f.get("category"));
    const specs: Record<string, string> = {};
    String(f.get("specs"))
      .split("\n")
      .forEach((line) => {
        const [k, ...v] = line.split(":");
        if (k && k.trim() && v.length) specs[k.trim()] = v.join(":").trim();
      });
    try {
      const product = await actions.addProduct({
        sku: String(f.get("sku")),
        name: String(f.get("name")),
        category,
        price: Number(f.get("price")),
        image: String(f.get("image")).trim() || categoryImage[category] || "",
        description: String(f.get("description")),
        specs,
      });
      const imageFile = f.get("imageFile");
      if (imageFile instanceof File && imageFile.size > 0)
        await actions.uploadProductImage(product.id, imageFile);
      form.reset();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to save product");
    }
  }
  async function setStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await actions.setStock(String(f.get("sku")), Number(f.get("available")));
      setMessage("Stock updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update stock");
    }
  }
  async function savePromo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await actions.savePromotion({
        code: String(f.get("code")),
        kind: String(f.get("kind")) as "PERCENT" | "FIXED",
        value: Number(f.get("value")),
        startsAt: new Date(String(f.get("startsAt"))).toISOString(),
        endsAt: new Date(String(f.get("endsAt"))).toISOString(),
        usageLimit: Number(f.get("usageLimit")),
      });
      setMessage("Promotion saved");
      e.currentTarget.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save promotion");
    }
  }
  if (!authenticated)
    return (
      <div className="p-16 text-center">
        <h1 className="text-2xl font-bold">Staff or admin sign in required</h1>
        <Link to="/login" className="btn mt-5">
          Sign in
        </Link>
      </div>
    );
  if (role !== "ADMIN" && role !== "STAFF")
    return (
      <div className="p-16 text-center">
        <h1 className="text-2xl font-bold">Staff or admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          Your account can shop and view its orders, but it cannot manage the store.
        </p>
        <Link to="/orders" className="btn mt-5">
          View your orders
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", orders.length],
          ["Revenue", money(revenue)],
          ["Products", products.length],
        ].map(([k, v]) => (
          <div key={k} className="panel p-5">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{v}</p>
          </div>
        ))}
      </div>
      {(productsError || ordersError) && (
        <p role="alert" className="mt-4 text-destructive">
          {productsError || ordersError}
        </p>
      )}
      <div className="mt-8 flex gap-2">
        <button className={tab === "orders" ? "btn" : "btn-ghost"} onClick={() => setTab("orders")}>
          Orders
        </button>
        {role === "ADMIN" && (
          <>
            <button
              className={tab === "products" ? "btn" : "btn-ghost"}
              onClick={() => setTab("products")}
            >
              Products
            </button>
            <button
              className={tab === "stock" ? "btn" : "btn-ghost"}
              onClick={() => setTab("stock")}
            >
              Stock
            </button>
            <button
              className={tab === "promos" ? "btn" : "btn-ghost"}
              onClick={() => setTab("promos")}
            >
              Promotions
            </button>
          </>
        )}
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}

      {tab === "orders" ? (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3">Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="p-3 text-right">Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Loading orders…
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-3">
                    <Link
                      to="/bill/$id"
                      params={{ id: o.id }}
                      className="font-semibold text-primary"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td>{new Date(o.date).toLocaleDateString()}</td>
                  <td>
                    {o.customer.name}
                    <div className="text-xs text-muted-foreground">{o.customer.email}</div>
                  </td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td>{o.payment}</td>
                  <td>{o.status}</td>
                  <td className="p-3 text-right font-bold">{money(o.total)}</td>
                  <td className="space-x-2 pr-2">
                    {["CONFIRMED", "PICKING", "PACKED", "SHIPPED", "READY_FOR_PICKUP"].includes(o.status) && (
                      <button
                        className="text-primary"
                        onClick={async () => {
                          try {
                            await actions.fulfillOrder(o.id);
                          } catch (e) {
                            setMessage(e instanceof Error ? e.message : "Fulfillment failed");
                          }
                        }}
                      >
                        Fulfill
                      </button>
                    )}
                    {o.status === "RETURN_REQUESTED" && (
                      <button
                        className="text-primary"
                        onClick={async () => {
                          try {
                            await actions.approveReturn(o.id);
                          } catch (e) {
                            setMessage(e instanceof Error ? e.message : "Refund failed");
                          }
                        }}
                      >
                        Approve return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No orders are available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : tab === "products" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={add} className="panel h-fit space-y-3 p-5">
            <h2 className="text-lg font-bold">Add product</h2>
            <input name="name" required placeholder="Product name" className="field" />
            <input name="sku" required placeholder="SKU" className="field" />
            <select name="category" className="field">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Price (USD)"
              className="field"
            />
            <input name="image" placeholder="Image URL (optional)" className="field" />
            <label className="block text-sm">
              Or upload JPEG, PNG, or WebP (max 5 MB)
              <input
                name="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="field mt-1"
              />
            </label>
            <textarea
              name="description"
              required
              placeholder="Description"
              rows={3}
              className="field"
            />
            <textarea
              name="specs"
              placeholder={"Specs, one per line\nCPU: Ryzen 7\nRAM: 16GB"}
              rows={4}
              className="field"
            />
            <button className="btn w-full">Add product</button>
          </form>
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productsLoading && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      Loading products…
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="flex items-center gap-3 p-3">
                      <img src={p.image} alt="" className="h-10 w-14 rounded object-cover" />
                      {p.name}
                    </td>
                    <td>{p.category}</td>
                    <td>{money(p.price)}</td>
                    <td className="pr-3 text-right">
                      <button
                        className="text-destructive"
                        onClick={async () => {
                          try {
                            await actions.deleteProduct(p.id);
                          } catch (error) {
                            setMessage(error instanceof Error ? error.message : "Unable to delete product");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!productsLoading && !productsError && products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No products are available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "stock" ? (
        <form onSubmit={setStock} className="panel mt-6 max-w-xl space-y-3 p-5">
          <h2 className="text-lg font-bold">Set available stock</h2>
          <select className="field" name="sku">
            {products.map((p) => (
              <option value={p.sku} key={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
          <input
            className="field"
            name="available"
            type="number"
            min="0"
            required
            placeholder="Available units"
          />
          <button className="btn">Update stock</button>
        </form>
      ) : (
        <form onSubmit={savePromo} className="panel mt-6 grid max-w-2xl gap-3 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold sm:col-span-2">Create promotion</h2>
          <input className="field" name="code" required placeholder="Promo code" />
          <select className="field" name="kind">
            <option value="PERCENT">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </select>
          <input
            className="field"
            name="value"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Discount value"
          />
          <input
            className="field"
            name="usageLimit"
            type="number"
            min="1"
            required
            placeholder="Usage limit"
          />
          <label className="text-sm">
            Starts
            <input className="field mt-1" name="startsAt" type="datetime-local" required />
          </label>
          <label className="text-sm">
            Ends
            <input className="field mt-1" name="endsAt" type="datetime-local" required />
          </label>
          <button className="btn sm:col-span-2">Save promotion</button>
        </form>
      )}
    </div>
  );
}
