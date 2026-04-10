import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { id: string; full_name: string | null } | null;
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, role: null,
  isAdmin: false, loading: true, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setTimeout(() => {
            void validateAndHydrateSession({ foreground: false });
          }, 0);
          return;
        }

        clearAuthState();
      }
    );

    void validateAndHydrateSession({ foreground: true });

    return () => subscription.unsubscribe();
  }, []);

  async function validateAndHydrateSession(options?: { foreground?: boolean }) {
    if (options?.foreground) {
      setLoading(true);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session;

    if (!currentSession) {
      clearAuthState();
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshedData.session?.user) {
        await supabase.auth.signOut();
        clearAuthState();
        return;
      }

      setSession(refreshedData.session);
      setUser(refreshedData.session.user);
      await fetchUserData(refreshedData.session.user.id);
      return;
    }

    setSession(currentSession);
    setUser(userData.user);
    await fetchUserData(userData.user.id);
  }

  function clearAuthState() {
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setLoading(false);
  }

  async function fetchUserData(userId: string) {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);
    setProfile(profileRes.data);
    setRole(roleRes.data?.role ?? "user");
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, role,
      isAdmin: role === "admin",
      loading, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
