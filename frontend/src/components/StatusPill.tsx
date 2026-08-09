import { ORDER_STATUS_LABELS, type OrderStatus } from "../types/models";

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`order-status order-status-${status.toLowerCase()}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
