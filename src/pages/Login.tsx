import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Flower2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function translateSignUpError(error: string): string {
  if (error.toLowerCase().includes("user already registered")) {
    return "Este e-mail já possui uma conta. Use a aba 'Entrar' para fazer login.";
  }
  if (error.toLowerCase().includes("password should be at least")) {
    return "A senha deve ter no mínimo 6 caracteres.";
  }
  if (error.toLowerCase().includes("invalid email")) {
    return "E-mail inválido.";
  }
  return error;
}

export default function Login() {
  const { user, signIn, signUp, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    const target = (location.state as { from?: string } | null)?.from
      ?? (isSuperAdmin ? "/super-admin" : "/admin");
    return <Navigate to={target} replace />;
  }

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Falha no login", description: res.error, variant: "destructive" });
      return;
    }
    navigate("/admin", { replace: true });
  };

  const onSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await signUp(email, password, fullName);
    setSubmitting(false);
    if (!res.ok) {
      const friendlyError = translateSignUpError(res.error ?? "");
      const isAlreadyRegistered = (res.error ?? "").toLowerCase().includes("user already registered");
      toast({ title: "Falha no cadastro", description: friendlyError, variant: "destructive" });
      if (isAlreadyRegistered) {
        setActiveTab("signin");
      }
      return;
    }
    toast({
      title: "Conta criada!",
      description: "Sua conta foi criada com sucesso. Faça login para continuar.",
    });
    setActiveTab("signin");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block bg-gradient-botanical relative overflow-hidden">
        <div className="absolute inset-0 grid place-items-center text-primary-foreground p-12">
          <div className="max-w-md space-y-4">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-10 object-contain brightness-0 invert" />
            <h2 className="font-serif text-4xl leading-tight">Cuide da sua loja, nós cuidamos do resto.</h2>
            <p className="opacity-90">Plataforma multi-tenant de e-commerce. Sua marca no próximo nível.</p>
          </div>
        </div>
      </div>
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-8 object-contain" />
          </Link>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 pt-4">
                <div>
                  <h1 className="font-serif text-2xl mb-1">Entrar no painel</h1>
                  <p className="text-sm text-muted-foreground">Acesse a área administrativa da sua loja.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignUp} className="space-y-4 pt-4">
                <div>
                  <h1 className="font-serif text-2xl mb-1">Criar conta</h1>
                  <p className="text-sm text-muted-foreground">Após criar a conta, peça ao administrador da loja para vinculá-lo.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nome completo</Label>
                  <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">E-mail</Label>
                  <Input id="su-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Senha</Label>
                  <Input id="su-password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
