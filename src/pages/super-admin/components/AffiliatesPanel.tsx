import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, DollarSign, Award, CheckCircle2, Pencil, Plus,
  Search, ExternalLink, Copy, Check, Loader2, Store as StoreIcon,
  CreditCard, Phone, Mail, Calendar, MessageSquare, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

interface AffiliateRow {
  id: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  code: string;
  coupon_code: string | null;
  commission_rate: number;
  status: "active" | "inactive";
  pix_key: string | null;
  notes: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null } | null;
  referredStoresCount?: number;
  activeStoresCount?: number;
  trialStoresCount?: number;
  generatedMRR?: number;
  totalCommissions?: number;
  pendingCommissions?: number;
  paidCommissions?: number;
}

interface ReferredStore {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  created_at: string;
}

interface CommissionItem {
  id: string;
  store_id: string;
  payment_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: "pending" | "paid" | "canceled";
  created_at: string;
  paid_at: string | null;
  store_name?: string;
}

function getStoreMonthlyPrice(planName: string, status: string): number {
  if (status !== "active" && status !== "trial") return 0;
  const p = (planName || "").toLowerCase();
  if (p.includes("enterprise") || p.includes("avançado") || p.includes("avancado")) return 197;
  if (p.includes("essential") || p.includes("iniciante") || p.includes("start")) return 49;
  return 97;
}

export function AffiliatesPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editAffiliate, setEditAffiliate] = useState<AffiliateRow | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateRow | null>(null);

  // Form states for creation
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [commissionRate, setCommissionRate] = useState("20.00");
  const [pixKey, setPixKey] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── Fetch Affiliates with calculated totals ────────────────────────────────
  const { data: affiliates = [], isLoading } = useQuery<AffiliateRow[]>({
    queryKey: ["super-admin-affiliates"],
    queryFn: async () => {
      // 1. Fetch affiliates
      const { data: affs, error: affErr } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (affErr) throw affErr;
      if (!affs || affs.length === 0) return [];

      const userIds = affs.map((a) => a.user_id);
      const affIds = affs.map((a) => a.id);

      // 2. Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name, email: null };
      });

      // 3. Fetch store counts and plan values
      const { data: stores } = await supabase
        .from("stores")
        .select("id, affiliate_id, status, plan")
        .in("affiliate_id", affIds);

      const storeCountMap: Record<string, number> = {};
      const activeStoreMap: Record<string, number> = {};
      const trialStoreMap: Record<string, number> = {};
      const mrrMap: Record<string, number> = {};

      (stores || []).forEach((s) => {
        if (s.affiliate_id) {
          storeCountMap[s.affiliate_id] = (storeCountMap[s.affiliate_id] || 0) + 1;
          if (s.status === "active") {
            activeStoreMap[s.affiliate_id] = (activeStoreMap[s.affiliate_id] || 0) + 1;
          } else if (s.status === "trial") {
            trialStoreMap[s.affiliate_id] = (trialStoreMap[s.affiliate_id] || 0) + 1;
          }
          const monthlyValue = getStoreMonthlyPrice(s.plan, s.status);
          mrrMap[s.affiliate_id] = (mrrMap[s.affiliate_id] || 0) + monthlyValue;
        }
      });

      // 4. Fetch commissions
      const { data: comms } = await supabase
        .from("affiliate_commissions")
        .select("affiliate_id, commission_amount, status")
        .in("affiliate_id", affIds);

      const totalCommMap: Record<string, number> = {};
      const pendingCommMap: Record<string, number> = {};
      const paidCommMap: Record<string, number> = {};

      (comms || []).forEach((c) => {
        const val = Number(c.commission_amount) || 0;
        totalCommMap[c.affiliate_id] = (totalCommMap[c.affiliate_id] || 0) + val;
        if (c.status === "pending") {
          pendingCommMap[c.affiliate_id] = (pendingCommMap[c.affiliate_id] || 0) + val;
        } else if (c.status === "paid") {
          paidCommMap[c.affiliate_id] = (paidCommMap[c.affiliate_id] || 0) + val;
        }
      });

      return affs.map((a: any) => ({
        ...a,
        profile: profileMap[a.user_id] || null,
        referredStoresCount: storeCountMap[a.id] || 0,
        activeStoresCount: activeStoreMap[a.id] || 0,
        trialStoresCount: trialStoreMap[a.id] || 0,
        generatedMRR: mrrMap[a.id] || 0,
        totalCommissions: totalCommMap[a.id] || 0,
        pendingCommissions: pendingCommMap[a.id] || 0,
        paidCommissions: paidCommMap[a.id] || 0,
      }));
    },
  });

  // ── Fetch Selected Affiliate Details (Stores + Commissions) ────────────────
  const { data: affiliateDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["super-admin-affiliate-details", selectedAffiliate?.id],
    queryFn: async () => {
      if (!selectedAffiliate) return null;
      const [storesRes, commsRes] = await Promise.all([
        supabase
          .from("stores")
          .select("id, name, slug, status, plan, created_at")
          .eq("affiliate_id", selectedAffiliate.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("affiliate_commissions")
          .select("id, store_id, payment_amount_cents, commission_rate, commission_amount_cents, status, created_at, paid_at")
          .eq("affiliate_id", selectedAffiliate.id)
          .order("created_at", { ascending: false }),
      ]);

      const stores = (storesRes.data || []) as ReferredStore[];
      const storeMap: Record<string, string> = {};
      stores.forEach((s) => { storeMap[s.id] = s.name; });

      const commissions = ((commsRes.data || []) as any[]).map((c) => ({
        ...c,
        store_name: storeMap[c.store_id] || "Loja ID: " + c.store_id.slice(0, 8),
      })) as CommissionItem[];

      return { stores, commissions };
    },
    enabled: !!selectedAffiliate,
  });

  // ── Create Affiliate Handler ────────────────────────────────────────────────
  async function handleCreateAffiliate(e: React.FormEvent) {
    e.preventDefault();
    if (!userEmail.trim() || !code.trim()) {
      toast.error("E-mail e código de indicação são obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = userEmail.trim().toLowerCase();
      const cleanCode = code.trim().toUpperCase();
      const cleanCoupon = couponCode.trim() ? couponCode.trim().toUpperCase() : null;

      const res = await supabase.functions.invoke("manage-affiliates", {
        body: {
          action: "create_affiliate",
          email: cleanEmail,
          phone: userPhone.trim() || null,
          full_name: fullName.trim() || null,
          code: cleanCode,
          coupon_code: cleanCoupon,
          commission_rate_pct: parseFloat(commissionRate) || 20.0,
          pix_key: pixKey.trim() || null,
          notes: notes.trim() || null,
        },
      });

      if (res.error || !res.data?.ok) {
        let serverErrorMsg = res.data?.error;
        if (!serverErrorMsg && res.error && (res.error as any).context) {
          try {
            const errJson = await (res.error as any).context.json();
            serverErrorMsg = errJson?.error || errJson?.message;
          } catch (e) {
            console.error("Erro ao ler JSON da resposta:", e);
          }
        }

        const errMsg = serverErrorMsg || res.error?.message || "Erro ao cadastrar parceiro";
        toast.error("Falha ao cadastrar parceiro", { description: errMsg });
        return;
      }

      toast.success(res.data.message || `Parceiro ${cleanCode} cadastrado com sucesso!`);
      setCreateOpen(false);
      setUserEmail("");
      setUserPhone("");
      setFullName("");
      setCode("");
      setCouponCode("");
      setCommissionRate("20.00");
      setPixKey("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["super-admin-affiliates"] });
    } catch (err: any) {
      toast.error("Erro ao cadastrar parceiro: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Update Affiliate Handler ────────────────────────────────────────────────
  const updateAffiliate = useMutation({
    mutationFn: async (payload: Partial<AffiliateRow> & { id: string; full_name_edit?: string }) => {
      const {
        id, profile, full_name_edit, referredStoresCount, activeStoresCount,
        trialStoresCount, generatedMRR, totalCommissions, pendingCommissions,
        paidCommissions, ...cleanPayload
      } = payload;

      const { error } = await supabase
        .from("affiliates")
        .update(cleanPayload as any)
        .eq("id", id);
      if (error) throw error;

      if (full_name_edit !== undefined && payload.user_id) {
        const { error: profErr } = await supabase
          .from("profiles")
          .upsert({
            id: payload.user_id,
            full_name: full_name_edit.trim() || null,
          }, { onConflict: "id" });

        if (profErr) {
          console.error("Erro ao atualizar nome no perfil:", profErr);
          throw profErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-affiliates"] });
      toast.success("Parceiro atualizado com sucesso!");
      setEditAffiliate(null);
    },
    onError: (err: any) => toast.error("Erro ao atualizar parceiro: " + err.message),
  });

  // ── Mark Payouts as Paid Handler ──────────────────────────────────────────
  const markAsPaid = useMutation({
    mutationFn: async (affiliateId: string) => {
      const { error } = await supabase
        .from("affiliate_commissions")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("affiliate_id", affiliateId)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-affiliate-details", selectedAffiliate?.id] });
      toast.success("Comissões pendentes marcadas como PAGAS!");
    },
    onError: (err: any) => toast.error("Erro ao dar baixa em comissão: " + err.message),
  });

  // ── Copy Link Helper ──────────────────────────────────────────────────────
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredAffiliates = affiliates.filter((a) => {
    const matchesSearch =
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.coupon_code && a.coupon_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.phone && a.phone.includes(searchTerm)) ||
      (a.profile?.full_name && a.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActivePartners = affiliates.filter((a) => a.status === "active").length;
  const totalGlobalMRR = affiliates.reduce((acc, a) => acc + (a.generatedMRR || 0), 0);
  const totalGlobalEarnings = affiliates.reduce((acc, a) => acc + (a.totalCommissions || 0), 0);
  const totalGlobalPending = affiliates.reduce((acc, a) => acc + (a.pendingCommissions || 0), 0);
  const totalGlobalPaid = affiliates.reduce((acc, a) => acc + (a.paidCommissions || 0), 0);
  const totalGlobalReferredStores = affiliates.reduce((acc, a) => acc + (a.referredStoresCount || 0), 0);

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-soft">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="font-serif text-xl flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Programa de Afiliados / Parceiros
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestão completa de influenciadores, cupons, faturamento recorrente gerado (MRR) e repasses PIX.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm">
          <Plus className="h-4 w-4" />
          + Novo Parceiro
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> Parceiros
          </span>
          <div className="flex items-baseline justify-between">
            <p className="font-serif text-2xl font-bold">{affiliates.length}</p>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30">
              {totalActivePartners} ativos
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <StoreIcon className="h-3.5 w-3.5 text-indigo-500" /> Lojas Indicadas
          </span>
          <p className="font-serif text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {totalGlobalReferredStores}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> MRR Gerado (Mensal)
          </span>
          <p className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            R$ {totalGlobalMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-1">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-amber-500" /> Comissões Pendentes
          </span>
          <p className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-400">
            R$ {totalGlobalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-blue-500" /> Total Pago (Repasses)
          </span>
          <p className="font-serif text-2xl font-bold text-blue-600 dark:text-blue-400">
            R$ {totalGlobalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, cupom, nome, e-mail ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAffiliates.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum parceiro encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden lg:grid grid-cols-[2fr_1.4fr_1.2fr_1.4fr_1fr_auto] gap-4 px-5 py-2.5 text-xs text-muted-foreground uppercase tracking-wider font-medium border-b border-border bg-muted/30">
              <span>Parceiro / Contato</span>
              <span>Código / Cupom</span>
              <span>Lojas / MRR Gerado</span>
              <span>Comissões & Saldo</span>
              <span>Status</span>
              <span className="text-right">Ações</span>
            </div>

            {filteredAffiliates.map((aff) => {
              const refLink = `https://scalius.com.br/?ref=${aff.code}`;
              const displayEmail = aff.email || aff.profile?.email || "Sem e-mail";
              const rawPhone = aff.phone ? aff.phone.replace(/\D/g, "") : null;
              const whatsappUrl = rawPhone ? `https://wa.me/55${rawPhone}` : null;

              return (
                <div
                  key={aff.id}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1.4fr_1.2fr_1.4fr_1fr_auto] gap-3 lg:gap-4 items-center px-5 py-4 hover:bg-muted/10 transition-colors"
                >
                  {/* Partner / User Info */}
                  <div className="min-w-0 space-y-1">
                    <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                      {aff.profile?.full_name || "Parceiro sem nome"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{displayEmail}</span>
                    </div>

                    {aff.phone && (
                      <div className="text-xs flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <Phone className="h-3 w-3 shrink-0" />
                        {whatsappUrl ? (
                          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {aff.phone} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span>{aff.phone}</span>
                        )}
                      </div>
                    )}

                    {aff.pix_key && (
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        PIX: <span className="font-semibold text-foreground">{aff.pix_key}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> Entrada: {new Date(aff.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>

                  {/* Codes & Links */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                        {aff.code}
                      </code>
                      <button
                        onClick={() => handleCopy(refLink)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Copiar link com ?ref="
                      >
                        {copiedCode === refLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {aff.coupon_code && (
                      <div className="text-xs text-muted-foreground">
                        Cupom: <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{aff.coupon_code}</span>
                      </div>
                    )}

                    {aff.notes && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 truncate" title={aff.notes}>
                        <MessageSquare className="h-3 w-3 shrink-0" /> {aff.notes}
                      </div>
                    )}
                  </div>

                  {/* Referred Stores & Generated MRR */}
                  <div className="text-xs space-y-1">
                    <div className="font-medium text-foreground">
                      {aff.referredStoresCount} {aff.referredStoresCount === 1 ? "loja indicadas" : "lojas indicadas"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {aff.activeStoresCount} ativas · {aff.trialStoresCount} trial
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      MRR: R$ {(aff.generatedMRR || 0).toFixed(2)}/mês
                    </div>
                  </div>

                  {/* Commissions & Finance */}
                  <div className="text-xs space-y-1">
                    <div className="text-muted-foreground font-medium">
                      Taxa: <span className="font-bold text-foreground">{aff.commission_rate}%</span> recorrente
                    </div>
                    <div className={aff.pendingCommissions && aff.pendingCommissions > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"}>
                      Pendente: R$ {(aff.pendingCommissions || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Pago até hoje: R$ {(aff.paidCommissions || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        aff.status === "active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200"
                      }
                    >
                      {aff.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => setSelectedAffiliate(aff)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Detalhes
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditAffiliate(aff)}
                      title="Editar parceiro"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialog: Criar Novo Parceiro ──────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Cadastrar Novo Parceiro</DialogTitle>
            <DialogDescription>
              Vincule a conta de um usuário cadastrado no Scalius para torná-lo parceiro/afiliado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAffiliate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">Nome Completo do Parceiro</Label>
              <Input
                id="partner-name"
                placeholder="Ex: João da Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partner-email">E-mail do parceiro *</Label>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="afiliado@exemplo.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partner-phone">WhatsApp / Telefone</Label>
                <Input
                  id="partner-phone"
                  placeholder="(11) 99999-9999"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partner-code">Código do Link *</Label>
                <Input
                  id="partner-code"
                  placeholder="EX: SILVA"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partner-coupon">Cupom Próprio (Opcional)</Label>
                <Input
                  id="partner-coupon"
                  placeholder="EX: SILVA10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partner-rate">Comissão Recorrente (%)</Label>
                <Input
                  id="partner-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="partner-pix">Chave PIX (Opcional)</Label>
                <Input
                  id="partner-pix"
                  placeholder="CPF/CNPJ, E-mail ou Telefone"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="partner-notes">Observações internas</Label>
              <Input
                id="partner-notes"
                placeholder="Ex: Canal do YouTube de E-commerce, 50k inscritos"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Cadastrar Parceiro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar Parceiro ──────────────────────────────────────────── */}
      {editAffiliate && (
        <Dialog open={!!editAffiliate} onOpenChange={(open) => { if (!open) setEditAffiliate(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Editar Parceiro</DialogTitle>
              <DialogDescription>
                Atualize as informações de contato, regras de comissão e cupons de {editAffiliate.profile?.full_name || editAffiliate.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Nome Completo do Parceiro</Label>
                <Input
                  value={editAffiliate.profile?.full_name || ""}
                  onChange={(e) => setEditAffiliate({
                    ...editAffiliate,
                    profile: { ...(editAffiliate.profile || { email: null }), full_name: e.target.value }
                  })}
                  placeholder="Nome do parceiro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>E-mail de Contato</Label>
                  <Input
                    type="email"
                    value={editAffiliate.email || ""}
                    onChange={(e) => setEditAffiliate({ ...editAffiliate, email: e.target.value })}
                    placeholder="afiliado@exemplo.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp / Telefone</Label>
                  <Input
                    value={editAffiliate.phone || ""}
                    onChange={(e) => setEditAffiliate({ ...editAffiliate, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Código do Link</Label>
                  <Input
                    value={editAffiliate.code}
                    onChange={(e) => setEditAffiliate({ ...editAffiliate, code: e.target.value.toUpperCase() })}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cupom Próprio</Label>
                  <Input
                    value={editAffiliate.coupon_code || ""}
                    onChange={(e) => setEditAffiliate({ ...editAffiliate, coupon_code: e.target.value.toUpperCase() || null })}
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Comissão Recorrente (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editAffiliate.commission_rate}
                    onChange={(e) => setEditAffiliate({ ...editAffiliate, commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editAffiliate.status}
                    onValueChange={(val: "active" | "inactive") => setEditAffiliate({ ...editAffiliate, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Chave PIX</Label>
                <Input
                  value={editAffiliate.pix_key || ""}
                  onChange={(e) => setEditAffiliate({ ...editAffiliate, pix_key: e.target.value || null })}
                  placeholder="Chave PIX para pagamentos"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Input
                  value={editAffiliate.notes || ""}
                  onChange={(e) => setEditAffiliate({ ...editAffiliate, notes: e.target.value || null })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditAffiliate(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => updateAffiliate.mutate({
                    ...editAffiliate,
                    full_name_edit: editAffiliate.profile?.full_name || ""
                  })}
                  disabled={updateAffiliate.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                >
                  {updateAffiliate.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Modal Detalhes do Parceiro e Baixa de Comissão ─────────────────── */}
      {selectedAffiliate && (
        <Dialog open={!!selectedAffiliate} onOpenChange={(open) => { if (!open) setSelectedAffiliate(null); }}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center justify-between">
                <span>Detalhes do Parceiro: <strong className="text-primary">{selectedAffiliate.code}</strong></span>
              </DialogTitle>
              <DialogDescription>
                {selectedAffiliate.profile?.full_name || "Sem nome"} ({selectedAffiliate.email || selectedAffiliate.profile?.email || "Sem e-mail"})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Partner KPI Stats Header */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center space-y-0.5">
                  <span className="text-[11px] text-muted-foreground uppercase font-medium">MRR Gerado</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {(selectedAffiliate.generatedMRR || 0).toFixed(2)}/mês
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center space-y-0.5">
                  <span className="text-[11px] text-muted-foreground uppercase font-medium">Total de Lojas</span>
                  <p className="text-lg font-bold text-foreground">
                    {selectedAffiliate.referredStoresCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-center space-y-0.5">
                  <span className="text-[11px] text-muted-foreground uppercase font-medium">Pago no Histórico</span>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    R$ {(selectedAffiliate.paidCommissions || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Top Banner Actions & Pending Payout */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium block">
                    Saldo Pendente para Repasse PIX (Chave: {selectedAffiliate.pix_key || "Não cadastrada"})
                  </span>
                  <span className="font-serif text-2xl font-bold text-amber-700 dark:text-amber-400">
                    R$ {(selectedAffiliate.pendingCommissions || 0).toFixed(2)}
                  </span>
                </div>
                {(selectedAffiliate.pendingCommissions || 0) > 0 && (
                  <Button
                    onClick={() => markAsPaid.mutate(selectedAffiliate.id)}
                    disabled={markAsPaid.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {markAsPaid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Dar Baixa (Marcar como Pago)
                  </Button>
                )}
              </div>

              {/* Referred Stores List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <StoreIcon className="h-4 w-4 text-primary" /> Lojas Cadastradas pelo Parceiro ({affiliateDetails?.stores.length || 0})
                </h3>

                {loadingDetails ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : affiliateDetails?.stores.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">Nenhuma loja cadastrada com este código ainda.</p>
                ) : (
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {affiliateDetails?.stores.map((st) => {
                      const mrrValue = getStoreMonthlyPrice(st.plan, st.status);
                      return (
                        <div key={st.id} className="p-3 flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{st.name}</p>
                            <a
                              href={`https://${st.slug}.scalius.com.br`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                            >
                              {st.slug}.scalius.com.br <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              + R$ {mrrValue}/mês
                            </span>
                            <Badge variant="outline" className="capitalize text-xs">
                              {st.plan}
                            </Badge>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {st.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Commission Ledger */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Histórico de Comissões Geradas
                </h3>

                {loadingDetails ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : affiliateDetails?.commissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">Nenhuma comissão gerada ainda.</p>
                ) : (
                  <div className="rounded-lg border border-border divide-y divide-border max-h-[250px] overflow-y-auto">
                    {affiliateDetails?.commissions.map((comm) => (
                      <div key={comm.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-sm text-foreground">{comm.store_name}</p>
                          <p className="text-muted-foreground">
                            Pagamento: R$ {Number(comm.payment_amount).toFixed(2)} ({comm.commission_rate_pct}% rate) · {new Date(comm.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 block">
                            + R$ {Number(comm.commission_amount).toFixed(2)}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              comm.status === "paid"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 text-[10px]"
                                : comm.status === "pending"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 text-[10px]"
                                : "bg-red-50 text-red-700 text-[10px]"
                            }
                          >
                            {comm.status === "paid" ? `Pago (${comm.paid_at ? new Date(comm.paid_at).toLocaleDateString("pt-BR") : ""})` : comm.status === "pending" ? "Pendente" : "Cancelado"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
