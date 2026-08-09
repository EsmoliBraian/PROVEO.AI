export type OrderStatus =
  | "NUEVO"
  | "EN_PROCESO"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO"
  | "REQUIERE_REVISION";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NUEVO: "Nuevo",
  EN_PROCESO: "En proceso",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  REQUIERE_REVISION: "Requiere revisión",
};

export type PaymentMethod = "CASH" | "TRANSFER" | "OTHER";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

export type ProductStockStatus = "DISPONIBLE" | "SIN_STOCK" | "PAUSADO";

export const STOCK_STATUS_LABELS: Record<ProductStockStatus, string> = {
  DISPONIBLE: "Disponible",
  SIN_STOCK: "Sin stock",
  PAUSADO: "Pausado",
};

export interface ConversationMessage {
  id: string;
  role: "customer" | "assistant";
  content: string;
  createdAt: string;
}

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
  paymentMethod: PaymentMethod | null;
  status: OrderStatus;
  receivedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  aiConfidence: number | null;
  items: OrderItem[];
  assignedDriver: { id: string; name: string } | null;
  /// Solo viene incluido en el detalle de un pedido (GET /orders/:id), no en el listado.
  conversation?: { id: string; messages: ConversationMessage[] } | null;
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
  stockStatus: ProductStockStatus;
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
