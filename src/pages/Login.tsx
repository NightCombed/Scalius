import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, Sparkles, ShieldCheck, Store } from "lucide-react";

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
  const { user, signIn, signUp, isSuperAdmin, isAffiliate, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    const target = (location.state as { from?: string } | null)?.from
      ?? (isSuperAdmin ? "/super-admin" : isAffiliate ? "/affiliate" : "/admin");
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#F9F8F5] relative overflow-hidden font-['Reddit_Sans',sans-serif]">
      {/* Main Centered Card Container */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl border border-stone-200/80 bg-white shadow-2xl shadow-stone-900/10 overflow-hidden relative z-10">
        
        {/* Left Hero Panel - Solid Vibrant Scalius Brand Orange */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-[#FF5E00] text-white relative overflow-hidden">
          {/* Top Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-block transition-transform hover:scale-105">
              <img src="/scalius-logo-dark.png" alt="Scalius" className="h-9 object-contain brightness-0 invert" />
            </Link>
          </div>

          {/* Middle Content - Headline and Large Solid Store Icon */}
          <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center text-center space-y-6">
            <h2 className="font-sans text-2xl lg:text-3xl font-bold leading-tight drop-shadow-sm text-white max-w-xs">
              Cuide da sua loja, nós cuidamos do resto.
            </h2>
            <div className="pt-2 flex justify-center">
              <Store className="w-44 h-44 lg:w-52 lg:h-52 text-white stroke-[1.1] transition-transform hover:scale-105 duration-500" />
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-4 border-t border-white/20">
            <p className="text-xs text-white/80 font-medium">
              © {new Date().getFullYear()} Scalius. Todos os direitos reservados.
            </p>
          </div>
        </div>

        {/* Right Form Panel - Light & Clean */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-[#FAF9F6] text-stone-900 relative">
          
          {/* Top navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Voltar ao site</span>
            </Link>

            {/* Mobile logo */}
            <Link to="/" className="md:hidden">
              <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain" />
            </Link>
          </div>

          {/* Form Area */}
          <div className="w-full my-auto space-y-5">

            {/* Brand Logo inside form card top */}
            <div className="hidden md:block mb-2">
              <img src="/scalius-logo-dark.png" alt="Scalius" className="h-8 object-contain" />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full p-1 bg-stone-200/60 rounded-2xl mb-6">
                <TabsTrigger
                  value="signin"
                  className="rounded-xl font-bold text-sm text-stone-600 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-xl font-bold text-sm text-stone-600 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm transition-all"
                >
                  Criar conta
                </TabsTrigger>
              </TabsList>

              {/* TAB: SIGN IN */}
              <TabsContent value="signin" className="space-y-4 focus-visible:outline-none">
                <div>
                  <h1 className="font-sans text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 mb-1">
                    Entrar no painel
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Acesse a área administrativa da sua loja.
                  </p>
                </div>

                <form onSubmit={onSignIn} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-stone-700">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#FF5E00] focus-visible:border-[#FF5E00]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-stone-700">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-xl bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#FF5E00] focus-visible:border-[#FF5E00]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-md focus:outline-none"
                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-bold text-base shadow-md shadow-[#FF5E00]/20 hover:shadow-[#FF5E00]/30 transition-all gap-2 bg-[#FF5E00] hover:bg-[#E05300] text-white mt-2 border-0"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <span>Entrar</span>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* TAB: SIGN UP */}
              <TabsContent value="signup" className="space-y-4 focus-visible:outline-none">
                <div>
                  <h1 className="font-sans text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 mb-1">
                    Criar conta
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Após criar a conta, peça ao administrador para vinculá-lo.
                  </p>
                </div>

                <form onSubmit={onSignUp} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name" className="text-xs font-semibold text-stone-700">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <Input
                        id="su-name"
                        placeholder="Seu nome"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#FF5E00] focus-visible:border-[#FF5E00]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-xs font-semibold text-stone-700">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <Input
                        id="su-email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#FF5E00] focus-visible:border-[#FF5E00]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-password" className="text-xs font-semibold text-stone-700">Senha (mínimo 6 caracteres)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <Input
                        id="su-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-xl bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus-visible:ring-[#FF5E00] focus-visible:border-[#FF5E00]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-md focus:outline-none"
                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-bold text-base shadow-md shadow-[#FF5E00]/20 hover:shadow-[#FF5E00]/30 transition-all gap-2 bg-[#FF5E00] hover:bg-[#E05300] text-white mt-2 border-0"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Criando conta...</span>
                      </>
                    ) : (
                      <span>Criar conta</span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>



        </div>

      </div>
    </div>
  );
}
