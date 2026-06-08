import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Store, MapPin, Loader2, Users, AlertTriangle, Package, Lightbulb } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useMockData } from "@/hooks/useMockData";
import { byStore, updateStoreSettings } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import type { StoreSettings } from "@/types/database";
import { PaymentSettingsSection } from "@/components/admin/PaymentSettingsSection";
import { NotificationsSettingsSection } from "@/components/admin/NotificationsSettingsSection";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ActiveSessionsSection } from "@/components/admin/ActiveSessionsSection";
import { useStoreRole } from "@/hooks/useStoreRole";
import { AuditLogsPanel } from "@/components/admin/AuditLogsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Link } from "react-router-dom";
import { ImageUpload } from "@/components/ui/image-upload";
import { hexToHsl, hslToHex } from "@/lib/utils";
import { geocodeAddress, buildAddressString } from "@/lib/distance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

const schema = z.object({
  display_name: z.string().trim().min(2, "Informe o nome da loja").max(80),
  tagline: z.string().trim().max(280).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  address_street: z.string().trim().max(300).optional().or(z.literal("")),
  address_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  address_city: z.string().trim().max(80).optional().or(z.literal("")),
  address_state: z.string().trim().max(40).optional().or(z.literal("")),
  opening_hours: z.string().trim().max(160).optional().or(z.literal("")),
  brand_color: z.string().trim().regex(HEX_REGEX, "Use o formato hexadecimal (ex: #EA580C)"),
  secondary_color: z.string().trim().regex(HEX_REGEX, "Use o formato hexadecimal (ex: #000000)").optional().or(z.literal("")),
  logo_url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  banner_url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  favicon_url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  contact_message_template: z.string().trim().max(280).optional().or(z.literal("")),
  payment_provider: z.enum(["manual", "mercadopago", "infinitepay"]).default("manual"),
  pix_key: z.string().trim().max(140).optional().or(z.literal("")),
  requires_payment_proof: z.boolean().default(false),
  show_out_of_stock: z.boolean().default(true),
  show_banner: z.boolean().default(true),
  latitude: z.string().trim().optional().or(z.literal("")),
  longitude: z.string().trim().optional().or(z.literal("")),
  
  // National Shipping
  national_shipping_enabled: z.boolean().default(false),
  melhorenvio_token: z.string().trim().optional().or(z.literal("")),
  melhorenvio_sandbox: z.boolean().default(false),
  sender_postal_code: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido (ex: 00000-000)").optional().or(z.literal("")),
  enabled_shipping_services: z.array(z.number()).default([1, 2]),
  shipping_markup_percent: z.number().min(0).max(100).default(0),
  melhorenvio_insurance: z.boolean().default(true),
  default_package_width_cm: z.number().min(1).max(200).default(30),
  default_package_height_cm: z.number().min(1).max(200).default(30),
  default_package_length_cm: z.number().min(1).max(200).default(40),
  default_package_weight_kg: z.number().min(0.1).max(50).default(1),
  sender_document: z.string().optional().or(z.literal("")),
  sender_email: z.string().email().optional().or(z.literal("")),
  // Remetente — Dados da etiqueta
  sender_name: z.string().trim().max(80).optional().or(z.literal("")),
  sender_phone: z.string().trim().max(30).optional().or(z.literal("")),
  // Endereço de Despacho
  sender_address: z.string().trim().max(120).optional().or(z.literal("")),
  sender_address_number: z.string().trim().max(20).optional().or(z.literal("")),
  sender_complement: z.string().trim().max(80).optional().or(z.literal("")),
  sender_neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  sender_city: z.string().trim().max(80).optional().or(z.literal("")),
  sender_state: z.string().trim().max(2).optional().or(z.literal("")),
  // Serviços adicionais Correios
  label_own_hand: z.boolean().default(false),
  label_receipt: z.boolean().default(false),
  label_collect: z.boolean().default(false),
  
  // Notifications
  notif_push_new_order: z.boolean().default(true),
  notif_push_payment_confirmed: z.boolean().default(true),
  notif_push_status_change: z.boolean().default(false),
  notif_webhook_enabled: z.boolean().default(false),
  notif_webhook_url: z.string().trim().optional().or(z.literal("")),
  notification_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  store_new_order: z.boolean().default(true),
  store_payment_confirmed: z.boolean().default(true),
  store_order_cancelled: z.boolean().default(true),
  customer_new_order: z.boolean().default(false),
  customer_payment_confirmed: z.boolean().default(true),
  customer_order_ready: z.boolean().default(true),
  customer_order_dispatched: z.boolean().default(true),
  customer_tracking_added: z.boolean().default(true),
  customer_order_cancelled: z.boolean().default(true),
  customer_order_delivered: z.boolean().default(false),
  customer_order_picked_up: z.boolean().default(false),
  sound_enabled: z.boolean().default(true),
  sound_volume: z.enum(["baixo", "normal", "alto"]).default("normal"),
  silent_hours_enabled: z.boolean().default(false),
  silent_hours_start: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (ex: 20:00)").default("20:00"),
  silent_hours_end: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (ex: 08:00)").default("08:00"),
  category_style: z.enum(["pill", "compact"]).default("pill"),
  show_category_images: z.boolean().default(false),
  show_revenue_to_staff: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.national_shipping_enabled) {
    if (!data.melhorenvio_token || data.melhorenvio_token.length === 0) {
      ctx.addIssue({ code: "custom", path: ["melhorenvio_token"], message: "Token é obrigatório quando frete nacional está ativo" });
    }
    if (!data.sender_postal_code || !/^\d{5}-?\d{3}$/.test(data.sender_postal_code)) {
      ctx.addIssue({ code: "custom", path: ["sender_postal_code"], message: "CEP de origem obrigatório e válido (ex: 00000-000)" });
    }
    if (!data.enabled_shipping_services || data.enabled_shipping_services.length === 0) {
      ctx.addIssue({ code: "custom", path: ["enabled_shipping_services"], message: "Selecione ao menos 1 serviço de entrega" });
    }
  }
  // Must connect MP before saving mercadopago provider
  // (validation for connected state is done in the component itself — here we just allow saving)
});

type Values = z.infer<typeof schema>;

export default function AdminSettings() {
  const store = useActiveStore();
  const snapshot = useMockData();
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const queryClient = useQueryClient();
  const { isOwner, isManager } = useStoreRole();

  const { data: settings = null, isLoading } = useStoreSettings(store?.id);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: "",
      tagline: "",
      whatsapp: "",
      address_street: "",
      address_number: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      opening_hours: "",
      brand_color: "#ea580c",
      secondary_color: "#000000",
      logo_url: "",
      banner_url: "",
      favicon_url: "",
      contact_message_template: "",
      payment_provider: "manual" as const,
      pix_key: "",
      requires_payment_proof: false,
      show_out_of_stock: true,
      show_banner: true,
      latitude: "",
      longitude: "",
      national_shipping_enabled: false,
      melhorenvio_token: "",
      melhorenvio_sandbox: false,
      sender_postal_code: "",
      enabled_shipping_services: [1, 2],
      shipping_markup_percent: 0,
      melhorenvio_insurance: true,
      default_package_width_cm: 30,
      default_package_height_cm: 30,
      default_package_length_cm: 40,
      default_package_weight_kg: 1,
      sender_document: "",
      sender_email: "",
      sender_name: "",
      sender_phone: "",
      sender_address: "",
      sender_address_number: "",
      sender_complement: "",
      sender_neighborhood: "",
      sender_city: "",
      sender_state: "",
      label_own_hand: false,
      label_receipt: false,
      label_collect: false,
      notif_push_new_order: true,
      notif_push_payment_confirmed: true,
      notif_push_status_change: false,
      notif_webhook_enabled: false,
      notif_webhook_url: "",
      notification_email: "",
      store_new_order: true,
      store_payment_confirmed: true,
      store_order_cancelled: true,
      customer_new_order: false,
      customer_payment_confirmed: true,
      customer_order_ready: true,
      customer_order_dispatched: true,
      customer_tracking_added: true,
      customer_order_cancelled: true,
      customer_order_delivered: false,
      customer_order_picked_up: false,
      sound_enabled: true,
      sound_volume: "normal",
      silent_hours_enabled: false,
      silent_hours_start: "20:00",
      silent_hours_end: "08:00",
      category_style: "pill" as const,
      show_category_images: false,
      show_revenue_to_staff: true,
    },
  });

  const watched = form.watch();

  const { data: noDimensionsCount = 0 } = useQuery({
    queryKey: ["products-no-dimensions", store?.id],
    queryFn: async () => {
      if (!store?.id) return 0;
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id)
        .is("weight_kg", null);
      if (error) throw error;
      return count || 0;
    },
    enabled: watched.national_shipping_enabled && !!store?.id,
  });

  // Hydrate when store/settings become available
  useEffect(() => {
    if (!settings) return;
    form.reset({
      display_name: settings.display_name ?? "",
      tagline: settings.tagline ?? "",
      whatsapp: settings.whatsapp ?? "",
      address_street: settings.address_street ?? "",
      address_number: settings.address_number ?? "",
      address_neighborhood: settings.address_neighborhood ?? "",
      address_city: settings.address_city ?? "",
      address_state: settings.address_state ?? "",
      opening_hours: settings.opening_hours ?? "",
      brand_color: settings.brand_color ? hslToHex(settings.brand_color) : "#ea580c",
      secondary_color: settings.secondary_color ? hslToHex(settings.secondary_color) : "#000000",
      logo_url: settings.logo_url ?? "",
      banner_url: settings.banner_url ?? "",
      favicon_url: settings.favicon_url ?? "",
      contact_message_template: settings.contact_message_template ?? "",
      payment_provider: (settings.payment_provider as "manual" | "mercadopago" | "infinitepay") ?? "manual",
      pix_key: settings.pix_key ?? "",
      requires_payment_proof: settings.requires_payment_proof ?? false,
      show_out_of_stock: settings.show_out_of_stock ?? true,
      show_banner: settings.show_banner ?? true,
      latitude: settings.latitude ? String(settings.latitude) : "",
      longitude: settings.longitude ? String(settings.longitude) : "",
      national_shipping_enabled: settings.national_shipping_enabled ?? false,
      melhorenvio_token: settings.melhorenvio_token ?? "",
      melhorenvio_sandbox: settings.melhorenvio_sandbox ?? false,
      sender_postal_code: settings.sender_postal_code ?? "",
      enabled_shipping_services: settings.enabled_shipping_services ?? [1, 2],
      shipping_markup_percent: settings.shipping_markup_percent ?? 0,
      melhorenvio_insurance: settings.melhorenvio_insurance ?? true,
      default_package_width_cm: settings.default_package_width_cm ?? 30,
      default_package_height_cm: settings.default_package_height_cm ?? 30,
      default_package_length_cm: settings.default_package_length_cm ?? 40,
      default_package_weight_kg: settings.default_package_weight_kg ?? 1,
      sender_document: settings.sender_document ?? "",
      sender_email: settings.sender_email ?? "",
      sender_name: settings.sender_name ?? "",
      sender_phone: settings.sender_phone ?? "",
      sender_address: settings.sender_address ?? "",
      sender_address_number: settings.sender_address_number ?? "",
      sender_complement: settings.sender_complement ?? "",
      sender_neighborhood: settings.sender_neighborhood ?? "",
      sender_city: settings.sender_city ?? "",
      sender_state: settings.sender_state ?? "",
      label_own_hand: settings.label_own_hand ?? false,
      label_receipt: settings.label_receipt ?? false,
      label_collect: settings.label_collect ?? false,
      notif_push_new_order: settings.notif_push_new_order ?? true,
      notif_push_payment_confirmed: settings.notif_push_payment_confirmed ?? true,
      notif_push_status_change: settings.notif_push_status_change ?? false,
      notif_webhook_enabled: settings.notif_webhook_enabled ?? false,
      notif_webhook_url: settings.notif_webhook_url ?? "",
      notification_email: settings.notification_email ?? "",
      store_new_order: settings.notification_preferences?.store_new_order ?? true,
      store_payment_confirmed: settings.notification_preferences?.store_payment_confirmed ?? true,
      store_order_cancelled: settings.notification_preferences?.store_order_cancelled ?? true,
      customer_new_order: settings.notification_preferences?.customer_new_order ?? false,
      customer_payment_confirmed: settings.notification_preferences?.customer_payment_confirmed ?? true,
      customer_order_ready: settings.notification_preferences?.customer_order_ready ?? true,
      customer_order_dispatched: settings.notification_preferences?.customer_order_dispatched ?? true,
      customer_tracking_added: settings.notification_preferences?.customer_tracking_added ?? true,
      customer_order_cancelled: settings.notification_preferences?.customer_order_cancelled ?? true,
      customer_order_delivered: settings.notification_preferences?.customer_order_delivered ?? false,
      customer_order_picked_up: settings.notification_preferences?.customer_order_picked_up ?? false,
      sound_enabled: settings.sound_enabled ?? true,
      sound_volume: settings.sound_volume ?? "normal",
      silent_hours_enabled: settings.silent_hours_enabled ?? false,
      silent_hours_start: settings.silent_hours_start ?? "20:00",
      silent_hours_end: settings.silent_hours_end ?? "08:00",
      category_style: (settings.category_style as "pill" | "compact") ?? "pill",
      show_category_images: settings.show_category_images ?? false,
      show_revenue_to_staff: settings.show_revenue_to_staff ?? true,
    });
  }, [settings, form]);

  if (!store || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = async (values: Values) => {
    if (!store) return;
    setSaving(true);
    try {
      const settingsPromise = supabase
        .from("store_settings")
        .upsert({
          store_id: store.id,
          store_name: values.display_name,
          message: values.tagline || null,
          whatsapp_number: values.whatsapp || null,
          address_street: values.address_street || null,
          address_number: values.address_number || null,
          address_neighborhood: values.address_neighborhood || null,
          address_city: values.address_city || null,
          address_state: values.address_state || null,
          opening_hours: values.opening_hours || null,
          primary_color: hexToHsl(values.brand_color),
          secondary_color: values.secondary_color ? hexToHsl(values.secondary_color) : null,
          logo_url: values.logo_url || null,
          banner_url: values.banner_url || null,
          favicon_url: values.favicon_url || null,
          contact_message_template: values.contact_message_template || null,
          payment_provider: values.payment_provider,
          pix_key: values.payment_provider === "manual" ? (values.pix_key || null) : null,
          requires_payment_proof: values.payment_provider === "manual" ? values.requires_payment_proof : false,
          show_out_of_stock: values.show_out_of_stock,
          show_banner: values.show_banner,
          latitude: values.latitude ? parseFloat(values.latitude) : null,
          longitude: values.longitude ? parseFloat(values.longitude) : null,
          national_shipping_enabled: values.national_shipping_enabled,
          melhorenvio_sandbox: values.melhorenvio_sandbox,
          sender_postal_code: values.sender_postal_code || null,
          enabled_shipping_services: values.enabled_shipping_services,
          shipping_markup_percent: values.shipping_markup_percent,
          melhorenvio_insurance: values.melhorenvio_insurance,
          default_package_width_cm: values.default_package_width_cm,
          default_package_height_cm: values.default_package_height_cm,
          default_package_length_cm: values.default_package_length_cm,
          default_package_weight_kg: values.default_package_weight_kg,
          sender_document: values.sender_document || null,
          sender_email: values.sender_email || null,
          sender_name: values.sender_name || null,
          sender_phone: values.sender_phone || null,
          sender_address: values.sender_address || null,
          sender_address_number: values.sender_address_number || null,
          sender_complement: values.sender_complement || null,
          sender_neighborhood: values.sender_neighborhood || null,
          sender_city: values.sender_city || null,
          sender_state: values.sender_state || null,
          label_own_hand: values.label_own_hand,
          label_receipt: values.label_receipt,
          label_collect: values.label_collect,
          notif_push_new_order: values.notif_push_new_order,
          notif_push_payment_confirmed: values.notif_push_payment_confirmed,
          notif_push_status_change: values.notif_push_status_change,
          notif_webhook_enabled: values.notif_webhook_enabled,
          notif_webhook_url: values.notif_webhook_url || null,
          notification_email: values.notification_email || null,
          notification_preferences: {
            store_new_order: values.store_new_order,
            store_payment_confirmed: values.store_payment_confirmed,
            store_order_cancelled: values.store_order_cancelled,
            customer_new_order: values.customer_new_order,
            customer_payment_confirmed: values.customer_payment_confirmed,
            customer_order_ready: values.customer_order_ready,
            customer_order_dispatched: values.customer_order_dispatched,
            customer_tracking_added: values.customer_tracking_added,
            customer_order_cancelled: values.customer_order_cancelled,
            customer_order_delivered: values.customer_order_delivered,
            customer_order_picked_up: values.customer_order_picked_up,
          } as any,
          sound_enabled: values.sound_enabled,
          sound_volume: values.sound_volume,
          silent_hours_enabled: values.silent_hours_enabled,
          silent_hours_start: values.silent_hours_start,
          silent_hours_end: values.silent_hours_end,
          category_style: values.category_style,
          show_category_images: values.show_category_images,
          show_revenue_to_staff: values.show_revenue_to_staff,
        }, { onConflict: "store_id" });

      const secretsPromise = supabase
        .from("store_secrets")
        .upsert({
          store_id: store.id,
          melhorenvio_token: values.melhorenvio_token || null,
        }, { onConflict: "store_id" });

      const [settingsRes, secretsRes] = await Promise.all([settingsPromise, secretsPromise]);

      if (settingsRes.error) throw settingsRes.error;
      if (secretsRes.error) throw secretsRes.error;
      
      queryClient.invalidateQueries({ queryKey: ["store-settings", store.id] });

      toast.success("Configurações salvas", {
        description: "As alterações já estão visíveis na loja.",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar", {
        description: "Tente novamente em alguns instantes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const previewStyle = {
    ["--primary" as any]: watched.brand_color ? hexToHsl(watched.brand_color) : "22 100% 50%",
    ...(watched.secondary_color ? { ["--accent" as any]: hexToHsl(watched.secondary_color) } : {}),
  } as React.CSSProperties;


  return (
    <RoleGuard permission="manage_settings">
      <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Configurações da loja</h1>
        <p className="text-muted-foreground mt-1">
          Personalize identidade, contato e mensagem da {store.name}.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identidade */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Identidade</h2>

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da loja *</FormLabel>
                  <FormControl><Input placeholder="Ex: Minha Loja" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem da loja</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Os melhores produtos para o seu dia a dia. Entregamos na sua região."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Aparece na home pública como destaque principal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo / Perfil (URL da imagem)</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      bucket="store-logos"
                      pathPrefix={`${store.id}/logo`}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="https://..."
                      aspect={1}
                      maxWidth={500}
                      quality={0.82}
                    />
                  </FormControl>
                  <FormDescription>
                    Opcional. Aparecerá cortada entre o banner e o conteúdo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banner_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner da loja (URL da imagem)</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      bucket="store-logos"
                      pathPrefix={`${store.id}/banner`}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="https://..."
                      aspect={16/4}
                      showBannerGuides
                      maxWidth={1920}
                      quality={0.85}
                    />
                  </FormControl>
                  <FormDescription>
                    Opcional. Aparece no topo da página inicial (160-200px de altura).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_banner"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="font-medium">Exibir área de banner</FormLabel>
                    <FormDescription className="text-xs mt-0.5">
                      Se desativado, o banner e o espaço reservado a ele são completamente ocultados na vitrine.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favicon_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone do site (favicon)</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      bucket="store-logos"
                      pathPrefix={`${store.id}/favicon`}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="https://..."
                      aspect={1}
                      maxWidth={128}
                      quality={0.80}
                      outputFormat="image/png"
                    />
                  </FormControl>
                  <FormDescription>
                    Aparece na aba do navegador. Formato PNG/ICO, recomendado 32x32px.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Identidade visual */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Cores da loja</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Use o formato Hexadecimal (ex: #EA580C).
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor principal *</FormLabel>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="h-10 w-10 rounded-md border border-border cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/20 transition-all"
                          style={{ background: field.value || "#ea580c" }}
                          onClick={() => document.getElementById("color-picker-brand")?.click()}
                        />
                        <input
                          id="color-picker-brand"
                          type="color"
                          className="sr-only"
                          value={field.value || "#ea580c"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                      <FormControl><Input placeholder="#EA580C" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor secundária (opcional)</FormLabel>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="h-10 w-10 rounded-md border border-border cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/20 transition-all"
                          style={{ background: field.value || "transparent" }}
                          onClick={() => document.getElementById("color-picker-secondary")?.click()}
                        />
                        <input
                          id="color-picker-secondary"
                          type="color"
                          className="sr-only"
                          value={field.value || "#000000"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                      <FormControl><Input placeholder="#000000" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live preview */}
            <div style={previewStyle} className="rounded-lg border border-border p-4 bg-background">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Pré-visualização
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Store className="h-4 w-4" />
                </span>
                <span className="font-serif text-lg">{watched.display_name || store.name}</span>
                <Button type="button" size="sm">Botão principal</Button>
                <Button type="button" size="sm" variant="outline">Secundário</Button>
              </div>
            </div>
          </section>

          {/* Layout das categorias */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Layout das categorias</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Escolha como as categorias serão exibidas na sua página inicial pública.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category_style"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Estilo das Categorias</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estilo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pill">Pills Arredondados (Padrão)</SelectItem>
                        <SelectItem value="compact">Quadrados Compactos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione o estilo visual das abas de categorias.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_category_images"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                    <div>
                      <FormLabel className="font-medium">Exibir foto nas categorias</FormLabel>
                      <FormDescription className="text-xs mt-0.5">
                        Se ativo, as categorias exibirão um círculo com foto/mockup em vez da primeira letra.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Contato */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Contato</h2>

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl><Input placeholder="+55 11 90000-0000" {...field} /></FormControl>
                  <FormDescription>Usado nos botões de contato e pedidos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_message_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem padrão do WhatsApp</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Olá! Gostaria de fazer um pedido pela loja..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opening_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário de funcionamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Segunda a sábado, das 08:00 às 18:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Pagamentos */}
          <PaymentSettingsSection
            form={form}
            storeId={store.id}
            savedProvider={settings?.payment_provider as "manual" | "mercadopago" | "infinitepay" | undefined}
          />

          {/* Gestão de Estoque */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Gestão de estoque</h2>
            
            <FormField
              control={form.control}
              name="show_out_of_stock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="font-medium">Exibir produtos esgotados no catálogo</FormLabel>
                    <FormDescription className="text-xs mt-0.5">
                      Se ativo, produtos com estoque zero aparecem com badge "Esgotado". Se desativado, eles são ocultados.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </section>

          {/* Entregas Nacionais */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl">Entregas Nacionais</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configure entregas para todo o Brasil via transportadoras
                </p>
              </div>
              <FormField
                control={form.control}
                name="national_shipping_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {watched.national_shipping_enabled && (
              <div className="space-y-6 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                {/* Integração Melhor Envio */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Integração Melhor Envio
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="melhorenvio_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token de API *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="eyJ0eXAiOiJKV1QiLCJhbG..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Obtenha seu token em{" "}
                          <a href="https://melhorenvio.com.br/painel/gerenciar/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            melhorenvio.com.br/painel/gerenciar/tokens
                          </a>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="melhorenvio_sandbox"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
                        <div className="space-y-1">
                          <FormLabel className="text-base text-amber-800 dark:text-amber-300">Modo Sandbox (Testes)</FormLabel>
                          <FormDescription className="max-w-[400px] text-amber-700/80 dark:text-amber-400/80">
                            Ative se o token foi gerado no ambiente de testes do Melhor Envio ({" "}
                            <a href="https://sandbox.melhorenvio.com.br" target="_blank" rel="noreferrer" className="underline">sandbox.melhorenvio.com.br</a>
                            ). Desative para usar tokens de produção.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="melhorenvio_insurance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                        <div className="space-y-1">
                          <FormLabel className="text-base">Seguro de Carga (Ad Valorem)</FormLabel>
                          <FormDescription className="max-w-[400px]">
                            Proteja sua loja contra perdas ou roubos. O custo do seguro é calculado sobre o valor dos produtos e <strong>repassado ao cliente</strong> no preço final do frete. Garante o reembolso total do valor da mercadoria.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sender_document"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF ou CNPJ do Remetente *</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormDescription>Necessário para etiquetas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sender_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail do Remetente *</FormLabel>
                          <FormControl>
                            <Input placeholder="contato@loja.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sender_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP de origem *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="00000-000" 
                              maxLength={9}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, "");
                                if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
                                field.onChange(v);
                              }}
                              value={field.value}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          CEP de onde você despacha os pedidos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dados do Remetente na Etiqueta */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div>
                      <h4 className="text-sm font-medium">Dados do Remetente na Etiqueta</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Informações que aparecem no campo "Remetente" da etiqueta. Se em branco, usa o nome da loja.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sender_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Remetente</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Maria Silva" {...field} />
                            </FormControl>
                            <FormDescription>Padrão: nome da loja</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sender_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone do Remetente</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 90000-0000" {...field} />
                            </FormControl>
                            <FormDescription>Padrão: WhatsApp da loja</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Endereço de Despacho */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div>
                      <h4 className="text-sm font-medium">Endereço de Despacho</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        De onde os pacotes são enviados. Deve corresponder ao CEP de origem acima. Se em branco, usa o endereço da loja.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="sender_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logradouro</FormLabel>
                              <FormControl>
                                <Input placeholder="Rua, Avenida, Travessa..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="sender_address_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sender_complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apto 12, Sala 3..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sender_neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Centro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="sender_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="São Paulo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="sender_state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado (UF)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SP"
                                maxLength={2}
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Serviços Adicionais dos Correios */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div>
                      <h4 className="text-sm font-medium">Serviços Adicionais na Etiqueta</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Aplicados nas etiquetas geradas. Sujeitos à disponibilidade da transportadora escolhida para o envio.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="label_receipt"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">A.R. — Aviso de Recebimento</FormLabel>
                            <FormDescription className="text-xs">
                              O destinatário assina o recebimento e você recebe o comprovante. <br/>
                              <span className="font-semibold text-blue-600 dark:text-blue-500">Disponibilidade:</span> Apenas para envios via <strong>Correios</strong>.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="label_own_hand"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">Mão Própria</FormLabel>
                            <FormDescription className="text-xs">
                              Entregue somente nas mãos do destinatário indicado. Não aceita terceiros. <br/>
                              <span className="font-semibold text-blue-600 dark:text-blue-500">Disponibilidade:</span> Apenas para envios via <strong>Correios</strong>.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="label_collect"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">Coleta em Domicílio (Pickup)</FormLabel>
                            <FormDescription className="text-xs">
                              A transportadora retira a encomenda no seu endereço de despacho.<br/>
                              <span className="font-semibold text-yellow-600 dark:text-yellow-500">Aviso:</span> O Melhor Envio oferece coleta domiciliar gratuita, porém <strong>atualmente o serviço é realizado exclusivamente pela Loggi</strong>. Correios e outras exigem despacho em agência.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-sm">
                    <a href="https://melhorenvio.com.br" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                      Não tem conta? Criar grátis &rarr;
                    </a>
                  </div>
                </div>

                {/* Serviços Disponíveis */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Serviços Disponíveis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione quais serviços mostrar no checkout:
                  </p>

                  <FormField
                    control={form.control}
                    name="enabled_shipping_services"
                    render={() => (
                      <FormItem className="space-y-3">
                        {[
                          { id: 1, label: "PAC (Correios)", desc: "Econômico" },
                          { id: 2, label: "SEDEX (Correios)", desc: "Expresso" },
                          { id: 3, label: "SEDEX 10 (Correios)", desc: "Super Expresso" },
                          { id: 4, label: "SEDEX 12 (Correios)", desc: "Super Expresso" },
                          { id: 17, label: "Jadlog Package", desc: "Econômico" },
                          { id: 18, label: "Jadlog .COM", desc: "Expresso" },
                          { id: 22, label: "Azul Cargo Express", desc: "Expresso" },
                          { id: 16, label: "Loggi", desc: "Expresso" },
                          { id: 24, label: "Latam Cargo", desc: "Expresso" },
                        ].map((service) => (
                          <FormField
                            key={service.id}
                            control={form.control}
                            name="enabled_shipping_services"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={service.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), service.id])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== service.id)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal cursor-pointer">
                                      <span className="font-medium">{service.label}</span> - {service.desc}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipping_markup_percent"
                    render={({ field }) => (
                      <FormItem className="pt-2">
                        <FormLabel>Markup sobre frete (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual adicionado ao preço da API (0% = preço exato da transportadora)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dimensões Padrão */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Dimensões Padrão do Pacote
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Usadas quando o produto não tem dimensões cadastradas.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="default_package_width_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Largura (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="200" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_package_height_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altura (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="200" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_package_length_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comprim. (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="200" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_package_weight_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.1" max="50" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-200">Atenção ao Risco de Prejuízo</p>
                      <p>Estas dimensões e peso são usados como <strong>"Reserva" (Fallback)</strong>. Se um produto for mais pesado que o valor acima e você não cadastrar o peso real no cadastro dele, o cliente pagará um frete mais barato e a sua loja terá que arcar com a diferença.</p>
                      <p className="text-xs mt-2 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> <strong>Recomendação:</strong> Cadastre o peso real em cada produto. Se não for possível, coloque aqui o peso do seu produto mais comum ou da sua caixa padrão.</p>
                    </div>
                  </div>

                  <div className="bg-sky-50 dark:bg-sky-950/20 p-5 rounded-xl text-sm text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800 space-y-4 mt-4">
                    <div className="flex gap-2.5 items-center">
                      <Package className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <h4 className="font-semibold text-sky-900 dark:text-sky-200 text-base">Guia Completo: Como funciona o Cálculo de Frete com Vários Itens</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <h5 className="font-semibold text-sky-900 dark:text-sky-300">📐 Lógica de Empacotamento (Regra do Empilhamento)</h5>
                        <p className="text-xs leading-relaxed">Para economizar no frete para o seu cliente final, o sistema simula o envio de todos os itens em uma <strong>Caixa Única</strong> seguindo esta regra:</p>
                        <ul className="list-disc pl-5 text-xs space-y-1">
                          <li><strong>Peso:</strong> É a soma do peso de todos os itens da compra.</li>
                          <li><strong>Largura e Comprimento:</strong> Usa-se a maior medida encontrada entre os itens comprados.</li>
                          <li><strong>Altura:</strong> É a soma das alturas individuais dos itens (empilhamento vertical).</li>
                        </ul>
                        <p className="text-[11px] text-sky-700/90 dark:text-sky-400/90 italic">Esta lógica garante que o frete cobrado sempre cubra o volume total, evitando prejuízos para a sua loja.</p>
                      </div>

                      <div className="space-y-2 border-t md:border-t-0 md:border-l border-sky-200 dark:border-sky-800 pt-3 md:pt-0 md:pl-4">
                        <h5 className="font-semibold text-sky-900 dark:text-sky-300">💡 Dicas Práticas e Recomendações</h5>
                        <ul className="space-y-2 text-xs">
                          <li>
                            <strong>1. Cadastre medidas em cada produto:</strong> 
                            <span className="block text-[11px] text-sky-700/80 dark:text-sky-400/80">Entre no cadastro individual de seus produtos e preencha suas dimensões reais. A falta disso força o uso desta caixa "padrão", o que pode inflar o preço do frete ou dar prejuízo.</span>
                          </li>
                          <li>
                            <strong>2. Cuidado com alturas excessivas:</strong> 
                            <span className="block text-[11px] text-sky-700/80 dark:text-sky-400/80">Os Correios aceitam limite máximo de 100cm por lado e a soma de todos os lados não pode passar de 200cm. Evite cadastrar alturas superestimadas nos produtos para não inviabilizar o frete no checkout do cliente.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {noDimensionsCount > 0 && (
                    <div className="bg-muted/50 border border-border p-4 rounded-lg text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span>Você tem <strong>{noDimensionsCount} produtos</strong> usando estes valores padrão.</span>
                      </div>
                      <Link to={`/admin/produtos`} className="font-medium hover:underline text-primary inline-flex items-center gap-1">
                        Ver produtos &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Endereço */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Endereço da loja</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Exibido no rodapé do site e usado para retirada na loja.
            </p>

             <FormField
              control={form.control}
              name="address_street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordenadas (dentro da mesma section de endereço) */}
            <div className="border-t border-border pt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-sm">Coordenadas da loja</h3>
                  <div className="text-xs text-muted-foreground mt-0.5 space-y-1">
                    <p>Usadas para calcular frete por distância. Clique em "Obter coordenadas" para preencher automaticamente a partir do endereço.</p>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/5 p-3 rounded-md mt-1.5 leading-relaxed space-y-2">
                      <p className="flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <strong>Dica se a busca automática falhar:</strong> Se o endereço não for localizado automaticamente, você pode obter as coordenadas direto no 
                        <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold mx-1">Google Maps</a>:
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/20 dark:border-amber-900/20">
                        <div className="space-y-1">
                          <strong className="block text-amber-900 dark:text-amber-200 text-xs">💻 No Computador:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                            <li>Abra o Google Maps no navegador.</li>
                            <li>Clique com o <strong>botão direito</strong> no local exato do mapa.</li>
                            <li>Clique em cima dos números da Latitude e Longitude na caixa que aparecer para <strong>copiá-los</strong>.</li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <strong className="block text-amber-900 dark:text-amber-200 text-xs">📱 No Celular ou Tablet:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                            <li>Abra o aplicativo do Google Maps.</li>
                            <li><strong>Toque e segure</strong> (toque longo) no ponto exato da loja para soltar um alfinete vermelho.</li>
                            <li>A cópia da Latitude e Longitude aparecerá formatada na <strong>caixa de pesquisa no topo da tela</strong>.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={geocoding}
                  onClick={async () => {
                    const vals = form.getValues();
                    const addr = buildAddressString({
                      street: vals.address_street,
                      number: vals.address_number,
                      neighborhood: vals.address_neighborhood,
                      city: vals.address_city,
                      state: vals.address_state,
                    });
                    if (!addr || addr.replace(/,\s*/g, "").replace("Brasil", "").trim().length < 5) {
                      toast.error("Preencha o endereço primeiro");
                      return;
                    }
                    setGeocoding(true);
                    try {
                      const result = await geocodeAddress(addr);
                      if (result) {
                        form.setValue("latitude", result.lat.toFixed(8), { shouldDirty: true });
                        form.setValue("longitude", result.lon.toFixed(8), { shouldDirty: true });
                        toast.success("Coordenadas obtidas!", {
                          description: `Localizado: ${result.display_name} (${result.lat.toFixed(5)}, ${result.lon.toFixed(5)})`,
                        });
                      } else {
                        toast.error("Endereço não encontrado", {
                          description: "Verifique se o endereço está correto e tente novamente.",
                        });
                      }
                    } catch {
                      toast.error("Erro ao buscar coordenadas");
                    } finally {
                      setGeocoding(false);
                    }
                  }}
                >
                  {geocoding ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</>
                  ) : (
                    <><MapPin className="h-4 w-4" /> Obter coordenadas</>
                  )}
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl><Input placeholder="-23.55052000" inputMode="decimal" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl><Input placeholder="-46.63330800" inputMode="decimal" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* Notificações */}
          <NotificationsSettingsSection storeId={store.id} />

          {/* Equipe e Sessões (visível apenas para Gerentes/Donos) */}
          {isManager && (
            <section className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-soft">
              <h2 className="font-serif text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Equipe & Segurança
              </h2>

              {/* Permissões de Equipe */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Permissões da Equipe
                </h3>
                <FormField
                  control={form.control}
                  name="show_revenue_to_staff"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                      <div>
                        <FormLabel className="font-medium">Exibir faturamento para Colaboradores</FormLabel>
                        <FormDescription className="text-xs mt-0.5">
                          Se ativado, usuários com papel Colaborador podem ver o faturamento e métricas financeiras no dashboard. Se desativado, estes dados ficam ocultos.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Controle de Dispositivos */}
              <div className="pt-6 border-t border-border">
                <ActiveSessionsSection storeId={store.id} plan={store.plan} />
              </div>
            </section>
          )}

          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3">
            <Button type="submit" disabled={saving} size="lg">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </form>
      </Form>

      {isManager && (
        <div className="mt-8 pt-8 border-t border-border">
          <AuditLogsPanel storeId={store.id} />
        </div>
      )}
      </div>
    </RoleGuard>
  );
}