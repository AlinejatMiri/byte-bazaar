import { useEffect, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import laptop from "@/assets/laptop.jpg";
import gpu from "@/assets/gpu.jpg";
import desktop from "@/assets/desktop.jpg";
import peripherals from "@/assets/peripherals.jpg";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

export const CATEGORIES = ["Laptops", "Desktops", "Graphics Cards", "Peripherals"] as const;
export const categoryImage: Record<string, string> = {
  Laptops: laptop,
  Desktops: desktop,
  "Graphics Cards": gpu,
  Peripherals: peripherals,
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  specs: Record<string, string>;
  version?: number;
};

export type CartItem = { productId: string; qty: number };
export type Order = {
  id: string;
  date: string;
  customer: { name: string; email: string; phone: string; address: string };
  payment: string;
  status: string;
  items: { productId: string; name: string; price: number; qty: number }[];
  subtotal: number;
  tax: number;
  total: number;
  invoiceNumber: string;
  paymentStatus: string;
};

type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type ProductApi = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number | string;
  image_url: string | null;
  description: string | null;
  specs: Record<string, string>;
  active: boolean;
  version: number;
};

type CartResponse = {
  id: number;
  channel: "WEB" | "BRANCH";
  version: number;
  items: { productId: number; quantity: number }[];
  promoCode: string | null;
};

type OrderApi = {
  id: number;
  createdAt: string;
  customer: { name: string; email: string; phone: string; address: string };
  paymentMethod: "CREDIT_CARD" | "CASH_ON_DELIVERY";
  status: string;
  channel: "WEB" | "BRANCH";
  subtotal: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  items: {
    productId: number;
    name: string;
    unitPrice: number | string;
    quantity: number;
  }[];
  payment: { paymentMethod: string; status: string; amount: number | string } | null;
  bill: { invoiceNumber: string; issuedAt: string; status: string };
  statusHistory: { status: string; changedAt: string; changedBy: string }[];
  returnStatus: string | null;
  version: number;
};

type AuthUser = { id: number; name: string; email: string; role: "CUSTOMER" | "STAFF" | "ADMIN" };
type State = {
  authenticated: boolean;
  role: AuthUser["role"] | null;
};

type ApiResult<T> = { data: T; etag?: string };

const PRODUCT_KEY = ["products", { page: 0, size: 100 }] as const;
const cartKey = (channel: "WEB" | "BRANCH") => ["cart", channel] as const;
const ORDER_KEY = ["orders", { page: 0, size: 100 }] as const;
const TAX_RATE = 0.1;

const initial: State = { authenticated: false, role: null };
let state = initial;
let sessionInitialized = false;
let sessionInitializing = false;
const listeners = new Set<() => void>();

function publish(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

const moneyNumber = (value: number | string) => Number(value);

function mapProduct(product: ProductApi): Product {
  return {
    id: String(product.id),
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: moneyNumber(product.price),
    image: product.image_url || categoryImage[product.category] || "",
    description: product.description ?? "",
    specs: product.specs,
    version: product.version,
  };
}

function mapOrder(order: OrderApi): Order {
  return {
    id: String(order.id),
    date: order.createdAt,
    customer: order.customer,
    payment: order.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on delivery" : "Credit card",
    status: order.status,
    items: order.items.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      price: moneyNumber(item.unitPrice),
      qty: item.quantity,
    })),
    subtotal: moneyNumber(order.subtotal),
    tax: moneyNumber(order.tax),
    total: moneyNumber(order.total),
    invoiceNumber: order.bill.invoiceNumber,
    paymentStatus: order.payment?.status ?? "PENDING",
  };
}

async function fetchProducts() {
  return api<Page<ProductApi>>("/products?page=0&size=100&sort=name,asc");
}

async function fetchCart(channel: "WEB" | "BRANCH" = "WEB") {
  return api<CartResponse>(channel === "BRANCH" ? "/carts?channel=BRANCH" : "/carts");
}

async function fetchOrders() {
  return api<Page<OrderApi>>("/orders?page=0&size=100&sort=createdAt,desc");
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api<OrderApi>(`/orders/${id}`);
      return mapOrder(data);
    },
    enabled: typeof window !== "undefined" && Boolean(id) && state.authenticated,
  });
}

async function refreshCart(channel: "WEB" | "BRANCH" = "WEB") {
  if (channel === "WEB") {
    await queryClient.invalidateQueries({ queryKey: cartKey("WEB") });
    return queryClient.fetchQuery({ queryKey: cartKey("WEB"), queryFn: () => fetchCart("WEB") });
  }
  const result = await api<CartResponse>("/carts?channel=BRANCH", { method: "POST" });
  queryClient.setQueryData(cartKey("BRANCH"), result);
  return result;
}

function initializeSession() {
  if (sessionInitialized || sessionInitializing || typeof window === "undefined") return;
  sessionInitializing = true;
  const token = localStorage.getItem("byteforge-token");
  if (!token) {
    sessionInitialized = true;
    sessionInitializing = false;
    return;
  }
  api<AuthUser>("/auth/me")
    .then(({ data }) => {
      localStorage.setItem("byteforge-role", data.role);
      publish({ authenticated: true, role: data.role });
    })
    .catch(() => {
      localStorage.removeItem("byteforge-token");
      localStorage.removeItem("byteforge-role");
      publish({ authenticated: false, role: null });
    })
    .finally(() => {
      sessionInitialized = true;
      sessionInitializing = false;
    });
}

export function useStore(cartChannel: "WEB" | "BRANCH" = "WEB") {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => initial,
  );
  const productsQuery = useQuery({
    queryKey: PRODUCT_KEY,
    queryFn: fetchProducts,
    enabled: typeof window !== "undefined",
  });
  const cartQuery = useQuery({
    queryKey: cartKey(cartChannel),
    queryFn: () => fetchCart(cartChannel),
    enabled: typeof window !== "undefined" && snapshot.authenticated,
  });
  const ordersQuery = useQuery({
    queryKey: ORDER_KEY,
    queryFn: fetchOrders,
    enabled: typeof window !== "undefined" && snapshot.authenticated,
  });

  useEffect(() => {
    initializeSession();
    const expire = () => {
      publish({ authenticated: false, role: null });
      void queryClient.removeQueries({ queryKey: ["cart"] });
      void queryClient.removeQueries({ queryKey: ORDER_KEY });
    };
    window.addEventListener("auth:expired", expire);
    return () => window.removeEventListener("auth:expired", expire);
  }, []);

  const productPage = productsQuery.data?.data;
  const cartResult = cartQuery.data;
  const orderPage = ordersQuery.data?.data;
  return {
    ...snapshot,
    products: productPage?.content.map(mapProduct) ?? [],
    cart: cartResult?.data.items.map((item) => ({ productId: String(item.productId), qty: item.quantity })) ?? [],
    orders: orderPage?.content.map(mapOrder) ?? [],
    cartId: cartResult ? String(cartResult.data.id) : null,
    cartEtag: cartResult?.etag ?? null,
    loading: productsQuery.isPending || (snapshot.authenticated && (cartQuery.isPending || ordersQuery.isPending)),
    productsLoading: productsQuery.isPending,
    cartLoading: cartQuery.isPending,
    ordersLoading: ordersQuery.isPending,
    productsError: productsQuery.error instanceof Error ? productsQuery.error.message : null,
    cartError: cartQuery.error instanceof Error ? cartQuery.error.message : null,
    ordersError: ordersQuery.error instanceof Error ? ordersQuery.error.message : null,
    error:
      productsQuery.error instanceof Error
        ? productsQuery.error.message
        : ordersQuery.error instanceof Error
          ? ordersQuery.error.message
          : null,
  };
}

async function updateCart(
  cartId: string,
  channel: "WEB" | "BRANCH",
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
) {
  const current = await api<CartResponse>(`/carts/${cartId}`);
  const init: RequestInit = { method };
  if (current.etag) init.headers = { "If-Match": current.etag };
  if (body !== undefined) init.body = JSON.stringify(body);
  const result = await api<CartResponse>(path, init);
  queryClient.setQueryData(cartKey(channel), result);
  return result;
}

export const actions = {
  async login(email: string, password: string) {
    const { data } = await api<{ token: string; accessToken?: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("byteforge-token", data.token || data.accessToken || "");
    localStorage.setItem("byteforge-role", data.user.role);
    sessionInitialized = true;
    publish({ authenticated: true, role: data.user.role });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cart"] }),
      queryClient.invalidateQueries({ queryKey: ORDER_KEY }),
    ]);
  },
  async register(name: string, email: string, password: string) {
    const { data } = await api<{ token: string; accessToken?: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem("byteforge-token", data.token || data.accessToken || "");
    localStorage.setItem("byteforge-role", data.user.role);
    sessionInitialized = true;
    publish({ authenticated: true, role: data.user.role });
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  },
  logout() {
    localStorage.removeItem("byteforge-token");
    localStorage.removeItem("byteforge-role");
    publish({ authenticated: false, role: null });
    queryClient.clear();
  },
  async createBranchCart() {
    await refreshCart("BRANCH");
  },
  async loadBranchCart() {
    const result = await fetchCart("BRANCH");
    queryClient.setQueryData(cartKey("BRANCH"), result);
  },
  async addProduct(product: Omit<Product, "id" | "version">) {
    const { data } = await api<ProductApi>("/products", {
      method: "POST",
      body: JSON.stringify({
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        image_url: product.image,
        description: product.description,
        specs: product.specs,
      }),
    });
    await queryClient.invalidateQueries({ queryKey: PRODUCT_KEY });
    return mapProduct(data);
  },
  async deleteProduct(id: string) {
    const { etag } = await api<ProductApi>(`/products/${id}`);
    await api(`/products/${id}`, {
      method: "DELETE",
      ...(etag ? { headers: { "If-Match": etag } } : {}),
    });
    await queryClient.invalidateQueries({ queryKey: PRODUCT_KEY });
  },
  async addToCart(productId: string, quantity = 1, channel: "WEB" | "BRANCH" = "WEB") {
    const key = cartKey(channel);
    let cached = queryClient.getQueryData<ApiResult<CartResponse>>(key);
    if (!cached || cached.data.channel !== channel) {
      cached = await refreshCart(channel);
    }
    await updateCart(String(cached.data.id), channel, "POST", `/carts/${cached.data.id}/items`, {
      productId: Number(productId),
      quantity,
    });
  },
  async setQty(productId: string, quantity: number, channel: "WEB" | "BRANCH" = "WEB") {
    const cached = queryClient.getQueryData<ApiResult<CartResponse>>(cartKey(channel));
    if (!cached) throw new Error("Your cart is not ready");
    const path = `/carts/${cached.data.id}/items/${productId}`;
    if (quantity <= 0) await updateCart(String(cached.data.id), channel, "DELETE", path);
    else
      await updateCart(
        String(cached.data.id),
        channel,
        "PUT",
        `${path}?quantity=${encodeURIComponent(quantity)}`,
      );
  },
  async applyPromo(code: string, channel: "WEB" | "BRANCH" = "WEB") {
    const cached = queryClient.getQueryData<ApiResult<CartResponse>>(cartKey(channel));
    if (!cached) throw new Error("Your cart is not ready");
    await updateCart(
      String(cached.data.id),
      channel,
      "PUT",
      `/carts/${cached.data.id}/promo?code=${encodeURIComponent(code)}`,
    );
  },
  async placeOrder(
    customer: Order["customer"],
    payment: string,
    idempotencyKey: string,
    paymentFields: { cardNumber?: string; cardExpiry?: string; cardCvc?: string; simulatePaymentFailure?: boolean } = {},
    channel: "WEB" | "BRANCH" = "WEB",
  ): Promise<Order> {
    const cached = queryClient.getQueryData<ApiResult<CartResponse>>(cartKey(channel));
    if (!cached) throw new Error("Your cart is not ready");
    const { data } = await api<OrderApi>("/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        cartId: cached.data.id,
        paymentMethod: payment === "Credit card" ? "CREDIT_CARD" : "CASH_ON_DELIVERY",
        ...customer,
        ...paymentFields,
      }),
    });
    const order = mapOrder(data);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: cartKey(channel) }),
      queryClient.invalidateQueries({ queryKey: ORDER_KEY }),
    ]);
    return order;
  },
  async uploadProductImage(id: string, file: File) {
    const { etag } = await api<ProductApi>(`/products/${id}`);
    const form = new FormData();
    form.set("file", file);
    const result = await api<{ image_url: string }>(`/products/${id}/image`, {
      method: "POST",
      ...(etag ? { headers: { "If-Match": etag } } : {}),
      body: form,
    });
    await queryClient.invalidateQueries({ queryKey: PRODUCT_KEY });
    return result;
  },
  async requestReturn(id: string) {
    const { etag } = await api<OrderApi>(`/orders/${id}`);
    await api(`/orders/${id}/returns`, {
      method: "POST",
      ...(etag ? { headers: { "If-Match": etag } } : {}),
    });
    await queryClient.invalidateQueries({ queryKey: ORDER_KEY });
  },
  async fulfillOrder(id: string) {
    const { etag } = await api<OrderApi>(`/orders/${id}`);
    await api(`/orders/${id}/fulfill`, {
      method: "POST",
      ...(etag ? { headers: { "If-Match": etag } } : {}),
    });
    await queryClient.invalidateQueries({ queryKey: ORDER_KEY });
  },
  async approveReturn(id: string) {
    const { etag } = await api<OrderApi>(`/orders/${id}`);
    await api(`/orders/${id}/returns/approve`, {
      method: "POST",
      ...(etag ? { headers: { "If-Match": etag } } : {}),
    });
    await queryClient.invalidateQueries({ queryKey: ORDER_KEY });
  },
  async setStock(sku: string, available: number) {
    return api(`/admin/stock/${encodeURIComponent(sku)}?available=${available}`, { method: "PUT" });
  },
  async savePromotion(promotion: {
    code: string;
    kind: "PERCENT" | "FIXED";
    value: number;
    startsAt: string;
    endsAt: string;
    usageLimit: number;
  }) {
    return api("/admin/promotions", { method: "POST", body: JSON.stringify(promotion) });
  },
};

export const money = (amount: number) =>
  "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export { TAX_RATE };
