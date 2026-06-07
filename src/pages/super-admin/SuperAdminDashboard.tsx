import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Store, Sparkles, Users, ShoppingBag, Check, ChevronDown,
  Plus, Pencil, X, UserPlus, Trash2, ExternalLink, Copy, RefreshCw,
  CheckCircle2, AlertCircle, Clock, Mail, AlertTriangle, Send, HardDrive,
  Activity, Bug, Shield, Bell, ChevronRight, Filter, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PLAN_LABEL, PLAN_BADGE_CLASSES, type PlanId } from "@/lib/plan";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type StoreStatus = "active" | "trial" | "suspended";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  plan: PlanId;
  created_at: string;
  updated_at: string | null;
  trial_started_at: string;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  invite_pending: boolean;  // true = auth.users exists but email_confirmed_at is null
  profile: { full_name: string | null; email: string | null } | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STATUS_CONFIG: Record<StoreStatus, { label: string; className: string; icon: React.ElementType }> = {
  active:    { label: "Ativa",     className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  trial:     { label: "Trial",     className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",   icon: Clock },
  suspended: { label: "Suspensa",  className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",           icon: AlertCircle },
};

const ROLE_LABELS: Record<string, string> = {
  owner:   "Dono",
  admin:   "Gerente",
  staff:   "Colaborador",
};

const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function pluralizeDays(value: number) {
  return value === 1 ? "1 dia" : `${value} dias`;
}

function getTrialCounter(store: StoreRow) {
  if (store.status !== "trial") return null;

  const reference = store.trial_started_at || store.created_at;
  const startedAt = new Date(reference);
  if (Number.isNaN(startedAt.getTime())) return null;

  const now = new Date();
  
  // Calculate remaining days based on calendar dates (timezone-safe and matches client expectations)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endsAt = new Date(startedAt.getTime() + TRIAL_DAYS * DAY_MS);
  const startOfEndsAt = new Date(endsAt.getFullYear(), endsAt.getMonth(), endsAt.getDate());
  
  const remainingDays = Math.ceil((startOfEndsAt.getTime() - startOfToday.getTime()) / DAY_MS);
  const formattedEndDate = endsAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (remainingDays > 0) {
    return {
      expired: false,
      label: `${pluralizeDays(remainingDays)} restantes`,
      detail: `Trial acabará dia ${formattedEndDate}`,
    };
  }

  const overdueDays = Math.abs(remainingDays);
  return {
    expired: true,
    label: overdueDays === 0 ? "vence hoje" : `${pluralizeDays(overdueDays)} após trial`,
    detail: `Trial acabou dia ${formattedEndDate}`,
  };
}

// ─── Create / Edit Store Dialog ─────────────────────────────────────────────

interface StoreDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: StoreRow | null;
  onSaved: () => void;
}

function StoreDialog({ open, onClose, initial, onSaved }: StoreDialogProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [status, setStatus] = useState<StoreStatus>(initial?.status ?? "trial");
  const [plan, setPlan] = useState<PlanId>(initial?.plan ?? "essencial");
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from name when not manually edited
  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const statusChanged = initial!.status !== status;
        const { error } = await supabase
          .from("stores")
          .update({
            name: name.trim(),
            slug: slug.trim(),
            status,
            plan,
            ...(statusChanged && status === "trial" ? { trial_started_at: new Date().toISOString() } : {}),
          } as any)
          .eq("id", initial!.id);
        if (error) throw error;
        toast.success("Loja atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("stores")
          .insert({
            name: name.trim(),
            slug: slug.trim(),
            status,
            plan,
            ...(status === "trial" ? { trial_started_at: new Date().toISOString() } : {}),
          } as any);
        if (error) throw error;
        toast.success(`Loja "${name}" criada com sucesso!`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error("Erro ao salvar loja", { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {isEdit ? "Editar loja" : "Nova loja"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados da loja."
              : "Preencha os dados para criar uma nova loja na plataforma."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="store-name">Nome da loja *</Label>
            <Input
              id="store-name"
              placeholder="Ex: Minha Loja"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="store-slug">Slug (subdomínio) *</Label>
            <div className="flex items-center gap-1">
              <Input
                id="store-slug"
                placeholder="minha-loja"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                className="flex-1"
                required
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">.scalius.com.br</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas, números e hífens. Não pode ser alterado facilmente depois.
            </p>
          </div>

          {/* Status + Plano */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status inicial</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StoreStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="suspended">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="pro">Pro ✨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? "Salvar alterações" : "Criar loja"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Members Sheet ───────────────────────────────────────────────────────────

interface MembersSheetProps {
  store: StoreRow | null;
  onClose: () => void;
}

function MembersSheet({ store, onClose }: MembersSheetProps) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "staff">("admin");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: members = [], isLoading: loadingMembers } = useQuery<MemberRow[]>({
    queryKey: ["store-members", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("store_members")
        .select("id, user_id, role, created_at")
        .eq("store_id", store.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = (data ?? []).map((m) => m.user_id);
      let profiles: Record<string, { full_name: string | null; email: string | null }> = {};

      // Buscar via Edge Function para obter email_confirmed_at também
      let pendingSet = new Set<string>();
      try {
        const pendingRes = await supabase.functions.invoke("get-members-status", {
          body: { user_ids: userIds },
        });
        if (!pendingRes.error && pendingRes.data?.pending) {
          pendingSet = new Set<string>(pendingRes.data.pending as string[]);
        }
      } catch (_) {
        // silently ignore if function not available
      }

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        (profileData ?? []).forEach((p) => {
          profiles[p.id] = { full_name: p.full_name, email: null };
        });
      }

      return (data ?? []).map((m) => ({
        ...m,
        invite_pending: pendingSet.has(m.user_id),
        profile: profiles[m.user_id] ?? null,
      }));
    },
    enabled: !!store?.id,
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("store_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-members", store?.id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-counts"] });
      toast.success("Membro removido");
    },
    onError: (err: any) => {
      toast.error("Erro ao remover membro", { description: err.message });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("store_members")
        .update({ role } as any)
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-members", store?.id] });
      toast.success("Cargo atualizado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar cargo", { description: err.message });
    },
  });

  async function handleResendInvite(member: MemberRow) {
    if (!store) return;
    setResendingId(member.user_id);
    try {
      const res = await supabase.functions.invoke("resend-invite", {
        body: {
          user_id: member.user_id,
          store_slug: store.slug,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const result = res.data as { ok: boolean; message: string };

      if (!result.ok) throw new Error(result.message || "Erro ao reenviar convite");

      toast.success("Convite reenviado!", { description: result.message });
      queryClient.invalidateQueries({ queryKey: ["store-members", store.id] });
    } catch (err: any) {
      toast.error("Erro ao reenviar convite", { description: err.message });
    } finally {
      setResendingId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !store) return;
    setInviting(true);
    try {
      const res = await supabase.functions.invoke("invite-store-user", {
        body: {
          email: inviteEmail.trim(),
          store_id: store.id,
          role: inviteRole,
          redirect_url: `https://${store.slug}.scalius.com.br/set-password`,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const result = res.data as { ok: boolean; message: string; already_member?: boolean; is_new_user?: boolean };

      if (!result.ok) throw new Error(result.message || "Erro desconhecido");

      if (result.already_member) {
        toast.success("Já é membro!", { description: result.message });
      } else if (result.is_new_user) {
        toast.success("Convite enviado!", { description: "Um e-mail de convite foi enviado para o usuário definir sua senha." });
      } else {
        toast.success("Usuário vinculado!", { description: result.message });
      }

      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["store-members", store.id] });
    } catch (err: any) {
      toast.error("Erro ao convidar", { description: err.message });
    } finally {
      setInviting(false);
    }
  }

  const storeUrl = store ? `https://${store.slug}.scalius.com.br` : "";

  return (
    <Sheet open={!!store} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Membros — {store?.name}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{storeUrl}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success("URL copiada!"); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Members list */}
          <section className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Membros atuais
            </h3>
            {loadingMembers && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingMembers && members.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum membro ainda. Convide o primeiro lojista abaixo.
              </div>
            )}
            {members.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-lg border bg-card",
                  m.invite_pending
                    ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10"
                    : "border-border"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-sm flex items-center gap-2">
                    {m.profile?.full_name || "Sem nome"}
                    {m.invite_pending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        Pendente
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-1">
                    <Select
                      value={m.role}
                      onValueChange={(newRole) => {
                        updateRoleMutation.mutate({ memberId: m.id, role: newRole });
                      }}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="h-6 w-28 text-[11px] px-2 py-0 bg-transparent border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Dono</SelectItem>
                        <SelectItem value="admin">Gerente</SelectItem>
                        <SelectItem value="staff">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="shrink-0">· ID: {m.user_id.slice(0, 8)}…</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {m.invite_pending && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      onClick={() => handleResendInvite(m)}
                      disabled={resendingId === m.user_id}
                      title="Reenviar convite"
                    >
                      {resendingId === m.user_id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />
                      }
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember.mutate(m.id)}
                    disabled={removeMember.isPending}
                    title="Remover membro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </section>

          {/* Invite form */}
          <section className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Convidar / vincular membro
            </h3>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="text-sm">E-mail *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="lojista@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Papel na loja</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Dono (acesso total)</SelectItem>
                      <SelectItem value="admin">Gerente</SelectItem>
                      <SelectItem value="staff">Colaborador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={inviting}>
                  {inviting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Vinculando…</>
                    : <><UserPlus className="h-4 w-4" /> Vincular / Convidar</>
                  }
                </Button>
              </form>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Se o e-mail já tiver conta ativa no Scalius, é vinculado <strong>sem enviar e-mail</strong>.
                Caso contrário, receberá um convite por e-mail para definir a senha.
              </p>
            </div>
          </section>

          {/* Roles Guide */}
          <section className="space-y-3 pt-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Diferenciais dos Cargos
              </h4>
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <strong className="text-violet-600 dark:text-violet-400 font-semibold block mb-0.5">👑 Dono (owner):</strong>
                  <span className="text-muted-foreground">Acesso total. Único com permissão para gerenciar faturamento, chaves de pagamento (Mercado Pago) e gerenciar a equipe (convidar ou remover membros).</span>
                </div>
                <div className="border-t border-border pt-3">
                  <strong className="text-blue-600 dark:text-blue-400 font-semibold block mb-0.5">💼 Gerente (admin):</strong>
                  <span className="text-muted-foreground">Pode gerenciar produtos, categorias, pedidos, configurações de frete e notificações. Não altera pagamentos nem acessa a equipe.</span>
                </div>
                <div className="border-t border-border pt-3">
                  <strong className="text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">🛠️ Colaborador (staff):</strong>
                  <span className="text-muted-foreground">Acesso operacional. Permite gerenciar catálogo (produtos/categorias) e controlar pedidos. Não acessa configurações da loja, pagamentos ou equipe.</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Logs Monitor Panel ─────────────────────────────────────────────────────

type LogsTab = "audit" | "errors";

interface AuditLogRow {
  id: string;
  store_id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, any> | null;
  created_at: string;
}

interface ClientErrorRow {
  id: string;
  store_id: string | null;
  user_id: string | null;
  url: string | null;
  error_message: string;
  stack_trace: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  INSERT: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  UPDATE: { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-400" },
  DELETE: { bg: "bg-red-100 dark:bg-red-900/30",     text: "text-red-700 dark:text-red-400" },
};

function LogsMonitorPanel({ stores }: { stores: { id: string; name: string; slug: string }[] }) {
  const [activeTab, setActiveTab] = useState<LogsTab>("errors");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alertSending, setAlertSending] = useState(false);

  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  // ── Audit Logs ────────────────────────────────────────────────────────────
  const { data: auditLogs = [], isLoading: loadingAudit, refetch: refetchAudit } = useQuery<AuditLogRow[]>({
    queryKey: ["super-admin-audit-logs", filterStore],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("id, store_id, user_id, user_email, action, entity_type, entity_id, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filterStore !== "all") q = q.eq("store_id", filterStore);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditLogRow[];
    },
    refetchInterval: 120_000, // 2 minutos — evita polling excessivo no banco
  });

  // ── Client Error Logs ─────────────────────────────────────────────────────
  const { data: errorLogs = [], isLoading: loadingErrors, refetch: refetchErrors } = useQuery<ClientErrorRow[]>({
    queryKey: ["super-admin-error-logs", filterStore],
    queryFn: async () => {
      let q = supabase
        .from("client_error_logs")
        .select("id, store_id, user_id, url, error_message, stack_trace, user_agent, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filterStore !== "all") q = q.eq("store_id", filterStore);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ClientErrorRow[];
    },
    refetchInterval: 120_000, // 2 minutos — evita polling excessivo no banco
  });

  const isLoading = activeTab === "audit" ? loadingAudit : loadingErrors;

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredAudit = auditLogs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.entity_type.toLowerCase().includes(term) ||
      (l.user_email ?? "").toLowerCase().includes(term)
    );
  });

  const filteredErrors = errorLogs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.error_message.toLowerCase().includes(term) ||
      (l.url ?? "").toLowerCase().includes(term)
    );
  });

  async function sendCriticalAlert() {
    setAlertSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("alert-critical-errors");
      if (error) throw new Error(error.message);
      const result = data as { ok: boolean; alerted: boolean; totalErrors?: number; message?: string };
      if (result.alerted) {
        toast.success(`Alerta enviado!`, {
          description: `E-mail com ${result.totalErrors} erro(s) enviado para luixlima2010p@gmail.com.`,
        });
      } else {
        toast.info("Sem erros críticos", {
          description: result.message ?? "Nenhum erro crítico na última hora.",
        });
      }
    } catch (err: any) {
      toast.error("Erro ao enviar alerta", { description: err.message });
    } finally {
      setAlertSending(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="font-serif text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Monitoramento de Logs
            </h2>
            <p className="text-sm text-muted-foreground">
              Auditoria de ações e erros capturados na plataforma em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/20"
              onClick={sendCriticalAlert}
              disabled={alertSending}
            >
              {alertSending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Bell className="h-4 w-4" />}
              Enviar Alerta Agora
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => activeTab === "audit" ? refetchAudit() : refetchErrors()}
              title="Recarregar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-muted/40 p-1 rounded-lg w-fit">
          {(["errors", "audit"] as LogsTab[]).map((tab) => {
            const icons = { errors: Bug, audit: Shield };
            const labels = { errors: "Erros de Frontend", audit: "Auditoria de Ações" };
            const counts = { errors: errorLogs.length, audit: auditLogs.length };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setExpandedId(null); setSearchTerm(""); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {labels[tab]}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  tab === "errors" && counts.errors > 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                )}>{counts[tab]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === "errors" ? "Filtrar por mensagem ou URL…" : "Filtrar por ação, entidade ou e-mail…"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="text-sm bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todas as lojas</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-border max-h-[560px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === "errors" ? (
          filteredErrors.length === 0 ? (
            <div className="py-12 text-center">
              <Bug className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Nenhum erro encontrado com esse filtro." : "Nenhum erro de frontend registrado. 🎉"}
              </p>
            </div>
          ) : (
            filteredErrors.map((log) => {
              const store = log.store_id ? (storeMap[log.store_id] ?? null) : null;
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="hover:bg-muted/10 transition-colors">
                  <button
                    className="w-full text-left px-5 py-3.5 flex items-start gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-red-600 dark:text-red-400 truncate">
                          {log.error_message}
                        </span>
                        {store && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground shrink-0">
                            {store.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatTime(log.created_at)}</span>
                        {log.url && (
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">{log.url}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform mt-0.5", isExpanded && "rotate-90")} />
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3 bg-muted/10 border-t border-border">
                      {log.stack_trace && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stack Trace</p>
                          <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-lg overflow-x-auto max-h-[180px] leading-relaxed whitespace-pre-wrap">
                            {log.stack_trace}
                          </pre>
                        </div>
                      )}
                      {log.user_agent && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">User Agent</p>
                          <p className="text-xs text-muted-foreground font-mono break-all">{log.user_agent}</p>
                        </div>
                      )}
                      {log.metadata && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Metadata</p>
                          <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-lg overflow-x-auto max-h-[120px] whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          // ── Audit Logs ────────────────────────────────────────────────────
          filteredAudit.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Nenhuma entrada encontrada com esse filtro." : "Nenhum log de auditoria registrado ainda."}
              </p>
            </div>
          ) : (
            filteredAudit.map((log) => {
              const store = storeMap[log.store_id] ?? null;
              const actionStyle = ACTION_STYLES[log.action] ?? ACTION_STYLES.INSERT;
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="hover:bg-muted/10 transition-colors">
                  <button
                    className="w-full text-left px-5 py-3 flex items-center gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", actionStyle.bg, actionStyle.text)}>
                      {log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.entity_type}</span>
                        {store && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground shrink-0">
                            {store.name}
                          </span>
                        )}
                        {log.user_email && (
                          <span className="text-xs text-muted-foreground truncate">
                            por {log.user_email}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTime(log.created_at)}</span>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", isExpanded && "rotate-90")} />
                  </button>
                  {isExpanded && log.payload && (
                    <div className="px-5 pb-4 bg-muted/10 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-3">Payload</p>
                      <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-lg overflow-x-auto max-h-[200px] whitespace-pre-wrap">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Footer status */}
      <div className="px-6 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Mostrando {activeTab === "errors" ? filteredErrors.length : filteredAudit.length} entradas · Atualiza a cada 2 min
        </p>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Monitoramento ativo</span>
        </div>
      </div>
    </section>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreRow | null>(null);
  const [membersStore, setMembersStore] = useState<StoreRow | null>(null);

  // ── Fetch all stores ─────────────────────────────────────────────────────
  const { data: stores = [], isLoading, error: storesError } = useQuery<StoreRow[]>({
    queryKey: ["super-admin-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, status, plan, created_at, updated_at, trial_started_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StoreRow[];
    },
  });

  // ── Fetch counts ──────────────────────────────────────────────────────────
  const { data: counts = {} } = useQuery<Record<string, { orders: number; members: number }>>({
    queryKey: ["super-admin-counts", stores.map((s) => s.id).join(",")],
    queryFn: async () => {
      if (stores.length === 0) return {};
      const storeIds = stores.map((s) => s.id);
      const [ordersRes, membersRes] = await Promise.all([
        supabase.from("orders").select("store_id").in("store_id", storeIds),
        supabase.from("store_members").select("store_id").in("store_id", storeIds),
      ]);
      const result: Record<string, { orders: number; members: number }> = {};
      for (const sid of storeIds) result[sid] = { orders: 0, members: 0 };
      for (const row of ordersRes.data ?? []) { if (result[row.store_id]) result[row.store_id].orders++; }
      for (const row of membersRes.data ?? []) { if (result[row.store_id]) result[row.store_id].members++; }
      return result;
    },
    enabled: stores.length > 0,
  });

  // ── Fetch Email Quota & Stats ─────────────────────────────────────────────
  const { data: emailStats = { todayCount: 0, byStore: {}, logs: [] }, isLoading: loadingEmailStats } = useQuery({
    queryKey: ["super-admin-email-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("id, store_id, status, error_message, created_at, recipient_type, event_type")
        .eq("channel", "email")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let todayCount = 0;
      const byStore: Record<string, { today: number; total: number; success: number; rateLimited: number; suppressed: number; error: number }> = {};

      for (const log of data || []) {
        const logDate = new Date(log.created_at);
        const isToday = logDate >= today;

        if (isToday) {
          todayCount++;
        }

        const sid = log.store_id;
        if (sid) {
          if (!byStore[sid]) {
            byStore[sid] = { today: 0, total: 0, success: 0, rateLimited: 0, suppressed: 0, error: 0 };
          }

          byStore[sid].total++;
          if (isToday) {
            byStore[sid].today++;
          }

          if (log.status === "success" || log.status === "sent") {
            byStore[sid].success++;
          } else if (log.status === "rate_limited") {
            byStore[sid].rateLimited++;
          } else if (log.status === "suppressed") {
            byStore[sid].suppressed++;
          } else {
            byStore[sid].error++;
          }
        }
      }

      return {
        todayCount,
        byStore,
        logs: data || [],
      };
    },
    refetchInterval: 30_000,
  });

  // ── Mutation: update plan ─────────────────────────────────────────────────
  const updatePlan = useMutation({
    mutationFn: async ({ storeId, plan }: { storeId: string; plan: PlanId }) => {
      const { error } = await supabase.from("stores").update({ plan } as any).eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: (_, { plan }) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-stores"] });
      toast.success(`Plano atualizado para ${PLAN_LABEL[plan]}`);
    },
    onError: (err: any) => toast.error("Erro ao atualizar plano", { description: err.message }),
  });

  // ── Mutation: update status ───────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: async ({ storeId, status }: { storeId: string; status: StoreStatus }) => {
      const { error } = await supabase
        .from("stores")
        .update({ 
          status,
          ...(status === "trial" ? { trial_started_at: new Date().toISOString() } : {})
        } as any)
        .eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-stores"] });
      toast.success(`Status atualizado para ${STATUS_CONFIG[status].label}`);
    },
    onError: (err: any) => toast.error("Erro ao atualizar status", { description: err.message }),
  });

  // ── Summary cards ─────────────────────────────────────────────────────────
  const summaryCards = [
    { label: "Lojas totais",    value: stores.length,                                          icon: Store,        color: "text-primary" },
    { label: "Ativas",          value: stores.filter((s) => s.status === "active").length,     icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Trial",           value: stores.filter((s) => s.status === "trial").length,      icon: Clock,        color: "text-amber-600" },
    { label: "Plano Pro",       value: stores.filter((s) => s.plan === "pro").length,          icon: Sparkles,     color: "text-violet-600" },
    { label: "Total de pedidos", value: Object.values(counts).reduce((a, c) => a + c.orders, 0), icon: ShoppingBag, color: "text-primary" },
  ];

  // ── Storage Sweep States & Handlers ───────────────────────────────────────
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState<{
    orphans: { bucket: string; path: string; size: number }[];
    totalSize: number;
    totalCount: number;
  } | null>(null);
  const [cleanResult, setCleanResult] = useState<{
    deleted: number;
    freedBytes: number;
  } | null>(null);
  const [cleanConfirmOpen, setCleanConfirmOpen] = useState(false);

  async function handleScanStorage() {
    setSweepLoading(true);
    setCleanResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("storage-sweep", {
        body: { action: "scan" },
      });
      if (error) throw new Error(error.message);
      setSweepResult(data);
      toast.success("Varredura concluída", {
        description: `Encontrados ${data.totalCount} arquivos órfãos (${formatBytes(data.totalSize)}).`,
      });
    } catch (err: any) {
      toast.error("Erro na varredura", { description: err.message });
    } finally {
      setSweepLoading(false);
    }
  }

  async function handleCleanStorage() {
    setSweepLoading(true);
    setCleanConfirmOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke("storage-sweep", {
        body: { action: "clean" },
      });
      if (error) throw new Error(error.message);
      setCleanResult(data);
      setSweepResult(null);
      toast.success("Limpeza concluída!", {
        description: `Removidos ${data.deleted} arquivos, liberando ${formatBytes(data.freedBytes)}.`,
      });
    } catch (err: any) {
      toast.error("Erro na limpeza", { description: err.message });
    } finally {
      setSweepLoading(false);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl">Plataforma Scalius</h1>
          <p className="text-muted-foreground">
            Olá, <strong>{user?.full_name}</strong>. Gerencie todas as lojas e lojistas da plataforma.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Nova loja
        </Button>
      </header>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <p className="font-serif text-2xl">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Stores table ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
        <header className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-xl">Lojas cadastradas</h2>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["super-admin-stores"] })} title="Recarregar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : storesError ? (
          <div className="p-12 text-center text-destructive">
            <AlertCircle className="h-10 w-10 mx-auto mb-3" />
            <p className="font-semibold">Erro ao carregar lojas</p>
            <p className="text-sm text-muted-foreground">{(storesError as Error).message}</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma loja cadastrada ainda.</p>
            <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Criar primeira loja
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 text-xs text-muted-foreground uppercase tracking-wider font-medium border-b border-border bg-muted/30">
              <span>Loja</span>
              <span>Status</span>
              <span>Plano</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Membros</span>
              <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Pedidos</span>
              <span>Ações</span>
            </div>

            {stores.map((store) => {
              const c = counts[store.id] ?? { orders: 0, members: 0 };
              const statusCfg = STATUS_CONFIG[store.status] ?? STATUS_CONFIG.suspended;
              const StatusIcon = statusCfg.icon;
              const trialCounter = getTrialCounter(store);

              return (
                <div
                  key={store.id}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 lg:gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Name / slug */}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{store.name}</div>
                    <a
                      href={`https://${store.slug}.scalius.com.br`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors truncate flex items-center gap-1"
                    >
                      {store.slug}.scalius.com.br <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>

                  {/* Status dropdown */}
                  <div className="space-y-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity",
                            statusCfg.className
                          )}
                          disabled={updateStatus.isPending}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                          <ChevronDown className="h-3 w-3 ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40">
                        {(Object.keys(STATUS_CONFIG) as StoreStatus[]).map((s) => {
                          const cfg = STATUS_CONFIG[s];
                          const Ic = cfg.icon;
                          return (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateStatus.mutate({ storeId: store.id, status: s })}
                              disabled={store.status === s}
                              className="flex items-center gap-2"
                            >
                              <Ic className="h-3.5 w-3.5" />
                              {cfg.label}
                              {store.status === s && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {trialCounter && (
                      <div
                        className={cn(
                          "inline-flex max-w-full flex-col rounded-md border px-2 py-1 text-[11px] leading-tight",
                          trialCounter.expired
                            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
                            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                        )}
                        title={trialCounter.detail}
                      >
                        <span className="font-semibold">{trialCounter.label}</span>
                        <span className="text-[10px] opacity-75">{trialCounter.detail}</span>
                      </div>
                    )}
                  </div>

                  {/* Plan badge + dropdown */}
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer hover:opacity-80 transition-opacity",
                            PLAN_BADGE_CLASSES[store.plan]
                          )}
                          disabled={updatePlan.isPending}
                        >
                          {store.plan === "pro" && <Sparkles className="h-3 w-3" />}
                          {PLAN_LABEL[store.plan]}
                          <ChevronDown className="h-3 w-3 ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        {(["essencial", "pro"] as PlanId[]).map((p) => (
                          <DropdownMenuItem
                            key={p}
                            onClick={() => updatePlan.mutate({ storeId: store.id, plan: p })}
                            disabled={store.plan === p}
                            className="flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              {p === "pro" && <Sparkles className="h-3.5 w-3.5 text-violet-500" />}
                              {PLAN_LABEL[p]}
                            </span>
                            {store.plan === p && <Check className="h-3.5 w-3.5 text-primary" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Members */}
                  <div className="text-sm">
                    <span className="text-muted-foreground lg:hidden">Membros: </span>
                    <button
                      onClick={() => setMembersStore(store)}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.members} {c.members === 1 ? "membro" : "membros"}
                    </button>
                  </div>

                  {/* Orders */}
                  <div className="text-sm">
                    <span className="text-muted-foreground lg:hidden">Pedidos: </span>
                    {c.orders}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setMembersStore(store)}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">Membros</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditStore(store)}
                      title="Editar loja"
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

      {/* ── Email Quota Section (Super-Admin eyes only) ────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-soft">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="font-serif text-xl flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary animate-pulse" />
              Consumo de Quota de E-mails (Resend)
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitoramento em tempo real do limite diário do plano Free (100 e-mails/dia).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 gap-1.5 py-1 px-2.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Teto: 100 envios/dia
            </Badge>
          </div>
        </header>

        {loadingEmailStats ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Center: Quota progress bar and stats */}
            <div className="lg:col-span-1 rounded-lg border border-border bg-muted/20 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Consumo de Hoje</span>
                  <span className="text-xl font-serif font-bold">
                    {emailStats.todayCount} <span className="text-xs text-muted-foreground font-sans">/ 100 e-mails</span>
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      emailStats.todayCount >= 90 ? "bg-red-500" :
                      emailStats.todayCount >= 70 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(100, (emailStats.todayCount / 100) * 100)}%` }}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {emailStats.todayCount >= 100 ? (
                    <span className="text-red-500 font-semibold flex items-center gap-1">
                      ⚠️ Limite atingido! Próximos e-mails serão bloqueados até a meia-noite (UTC).
                    </span>
                  ) : emailStats.todayCount >= 80 ? (
                    <span className="text-amber-600 font-semibold">
                      ⚠️ Próximo do limite diário. Prepare-se para fazer upgrade manual no painel do Resend!
                    </span>
                  ) : (
                    "Margem de quota diária segura. Monitorando disparos das lojas."
                  )}
                </p>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total de logs</p>
                  <p className="font-serif text-lg font-semibold">{emailStats.logs.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status do plano</p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 py-1 px-2 rounded-full inline-block">
                    Free (Upgrade Manual OK)
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Store breakdown */}
            <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/10">
                <h3 className="font-semibold text-sm">Disparos por Loja</h3>
              </div>
              <div className="divide-y divide-border max-h-[260px] overflow-y-auto">
                {stores.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma loja cadastrada para listar.</div>
                ) : (
                  stores.map((s) => {
                    const stats = emailStats.byStore[s.id] ?? { today: 0, total: 0, success: 0, rateLimited: 0, suppressed: 0, error: 0 };
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-4 p-3 hover:bg-muted/10 transition-colors text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.slug}.scalius.com.br</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <p className="font-semibold">{stats.today} hoje</p>
                            <p className="text-xs text-muted-foreground">{stats.total} total</p>
                          </div>

                          <div className="flex items-center gap-1">
                            {stats.success > 0 && (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 text-[10px] px-1.5 py-0">
                                {stats.success} OK
                              </Badge>
                            )}
                            {stats.rateLimited > 0 && (
                              <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 text-[10px] px-1.5 py-0">
                                {stats.rateLimited} Limite
                              </Badge>
                            )}
                            {stats.suppressed > 0 && (
                              <Badge variant="secondary" className="bg-zinc-50 text-zinc-700 dark:bg-zinc-950/20 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-900/50 text-[10px] px-1.5 py-0">
                                {stats.suppressed} Bloq.
                              </Badge>
                            )}
                            {stats.error > 0 && (
                              <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/50 text-[10px] px-1.5 py-0">
                                {stats.error} Erro
                              </Badge>
                            )}
                            {stats.total === 0 && (
                              <span className="text-xs text-muted-foreground italic px-2">Sem disparos</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Storage Sweep Section (Super-Admin eyes only) ─────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-soft">
        <div className="space-y-1">
          <h2 className="font-serif text-xl flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Manutenção de Storage
          </h2>
          <p className="text-sm text-muted-foreground">
            Verifique e elimine arquivos de imagens órfãos (de produtos, categorias ou logos deletados) que continuam ocupando espaço nos buckets.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleScanStorage}
            disabled={sweepLoading}
            variant="outline"
            className="gap-2"
          >
            {sweepLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Varrer Storage
          </Button>

          {sweepResult && sweepResult.totalCount > 0 && (
            <Button
              onClick={() => setCleanConfirmOpen(true)}
              disabled={sweepLoading}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar {sweepResult.totalCount} Arquivos Órfãos
            </Button>
          )}
        </div>

        {sweepResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Arquivos Órfãos</span>
                <p className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-500">
                  {sweepResult.totalCount}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Espaço Desperdiçado</span>
                <p className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-500">
                  {formatBytes(sweepResult.totalSize)}
                </p>
              </div>
            </div>

            {sweepResult.orphans.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/10">
                  <h3 className="font-semibold text-sm">Arquivos Órfãos Encontrados</h3>
                </div>
                <div className="divide-y divide-border max-h-[300px] overflow-y-auto font-mono text-xs">
                  {sweepResult.orphans.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 hover:bg-muted/10 transition-colors">
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="text-primary font-semibold">{file.bucket}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="truncate text-foreground/80 block md:inline">{file.path}</span>
                      </div>
                      <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-6 text-center text-sm text-emerald-800 dark:text-emerald-300">
                <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                Nenhum arquivo órfão encontrado. Seu storage está 100% limpo!
              </div>
            )}
          </div>
        )}

        {cleanResult && (
          <div className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-6 text-center text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
            <Check className="h-6 w-6 text-emerald-500 mx-auto" />
            <p className="font-semibold text-lg">Limpeza Realizada com Sucesso!</p>
            <p className="text-muted-foreground text-sm">
              Foram excluídos <strong>{cleanResult.deleted}</strong> arquivos órfãos, liberando <strong>{formatBytes(cleanResult.freedBytes)}</strong> de espaço.
            </p>
          </div>
        )}
      </section>

      {/* ── Logs Monitor Panel ──────────────────────────────────────────── */}
      <LogsMonitorPanel stores={stores} />

      {/* ── Plan feature legend ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-soft">
        <h2 className="font-serif text-xl">Comparativo de planos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="pb-3 pr-6 font-medium">Feature</th>
                <th className="pb-3 px-4 font-medium text-center">Essencial</th>
                <th className="pb-3 px-4 font-medium text-center text-violet-600 dark:text-violet-400">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["E-mails automáticos para a loja", true, true],
                ["E-mails automáticos para o cliente", false, true],
                ["Etiqueta Melhor Envio 1-clique", false, true],
                ["Máximo de usuários admin", "2", "Ilimitado"],
                ["Sem limite de emails", true, true],
              ].map(([feature, essencial, pro]) => (
                <tr key={feature as string} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 pr-6 font-medium">{feature as string}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof essencial === "boolean" ? (
                      essencial ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span className="text-sm font-medium">{essencial}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof pro === "boolean" ? (
                      pro ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Dialogs / Sheets ────────────────────────────────────────────── */}
      <StoreDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["super-admin-stores"] })}
      />

      {editStore && (
        <StoreDialog
          open={!!editStore}
          onClose={() => setEditStore(null)}
          initial={editStore}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["super-admin-stores"] })}
        />
      )}

      <MembersSheet
        store={membersStore}
        onClose={() => setMembersStore(null)}
      />

      {/* Clean Confirm Dialog */}
      <Dialog open={cleanConfirmOpen} onOpenChange={setCleanConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-destructive">
              Limpar arquivos órfãos?
            </DialogTitle>
            <DialogDescription>
              Esta ação removerá permanentemente os {sweepResult?.totalCount} arquivos órfãos identificados nos buckets de storage. Esta operação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setCleanConfirmOpen(false)} disabled={sweepLoading}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleCleanStorage} disabled={sweepLoading}>
              {sweepLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
