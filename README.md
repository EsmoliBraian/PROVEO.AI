# PROVEO.AI

SaaS multi-tenant para distribuidores mayoristas: pedido por WhatsApp → IA interpreta el pedido → panel → repartidor → entregado → estadísticas.

Ver `C:\Users\esmol\.claude\plans\zany-tickling-whale.md` para el plan de arquitectura y roadmap por fases (documento de trabajo, no versionado en este repo).

## Desarrollo local

```bash
cp .env.example .env
docker compose up -d --build
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Estructura

```
backend/   Express + TypeScript + Prisma + PostgreSQL
frontend/  React + Vite, CSS a mano con design tokens (sin librería de UI)
```

Multi-tenant: una sola base de datos, `tenantId` en cada tabla de negocio. Roles: `SUPER_ADMIN` (operador de PROVEO.AI), `TENANT_ADMIN` (dueño del distribuidor), `REPARTIDOR` (repartidor).
