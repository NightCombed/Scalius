import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, Clock, RefreshCw, ChevronDown, ChevronUp, 
  Settings, ShoppingBag, Box, Activity, AlertCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AuditLog {
  id: string;
  store_id: string;
  user_id: string | null;
  user_email: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  entity_type: string;
  entity_id: string | null;
  payload: any;
  created_at: string;
}

export function AuditLogsPanel({ storeId }: { storeId: string }) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: logs, isLoading, refetch, isFetching, isError } = useQuery({
    queryKey: ["audit-logs", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as AuditLog[];
    },
    enabled: !!storeId,
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionBadge = (action: AuditLog["action"]) => {
    switch (action) {
      case "INSERT":
        return <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-none">Criado</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-none">Editado</Badge>;
      case "DELETE":
        return <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-none">Excluído</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "store_settings":
        return <Settings className="h-4 w-4 text-amber-500" />;
      case "orders":
        return <ShoppingBag className="h-4 w-4 text-indigo-500" />;
      case "products":
        return <Box className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case "store_settings":
        return "Configurações";
      case "orders":
        return "Pedido";
      case "products":
        return "Produto";
      default:
        return type;
    }
  };

  const formatPayloadChanges = (payload: any) => {
    if (!payload) return "Sem detalhes disponíveis.";
    
    // If it's an update, compare old and new keys and show differences
    if (payload.old && payload.new) {
      const oldVal = payload.old;
      const newVal = payload.new;
      const changes: string[] = [];

      Object.keys(newVal).forEach((key) => {
        // Skip comparing object/array types or audit fields
        if (
          typeof newVal[key] === "object" || 
          key === "updated_at" || 
          key === "created_at"
        ) return;

        if (oldVal[key] !== newVal[key]) {
          const formatVal = (v: any) => {
            if (v === null || v === undefined) return "vazio";
            if (typeof v === "boolean") return v ? "Sim" : "Não";
            return String(v);
          };
          changes.push(`• ${key}: "${formatVal(oldVal[key])}" ➜ "${formatVal(newVal[key])}"`);
        }
      });

      if (changes.length === 0) return "Atualização de campos estruturais/relacionais.";
      return changes.join("\n");
    }

    // For inserts
    if (payload.new) {
      return `Criado com os dados iniciais:\n${JSON.stringify(payload.new, null, 2)}`;
    }

    // For deletes
    if (payload.old) {
      return `Excluído. Dados anteriores:\n${JSON.stringify(payload.old, null, 2)}`;
    }

    return JSON.stringify(payload, null, 2);
  };

  return (
    <Card className="border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg">Histórico de Operações (Logs)</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <CardContent className="p-0">
        {isError && (
          <div className="p-8 text-center text-sm text-destructive flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Erro ao carregar o histórico de logs.
          </div>
        )}

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Carregando auditorias...</p>
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const formattedDate = format(new Date(log.created_at), "dd 'de' MMMM 'às' HH:mm:ss", { locale: ptBR });
              
              return (
                <div 
                  key={log.id} 
                  className={`transition-colors hover:bg-muted/10 ${isExpanded ? 'bg-muted/20' : ''}`}
                >
                  {/* Log summary row */}
                  <div 
                    onClick={() => toggleExpand(log.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 cursor-pointer select-none text-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-1.5 rounded bg-muted">
                        {getEntityIcon(log.entity_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {getEntityLabel(log.entity_type)}
                          </span>
                          {getActionBadge(log.action)}
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                            {log.entity_id ? `ID: ${log.entity_id.slice(0, 8)}` : ""}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Por: <span className="font-medium text-foreground">{log.user_email || "system"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formattedDate}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 border-t border-border/40 bg-muted/5 animate-in slide-in-from-top-1 duration-150">
                      <div className="rounded-lg border border-border/60 bg-background/50 p-4 space-y-3 shadow-inner">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Alterações Registradas
                        </div>
                        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/90 bg-muted/20 p-3 rounded border border-border/40">
                          {formatPayloadChanges(log.payload)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
            Nenhuma operação registrada no histórico até o momento.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
