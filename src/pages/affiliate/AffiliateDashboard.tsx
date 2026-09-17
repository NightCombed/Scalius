import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Copy, CheckCheck, ExternalLink, Store, TrendingUp, Users,
  DollarSign, Clock, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Link2,
  Tag, Banknote, BarChart3, AlertCircle, ArrowUpRight, Pencil, Loader2, Sparkles, Percent, RotateCcw,
  BookOpen, Lightbulb, Compass, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const COMMISSION_STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  available: { label: "Disponível", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  paid:      { label: "Pago",       className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",           icon: Banknote },
  pending:   { label: "Pendente",   className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",       icon: Clock },
  cancelled: { label: "Cancelado",  className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",               icon: XCircle },
  reverted:  { label: "Revertido",  className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",  icon: RotateCcw },
};

const PLAN_LABELS: Record<string, string> = {
  basico: "Básico", profissional: "Profissional", plus: "Plus",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { affiliateProfile, memberships } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState(affiliateProfile?.pix_key || "");

  if (!affiliateProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Esta área é exclusiva para parceiros do Scalius.</p>
          <Button onClick={() => navigate("/admin")} variant="outline">Ir para minha loja</Button>
        </div>
      </div>
    );
  }

  const referralLink = `https://scalius.com.br/?ref=${affiliateProfile.code}`;
  const demoStoreSlug = memberships.find(m => m.store.id === affiliateProfile.demo_store_id)?.store.slug;

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ["affiliate-commissions", affiliateProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliateProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: referredStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["affiliate-stores", affiliateProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, status, plan, created_at")
        .eq("affiliate_id", affiliateProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Derived Metrics ────────────────────────────────────────────────────────

  const PLAN_PRICES_CENTS: Record<string, number> = {
    basico: 4700,
    profissional: 8900,
    pro: 8900,
    plus: 15900,
  };

  const activeReferrals = referredStores.filter((s) => s.status === "active").length;
  const trialReferrals = referredStores.filter((s) => s.status === "trial").length;

  const getTierInfo = (activeCount: number) => {
    if (activeCount >= 50) return { rate: 30.0, nextTarget: null, nextRate: null, name: "Nível 5 — VIP (30%)" };
    if (activeCount >= 30) return { rate: 27.5, nextTarget: 50, nextRate: 30.0, name: "Nível 4 — Elite (27,5%)" };
    if (activeCount >= 15) return { rate: 25.0, nextTarget: 30, nextRate: 27.5, name: "Nível 3 — Avançado (25%)" };
    if (activeCount >= 5)  return { rate: 22.5, nextTarget: 15, nextRate: 25.0, name: "Nível 2 — Pro (22,5%)" };
    return { rate: 20.0, nextTarget: 5, nextRate: 22.5, name: "Nível 1 — Inicial (20%)" };
  };

  const currentTier = getTierInfo(activeReferrals);
  const effectiveCommissionRate = Math.max(currentTier.rate, affiliateProfile.commission_rate || 20);

  // Estimated monthly recurring commission from current active stores
  const estimatedMonthlyCommissionCents = referredStores
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const planPrice = PLAN_PRICES_CENTS[s.plan] ?? 8900;
      const comm = Math.round(planPrice * (effectiveCommissionRate / 100));
      return sum + comm;
    }, 0);

  const pendingCommissions = commissions
    .filter((c) => c.status === "pending" || c.status === "available")
    .reduce((s, c) => s + c.commission_amount_cents, 0);

  const paidCommissions = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + c.commission_amount_cents, 0);

  // ── PIX Update Mutation ───────────────────────────────────────────────────
  const updatePixMutation = useMutation({
    mutationFn: async (newPixKey: string) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ pix_key: newPixKey.trim() || null } as any)
        .eq("id", affiliateProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Chave PIX atualizada com sucesso!");
      setPixDialogOpen(false);
    },
    onError: (err: any) => toast.error("Erro ao atualizar chave PIX: " + err.message),
  });

  // ── Copy Helpers ───────────────────────────────────────────────────────────

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(affiliateProfile.code);
    setCopiedCode(true);
    toast.success("Cupom copiado!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-6 object-contain" />
            <div className="h-4 w-px bg-border" />
            <div>
              <div className="text-sm font-semibold text-foreground leading-none">Painel do Parceiro</div>
              <div className="text-xs text-muted-foreground mt-0.5">Programa de Indicação V1</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/central-afiliados")}
              className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Central de Divulgação
            </Button>
            {demoStoreSlug && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2 text-xs"
              >
                <Store className="h-3.5 w-3.5" />
                Minha Loja Demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 border-0 font-medium shadow-sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar à Loja
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Affiliate Info Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meu Painel de Parceiro</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sua taxa atual é de <span className="font-bold text-primary">{effectiveCommissionRate}%</span> em comissão recorrente durante os primeiros 12 meses de cada loja indicada.
            </p>
          </div>
          <Badge
            className={cn(
              "text-sm px-3 py-1",
              affiliateProfile.status === "active"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            )}
          >
            {affiliateProfile.status === "active" ? "✓ Parceiro Ativo" : "Parceria Suspensa"}
          </Badge>
        </div>

        {/* ── Banner Especial: Central de Divulgação & Como Começar ── */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary text-primary-foreground font-bold text-xs">
                NOVO
              </span>
              <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                <Lightbulb className="h-4.5 w-4.5 text-primary" />
                Como começar a divulgar o Scalius?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Acesse a <strong>Central de Divulgação</strong> com ideias de vídeos para gravar hoje, roteiros que não exigem aparecer, 3 lojas demo reais para demonstração e materiais oficiais para download.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => navigate("/central-afiliados")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs gap-2 flex-1 sm:flex-initial shadow-xs"
            >
              <BookOpen className="h-4 w-4" />
              Acessar Central de Ajuda & Divulgação
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Tier Progression Banner ── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-semibold text-xs">
                {currentTier.name}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {activeReferrals} {activeReferrals === 1 ? "loja ativa" : "lojas ativas"} no programa
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {currentTier.nextTarget ? (
                <>Faltam <strong className="text-primary">{currentTier.nextTarget - activeReferrals}</strong> {currentTier.nextTarget - activeReferrals === 1 ? "loja ativa" : "lojas ativas"} para você alcançar a faixa de <strong className="text-primary">{currentTier.nextRate}%</strong> de comissão!</>
              ) : (
                <>Você alcançou a faixa máxima de <strong className="text-primary">30%</strong> de comissão recorrente!</>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/programa-afiliados")} className="gap-1.5 text-xs shrink-0">
            Ver Regras do Programa
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ── Banner: Customer Discount Benefit ── */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Benefício para seus indicados:</strong> Lojistas que assinarem usando <strong>seu cupom</strong> ganham <strong>10% de desconto</strong> no primeiro mês. Quem entrar pelo link sem cupom paga o valor normal, mas ainda gera sua comissão.
            </span>
          </div>
        </div>

        {/* ── Divulgação: Link & Cupom ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Link2 className="h-4 w-4" />
              Link de Indicação
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono truncate text-foreground border">
                {referralLink}
              </code>
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 gap-1.5">
                {copiedLink ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">Envie para seus contatos e redes.</span>
              <button
                type="button"
                onClick={() => navigate("/central-afiliados#biblioteca-ideias")}
                className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs inline-flex items-center gap-1"
              >
                Ver ideias de divulgação →
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Tag className="h-4 w-4" />
              Cupom de Indicação
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-primary-muted/40 rounded-lg px-3 py-2 text-xl font-mono font-bold text-primary tracking-widest border border-primary/20">
                {affiliateProfile.code}
              </code>
              <Button size="sm" variant="outline" onClick={copyCode} className="shrink-0 gap-1.5">
                {copiedCode ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">Dá 10% OFF no 1º mês do cliente.</span>
              <button
                type="button"
                onClick={() => navigate("/central-afiliados#ctas-sugestoes")}
                className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs inline-flex items-center gap-1"
              >
                Ver chamadas de cupom →
              </button>
            </div>
          </div>
        </div>

        {/* ── Métricas Relevantes para o Afiliado ── */}
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Resumo Financeiro & Desempenho
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Renda Recorrente Mensal */}
            <div className="rounded-xl border bg-card p-5 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Renda Mensal Recorrente</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtCurrency(estimatedMonthlyCommissionCents)} <span className="text-xs font-normal text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeReferrals === 0
                    ? "Assinaturas ativas gerarão renda todo mês"
                    : `${activeReferrals} ${activeReferrals === 1 ? "assinatura ativa gerando renda" : "assinaturas ativas gerando renda"}`}
                </p>
              </div>
            </div>

            {/* Card 2: Saldo Pendente a Receber */}
            <div className="rounded-xl border bg-card p-5 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo a Receber</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {fmtCurrency(pendingCommissions)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Será pago no próximo repasse via PIX
                </p>
              </div>
            </div>

            {/* Card 3: Total Já Pago */}
            <div className="rounded-xl border bg-card p-5 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Já Recebido</span>
                <div className="w-8 h-8 rounded-lg bg-primary-muted/60 dark:bg-primary/10 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {fmtCurrency(paidCommissions)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Já transferido para sua chave PIX
                </p>
              </div>
            </div>

            {/* Card 4: Indicações & Taxa */}
            <div className="rounded-xl border bg-card p-5 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Indicações</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                  <Users className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {referredStores.length} {referredStores.length === 1 ? "Loja" : "Lojas"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeReferrals} ativas · {trialReferrals} em teste · Taxa: {affiliateProfile.commission_rate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pix Key & Repasses Banner ── */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Banknote className="h-4 w-4 text-primary" />
                Chave PIX para Recebimento de Repasses
              </div>
              <p className="text-xs text-muted-foreground">
                As transferências das suas comissões são feitas pela equipe do Scalius diretamente para esta chave.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => {
                setPixKeyInput(affiliateProfile.pix_key || "");
                setPixDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              {affiliateProfile.pix_key ? "Editar Chave PIX" : "+ Cadastrar Chave PIX"}
            </Button>
          </div>

          {affiliateProfile.pix_key ? (
            <code className="text-sm font-mono font-bold bg-muted px-3 py-2 rounded-lg block border border-border w-full sm:w-auto inline-block">
              {affiliateProfile.pix_key}
            </code>
          ) : (
            <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
              <span>⚠️ Cadastre sua chave PIX para receber os repasses das suas comissões!</span>
              <Button
                size="sm"
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                onClick={() => {
                  setPixKeyInput("");
                  setPixDialogOpen(true);
                }}
              >
                Cadastrar PIX
              </Button>
            </div>
          )}
        </div>

        {/* ── Clientes Indicados ── */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Clientes Indicados
            </h2>
            <span className="text-sm text-muted-foreground">{referredStores.length} {referredStores.length === 1 ? "loja" : "lojas"}</span>
          </div>
          {storesLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : referredStores.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum cliente indicado ainda.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Compartilhe seu link ou cupom para começar!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Loja</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {referredStores.map((store: any) => {
                    const status = store.status as string;
                    const statusLabel = status === "active" ? "Ativa" : status === "trial" ? "Trial" : status === "pending" ? "Pendente" : "Suspensa";
                    const statusClass = status === "active" ? "bg-emerald-100 text-emerald-700" : status === "trial" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600";
                    return (
                      <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-medium">{store.name}</td>
                        <td className="px-6 py-3 text-muted-foreground">{PLAN_LABELS[store.plan] ?? store.plan}</td>
                        <td className="px-6 py-3">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusClass)}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{fmtDate(store.created_at)}</td>
                        <td className="px-6 py-3">
                          <a
                            href={`https://${store.slug}.scalius.com.br`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Histórico de Comissões ── */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Histórico de Comissões
            </h2>
            <span className="text-sm text-muted-foreground">{commissions.length} {commissions.length === 1 ? "registro" : "registros"}</span>
          </div>
          {commissionsLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : commissions.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma comissão gerada ainda.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">As comissões aparecem aqui quando seus indicados realizam o pagamento da assinatura.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Assinatura</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sua Comissão</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {commissions.map((c: any) => {
                    const cfg = COMMISSION_STATUS_CONFIG[c.status] ?? COMMISSION_STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground">{fmtDate(c.created_at)}</td>
                        <td className="px-6 py-3">{PLAN_LABELS[c.plan_id] ?? c.plan_id}</td>
                        <td className="px-6 py-3 text-right font-medium">{fmtCurrency(c.payment_amount_cents)}</td>
                        <td className="px-6 py-3 text-right text-muted-foreground">{c.commission_rate}%</td>
                        <td className="px-6 py-3 text-right font-bold text-emerald-600">{fmtCurrency(c.commission_amount_cents)}</td>
                        <td className="px-6 py-3">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.className)}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Editar Chave PIX */}
        <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Chave PIX para Recebimento</DialogTitle>
              <DialogDescription>
                Informe a chave PIX onde você deseja receber o repasse das suas comissões do Scalius.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="pix-input">Chave PIX (CPF/CNPJ, E-mail, Celular ou Aleatória)</Label>
                <Input
                  id="pix-input"
                  placeholder="Ex: 123.456.789-00 ou pix@email.com"
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPixDialogOpen(false)} disabled={updatePixMutation.isPending}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                disabled={updatePixMutation.isPending}
                onClick={() => updatePixMutation.mutate(pixKeyInput)}
              >
                {updatePixMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Chave PIX
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
