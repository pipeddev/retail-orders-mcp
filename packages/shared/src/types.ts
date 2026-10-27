export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: number;
  customer_id: number;
  status: OrderStatus;
  total_clp: number;
  eta: string | null;
  created_at: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  qty: number;
  unit_price_clp: number;
}
