import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatTile } from "../components/StatTile";
import { IconSparkles } from "../components/icons";

interface OrderNeedingReview {
  id: string;
  rawMessage: string;
  aiConfidence: number | null;
  receivedAt: string;
  items: { rawFragment: string }[];
}

interface Analysis {
  avgConfidence: number | null;
  totalAnalyzed: number;
  confidenceBuckets: { alta: number; media: number; baja: number };
  ordersNeedingReview: OrderNeedingReview[];
}

interface AliasSuggestion {
  rawFragment: string;
  suggestedProductId: string | null;
  suggestedProductName: string | null;
  reason: string;
}

export function AnalisisIAPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [suggestions, setSuggestions] = useState<AliasSuggestion[] | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<Analysis>("/analysis").then(setAnalysis);
  }, []);

  async function handleReview() {
    setReviewing(true);
    setError(null);
    try {
      setSuggestions(await api.post<AliasSuggestion[]>("/analysis/suggest-aliases"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar sugerencias");
    } finally {
      setReviewing(false);
    }
  }

  async function handleApply(s: AliasSuggestion) {
    if (!s.suggestedProductId) return;
    await api.post(`/products/${s.suggestedProductId}/aliases`, { alias: s.rawFragment });
    setApplied((prev) => new Set(prev).add(s.rawFragment));
  }

  if (!analysis) return <p>Cargando…</p>;

  const total = analysis.confidenceBuckets.alta + analysis.confidenceBuckets.media + analysis.confidenceBuckets.baja;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Análisis de IA</h1>
          <p className="text-muted">Insights y mejoras del sistema</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Precisión de interpretación</h2>
          <StatTile
            icon={<IconSparkles width={20} height={20} />}
            label="Confianza promedio de la IA"
            value={analysis.avgConfidence != null ? `${Math.round(analysis.avgConfidence * 100)}%` : "—"}
            tone="hero"
          />
        </div>

        <div className="card">
          <h2>Pedidos por confianza</h2>
          <div className="bar-list">
            <div className="bar-row">
              <span className="bar-label">Alta (≥90%)</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct(analysis.confidenceBuckets.alta)}%`, background: "var(--color-success)" }} />
              </div>
              <span className="bar-value">{analysis.confidenceBuckets.alta}</span>
            </div>
            <div className="bar-row">
              <span className="bar-label">Media (70-89%)</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct(analysis.confidenceBuckets.media)}%`, background: "var(--color-warning)" }} />
              </div>
              <span className="bar-value">{analysis.confidenceBuckets.media}</span>
            </div>
            <div className="bar-row">
              <span className="bar-label">Baja (&lt;70%)</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct(analysis.confidenceBuckets.baja)}%`, background: "var(--color-error)" }} />
              </div>
              <span className="bar-value">{analysis.confidenceBuckets.baja}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Mejoras sugeridas</h2>
        <p className="text-muted">
          Buscamos qué fragmentos de pedidos no se pudieron identificar y le pedimos a la IA que sugiera a qué
          producto de tu catálogo podrían corresponder.
        </p>
        <button className="btn btn-primary" onClick={handleReview} disabled={reviewing}>
          {reviewing ? "Analizando…" : "Revisar ahora"}
        </button>
        {error && <p className="login-error">{error}</p>}

        {suggestions && suggestions.length === 0 && (
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            No encontramos sugerencias — o no hay pedidos sin identificar, o no coinciden con ningún producto.
          </p>
        )}

        {suggestions && suggestions.length > 0 && (
          <ul className="product-list" style={{ marginTop: "1rem" }}>
            {suggestions.map((s) => (
              <li key={s.rawFragment} className="suggestion-row">
                <div>
                  <strong>"{s.rawFragment}"</strong>
                  <p className="text-muted">
                    {s.suggestedProductName ? `→ ${s.suggestedProductName}` : "No coincide con ningún producto"} — {s.reason}
                  </p>
                </div>
                {s.suggestedProductId && (
                  <button
                    className="btn btn-secondary"
                    disabled={applied.has(s.rawFragment)}
                    onClick={() => handleApply(s)}
                  >
                    {applied.has(s.rawFragment) ? "Aplicado ✓" : "Aplicar"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Pedidos que necesitan revisión</h2>
        {analysis.ordersNeedingReview.length === 0 && (
          <p className="text-muted">Ningún pedido con ítems sin identificar por ahora.</p>
        )}
        <ul className="product-list">
          {analysis.ordersNeedingReview.map((o) => (
            <li key={o.id} className="product-row">
              <Link to={`/pedidos/${o.id}`}>{o.rawMessage}</Link>
              <span className="text-muted">{o.items.map((i) => i.rawFragment).join(", ")}</span>
              <span className="text-muted">
                {o.aiConfidence != null ? `${Math.round(o.aiConfidence * 100)}%` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
