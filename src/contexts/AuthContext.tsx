/**
 * Supabase Auth — substitui o mock anterior.
 * Mantém a forma do contexto (user, isSuperAdmin, memberships, signIn, signOut, loading)
 * para não quebrar consumidores. Adiciona signUp.
 *
 * `user` agora é um PlatformUser derivado de auth.users + profiles.
 * `memberships` vem de store_members + stores (RLS limita ao próprio user).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PlatformUser, Store, StoreRole } from "@/types/database";

interface SessionStore {
  store: Store;
  role: StoreRole;
}

interface AuthContextValue {
  user: PlatformUser | null;
  session: Session | null;
  isSuperAdmin: boolean;
  memberships: SessionStore[];
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ProfileRow {
  id: string;
  full_name: string | null;
  is_super_admin: boolean;
  created_at: string;
}

function toPlatformUser(authUser: User, profile: ProfileRow | null): PlatformUser {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    full_name: profile?.full_name ?? (authUser.user_metadata?.full_name as string) ?? "",
    platform_role: profile?.is_super_admin ? "super_admin" : undefined,
    created_at: profile?.created_at ?? authUser.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [memberships, setMemberships] = useState<SessionStore[]>([]);
  const [loading, setLoading] = useState(true);

  // Hidrata profile + memberships para um auth user.
  // Usa setTimeout(0) quando chamado de dentro do listener para evitar deadlocks.
  const hydrate = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      setMemberships([]);
      return;
    }

    const [profileRes, membersRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, is_super_admin, created_at")
        .eq("id", authUser.id)
        .maybeSingle(),
      supabase
        .from("store_members")
        .select("role, store:stores(id, slug, name, status, plan, created_at)")
        .eq("user_id", authUser.id),
    ]);

    if (profileRes.error) {
      console.error("[AuthContext] failed to load profile", profileRes.error);
    }
    if (membersRes.error) {
      console.error("[AuthContext] failed to load store memberships", membersRes.error);
    }

    setUser(toPlatformUser(authUser, (profileRes.data as ProfileRow | null) ?? null));

    const rows = (membersRes.data ?? []) as Array<{
      role: string;
      store: { id: string; slug: string; name: string; status: string; plan: string; created_at: string } | null;
    }>;
    setMemberships(
      rows
        .filter((r) => r.store)
        .map((r) => ({
          store: {
            id: r.store!.id,
            slug: r.store!.slug,
            name: r.store!.name,
            status: r.store!.status as Store["status"],
            plan: (r.store!.plan ?? "essencial") as Store["plan"],
            created_at: r.store!.created_at,
          },
          role: r.role as StoreRole,
        })),
    );
  }, []);

  useEffect(() => {
    // 1) Listener PRIMEIRO (síncrono) — hidratação adiada com setTimeout(0)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setTimeout(() => {
        void hydrate(newSession?.user ?? null);
      }, 0);
    });

    // 2) Depois lê a sessão atual
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      hydrate(current?.user ?? null).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: fullName },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isSuperAdmin: user?.platform_role === "super_admin",
      memberships,
      signIn,
      signUp,
      signOut,
      loading,
    }),
    [user, session, memberships, signIn, signUp, signOut, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
