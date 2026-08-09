import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-brand" />
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">PROVEO.AI</h1>
        <p className="login-subtitle">Iniciá sesión para continuar</p>

        <label className="field-label" htmlFor="identifier">
          Email o celular
        </label>
        <input
          id="identifier"
          className="field-input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoFocus
        />

        <label className="field-label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="login-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
