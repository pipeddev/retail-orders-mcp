import type { OrderStatus } from "./types.ts";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
});
export const formatCLP = (n: number) => clp.format(n);

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "pendiente de pago",
  paid: "pagado, en preparación",
  shipped: "en despacho",
  delivered: "entregado",
  cancelled: "cancelado",
};
