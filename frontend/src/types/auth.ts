export type Role = "SUPER_ADMIN" | "TENANT_ADMIN" | "REPARTIDOR";

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  tenantId: string | null;
  tenantName: string | null;
  subscriptionStatus: "ACTIVE" | "OVERDUE" | "SUSPENDED" | null;
}
