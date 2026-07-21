import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  subscription_status: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const loadUserData = async (uid: string) => {
    // Defer to avoid deadlocks inside onAuthStateChange
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, username, email, phone, avatar_url, subscription_status")
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((p as Profile | null) ?? null);
    setRoles(((r as { role: string }[] | null) ?? []).map((x) => x.role));
  };

  useEffect(() => {
    // Set up listener first, then fetch existing session
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => void loadUserData(s.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadUserData(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await loadUserData(user.id);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      isAdmin: roles.includes("admin"),
      isModerator: roles.includes("moderator") || roles.includes("admin"),
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshProfile,
    }),
    [session, user, profile, roles, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
