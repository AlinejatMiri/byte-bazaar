import { useSyncExternalStore } from "react";
import laptop from "@/assets/laptop.jpg";
import gpu from "@/assets/gpu.jpg";
import desktop from "@/assets/desktop.jpg";
import peripherals from "@/assets/peripherals.jpg";

export const CATEGORIES = ["Laptops", "Desktops", "Graphics Cards", "Peripherals"] as const;
export const categoryImage: Record<string, string> = {
  Laptops: laptop,
  Desktops: desktop,
  "Graphics Cards": gpu,
  Peripherals: peripherals,
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  specs: Record<string, string>;
};
export type CartItem = { productId: string; qty: number };
export type Order = {
  id: string;
  date: string;
  customer: { name: string; email: string; phone: string; address: string };
  payment: string;
  items: { productId: string; name: string; price: number; qty: number }[];
  subtotal: number;
  tax: number;
  total: number;
};
type State = { products: Product[]; cart: CartItem[]; orders: Order[] };

export const TAX_RATE = 0.1;

const seed: Product[] = [
  { id: "p1", name: "Volt X17 Gaming Laptop", category: "Laptops", price: 1899, image: laptop, description: "17-inch powerhouse with a 240Hz display built for gaming and creative work.", specs: { CPU: "Intel Core i9-14900HX", GPU: "RTX 4080 12GB", RAM: "32GB DDR5", Storage: "2TB NVMe SSD" } },
  { id: "p2", name: "Aero 14 Ultrabook", category: "Laptops", price: 1199, image: laptop, description: "Thin, light and all-day battery for work on the move.", specs: { CPU: "AMD Ryzen 7 8840U", RAM: "16GB LPDDR5", Storage: "1TB SSD", Weight: "1.2 kg" } },
  { id: "p3", name: "Titan RGB Tower", category: "Desktops", price: 2499, image: desktop, description: "Liquid-cooled desktop with tempered glass and full RGB.", specs: { CPU: "Ryzen 9 7950X", GPU: "RTX 4090 24GB", RAM: "64GB DDR5", PSU: "1000W Gold" } },
  { id: "p4", name: "Core Mini Workstation", category: "Desktops", price: 999, image: desktop, description: "Compact office and studio desktop that stays quiet.", specs: { CPU: "Intel Core i5-14400", RAM: "16GB DDR5", Storage: "1TB SSD" } },
  { id: "p5", name: "RTX 4080 Super 16GB", category: "Graphics Cards", price: 1049, image: gpu, description: "Triple-fan graphics card for 4K gaming and ray tracing.", specs: { Memory: "16GB GDDR6X", Boost: "2.55 GHz", Power: "320W" } },
  { id: "p6", name: "RX 7800 XT 16GB", category: "Graphics Cards", price: 519, image: gpu, description: "Excellent 1440p performance at a great price.", specs: { Memory: "16GB GDDR6", Boost: "2.43 GHz", Power: "263W" } },
  { id: "p7", name: "Strike Mechanical Keyboard", category: "Peripherals", price: 149, image: peripherals, description: "Hot-swappable switches with per-key lighting.", specs: { Switches: "Linear Red", Layout: "Full size", Connection: "USB-C / 2.4GHz" } },
  { id: "p8", name: "Vista 27\" 4K Monitor", category: "Peripherals", price: 429, image: peripherals, description: "Color-accurate 4K IPS panel at 144Hz.", specs: { Size: "27 inch", Resolution: "3840x2160", Refresh: "144Hz" } },
];

const KEY = "cstore-v1";
const initial: State = { products: seed, cart: [], orders: [] };
let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {}
}
function set(next: Partial<State>) {
  state = { ...state, ...next };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => initial,
  );
}

const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const actions = {
  addProduct(p: Omit<Product, "id">) { set({ products: [{ ...p, id: "p" + uid() }, ...state.products] }); },
  deleteProduct(id: string) { set({ products: state.products.filter((p) => p.id !== id) }); },
  addToCart(productId: string, qty = 1) {
    const ex = state.cart.find((c) => c.productId === productId);
    set({ cart: ex ? state.cart.map((c) => c.productId === productId ? { ...c, qty: c.qty + qty } : c) : [...state.cart, { productId, qty }] });
  },
  setQty(productId: string, qty: number) {
    set({ cart: qty <= 0 ? state.cart.filter((c) => c.productId !== productId) : state.cart.map((c) => c.productId === productId ? { ...c, qty } : c) });
  },
  placeOrder(customer: Order["customer"], payment: string): Order {
    const items = state.cart.flatMap((c) => {
      const p = state.products.find((x) => x.id === c.productId);
      return p ? [{ productId: p.id, name: p.name, price: p.price, qty: c.qty }] : [];
    });
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const order: Order = { id: "INV-" + uid(), date: new Date().toISOString(), customer, payment, items, subtotal, tax, total: subtotal + tax };
    set({ orders: [order, ...state.orders], cart: [] });
    return order;
  },
};

export const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
