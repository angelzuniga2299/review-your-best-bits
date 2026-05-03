import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  user_id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};

export function UsersTab() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_users_for_admin");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const promote = useMutation({
    mutationFn: async (target: string) => {
      const { error } = await supabase.rpc("promote_to_admin", { _target: target });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuario promovido a admin");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (target: string) => {
      const { error } = await supabase.rpc("revoke_admin", { _target: target });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Permisos revocados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="bg-info/10 border border-info/20 text-foreground/80 rounded-xl p-4 text-sm">
        <p className="font-semibold mb-1">¿Cómo invitar a otro admin?</p>
        <p>
          Pedile que entre a <code className="bg-surface px-1.5 py-0.5 rounded">/auth</code>, cree
          su cuenta con su email, y después promovelo desde esta lista.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sin usuarios.</p>
      ) : (
        <div className="space-y-2">
          {data.map((u) => {
            const isMe = u.user_id === user?.id;
            return (
              <div
                key={u.user_id}
                className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {u.email} {isMe && <span className="text-xs text-muted-foreground">(vos)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.is_admin ? "Admin" : "Usuario"} ·{" "}
                    {new Date(u.created_at).toLocaleDateString("es-CU")}
                  </p>
                </div>
                {u.is_admin ? (
                  <button
                    type="button"
                    disabled={isMe || revoke.isPending}
                    onClick={() => {
                      if (confirm(`¿Quitar admin a ${u.email}?`)) revoke.mutate(u.user_id);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium border transition-colors bg-primary text-primary-foreground border-primary hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Quitar admin
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={promote.isPending}
                    onClick={() => promote.mutate(u.user_id)}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium border transition-colors bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Hacer admin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
