import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Flower2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const { user, signIn, signUp, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      toast({ title: "Falha no cadastro", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: "Conta criada",
      description: "Verifique seu e-mail para confirmar (se confirmação estiver ativa).",
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block bg-gradient-botanical relative overflow-hidden">
        <div className="absolute inset-0 grid place-items-center text-primary-foreground p-12">
          <div className="max-w-md space-y-4">
            <img src="/scaliusvitrine-logo.png" alt="Scalius" className="h-10 object-contain invert brightness-200" />
            <h2 className="font-serif text-4xl leading-tight">Cuide da sua loja, nós cuidamos do resto.</h2>
            <p className="opacity-90">Plataforma multi-tenant de e-commerce. Sua marca no próximo nível.</p>
          </div>
        </div>
      </div>
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <img src="/scaliusvitrine-logo.png" alt="Scalius" className="h-8 object-contain" />
          </Link>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 pt-4">
                <div>
                  <h1 className="font-serif text-2xl mb-1">Entrar no painel</h1>
                  <p className="text-sm text-muted-foreground">Acesse a área administrativa da sua floricultura.</p>
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
