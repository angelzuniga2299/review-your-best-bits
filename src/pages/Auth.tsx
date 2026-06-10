import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (loading) return;
    if (session && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [session, isAdmin, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Sesión iniciada");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/auth",
      });
      if (error) throw error;
      toast.success("Revisa tu correo para restablecer la contraseña.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative overflow-hidden bg-secondary px-6 py-8 text-center">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative">
          <h1 className="brand-logo text-4xl text-white mb-1">Insignia</h1>
          <p className="text-sm text-white/70">Panel de administración</p>
        </div>
        <Link
          to="/"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Catálogo
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-surface-muted border border-border rounded-2xl p-6 sm:p-8 shadow-card">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Ingresá tus credenciales para continuar</p>
          </div>


          {mode === "signin" ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                    Correo
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-border bg-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-border bg-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {submitting ? "Procesando…" : "Entrar"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleReset} className="space-y-3">
                <div>
                  <label htmlFor="reset-email" className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                    Correo
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full border border-border bg-surface rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {submitting ? "Enviando…" : "Enviar instrucciones"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
