const STORAGE_KEY = "qaidilife:guest_orders";

interface GuestOrder {
  id: string;
  status: string;
  name: string;
  phone: string;
  total: { currency: string; amount: number };
  subtotal: { currency: string; amount: number };
  shipping: { zone: string; fee: { currency: string; amount: number } };
  created_at: string;
  items: Array<{
    id: string;
    title_en: string;
    image: string;
    qty: number;
    unit_price: { currency: string; amount: number };
    line_total: { currency: string; amount: number };
  }>;
}

export function getGuestOrders(): GuestOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGuestOrder(order: GuestOrder) {
  if (typeof window === "undefined") return;
  try {
    const current = getGuestOrders();
    current.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, 10)));
  } catch {}
}

export { type GuestOrder };