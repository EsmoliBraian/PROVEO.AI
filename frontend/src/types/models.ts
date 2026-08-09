export type OrderStatus = "NUEVO" | "EN_PROCESO" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NUEVO: "Nuevo",
  EN_PROCESO: "En proceso",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export interface OrderItem {
  id: string;
  rawFragment: string;
  quantity: number;
  matched: boolean;
  product: { id: string; name: string } | null;
}

export interface Order {
  id: string;
  customerPhone: string;
  rawMessage: string;
  deliveryAddress: string | null;
  status: OrderStatus;
  receivedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  aiConfidence: number | null;
  items: OrderItem[];
  assignedDriver: { id: string; name: string } | null;
}

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  active: boolean;
  aliases: { id: string; alias: string }[];
}

export interface TenantStats {
  totalOrders: number;
  statusCounts: Record<OrderStatus, number>;
  today: { orders: number; delivered: number; revenue: number };
  estimatedRevenue: number;
  topProducts: { productName: string; quantity: number; revenue: number }[];
  deliveriesByDriver: { driverName: string; count: number }[];
  ordersByDay: { date: string; count: number }[];
  ordersByHour: { hour: number; count: number }[];
}

export const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
