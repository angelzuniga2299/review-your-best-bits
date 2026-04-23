import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, session, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-bold">Sin permisos</h1>
          <p className="text-sm text-muted-foreground">
            Tu cuenta no tiene rol de administrador. Pedí a un admin que te invite.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
