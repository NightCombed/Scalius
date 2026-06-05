import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, CheckCircle2, Loader2 } from "lucide-react";

type PageState = "loading" | "form" | "success" | "invalid";

export default function SetPassword() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Força o Supabase a trocar os tokens da URL hash por uma sessão real.
  // Quando o usuário vem do link de convite, o hash contém:
  // #access_token=...&type=invite  ou  #access_token=...&type=recovery
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // Suporta invite e recovery (link de "esqueci minha senha")
    const validTypes = ["invite", "recovery", "signup"];
    if (!validTypes.includes(type ?? "") || !accessToken) {
      // Não veio de um link válido — verifica se já tem sessão ativa
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setPageState("form");
        } else {
          setPageState("invalid");
        }
      });
      return;
    }

    // Estabelece a sessão a partir dos tokens da URL
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
      .then(({ error }) => {
        if (error) {
          console.error("[SetPassword] setSession error:", error);
          setPageState("invalid");
        } else {
          // Limpa o hash da URL sem recarregar a página
          window.history.replaceState(null, "", window.location.pathname);
          setPageState("form");
        }
      });
  }, []);

  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return "fraca";
    if (password.length < 10 || !/[0-9]/.test(password)) return "média";
    return "forte";
  })();

  const strengthColor = {
    fraca: "bg-red-500",
    média: "bg-yellow-400",
    forte: "bg-green-500",
  };

  const strengthWidth = {
    fraca: "w-1/3",
    média: "w-2/3",
    forte: "w-full",
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Senhas não coincidem", description: "Confirme sua senha corretamente.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao definir senha", description: error.message, variant: "destructive" });
      return;
    }

    setPageState("success");
    setTimeout(() => navigate("/admin", { replace: true }), 2500);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Validando seu convite…</p>
        </div>
      </div>
    );
  }

  // ── Link inválido / expirado ──────────────────────────────────────────────
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 grid place-items-center">
            <KeyRound className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-serif text-2xl">Link inválido ou expirado</h1>
          <p className="text-muted-foreground text-sm">
            Este link de convite não é mais válido. Peça ao administrador para reenviar o convite.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  // ── Sucesso ───────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 grid place-items-center animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="font-serif text-2xl">Senha definida com sucesso!</h1>
          <p className="text-muted-foreground text-sm">
            Redirecionando para o painel…
          </p>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-[grow_2.5s_ease-in-out_forwards] rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Painel lateral decorativo */}
      <div className="hidden lg:block bg-gradient-botanical relative overflow-hidden">
        <div className="absolute inset-0 grid place-items-center text-primary-foreground p-12">
          <div className="max-w-md space-y-4">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-10 object-contain brightness-0 invert" />
            <h2 className="font-serif text-4xl leading-tight">Quase lá! Crie sua senha para acessar o painel.</h2>
            <p className="opacity-90">Você está a um passo de gerenciar sua loja no Scalius.</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-8 object-contain" />
          </div>

          <div className="space-y-1">
            <h1 className="font-serif text-2xl">Crie sua senha</h1>
            <p className="text-sm text-muted-foreground">
              Defina uma senha segura para acessar o painel administrativo.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Campo senha */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Barra de força */}
              {passwordStrength && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor[passwordStrength]} ${strengthWidth[passwordStrength]}`}
                    />
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength === "forte" ? "text-green-600" :
                    passwordStrength === "média" ? "text-yellow-600" : "text-red-600"
                  }`}>
                    Força: {passwordStrength}
                  </p>
                </div>
              )}
            </div>

            {/* Campo confirmar senha */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  className={`pr-10 ${
                    confirm && confirm !== password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || (!!confirm && confirm !== password)}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando…</>
              ) : (
                "Definir senha e entrar"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Keyframe para a barra de progresso do sucesso */}
      <style>{`
        @keyframes grow {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
