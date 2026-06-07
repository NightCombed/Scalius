import React, { ErrorInfo } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logger } from "@/lib/logger";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Supabase client error logs
    Logger.error(error, {
      componentStack: errorInfo.componentStack,
      boundary: "GlobalErrorBoundary",
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 space-y-6 text-center shadow-lg animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10 animate-bounce">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-foreground">Ops! Algo deu errado</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Desculpe pelo transtorno. Ocorreu um erro inesperado nesta página. A nossa equipe já foi notificada automaticamente com os detalhes técnicos para correção.
              </p>
            </div>

            {import.meta.env.MODE !== "production" && this.state.error && (
              <div className="text-left bg-muted p-4 rounded-lg overflow-x-auto text-[11px] font-mono max-h-40 border border-border">
                <p className="font-semibold text-destructive">{this.state.error.toString()}</p>
                <pre className="mt-1 text-muted-foreground">{this.state.error.stack}</pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={this.handleReset} className="flex-1 gap-2">
                <RefreshCcw className="h-4 w-4" /> Recarregar Página
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" /> Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
