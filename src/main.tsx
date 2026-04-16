import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import "./index.css";
import App from "./App";
import Auth from "./Auth";
import JournalSetup from "./JournalSetup";
import { supabase } from "./supabaseClient";

type Profile = {
  id: string;
  full_name: string | null;
  journal_name: string | null;
};

function RootApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, journal_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error);
      return null;
    }

    return data;
  }

  async function refreshProfile(userId: string) {
    setProfileLoading(true);

    try {
      const profileData = await loadProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error("refreshProfile failed:", error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("getSession error:", error);
          if (isMounted) {
            setSession(null);
            setProfile(null);
          }
          return;
        }

        if (!isMounted) return;

        setSession(currentSession);

        if (currentSession?.user?.id) {
          const profileData = await loadProfile(currentSession.user.id);
          if (!isMounted) return;
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Initial auth bootstrap failed:", error);
        if (isMounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession ?? null);

      if (!newSession?.user?.id) {
        setProfile(null);
        return;
      }

      refreshProfile(newSession.user.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (initialLoading) {
    return (
      <div className="app-loader">
        <div className="app-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const fullName =
    (session.user.user_metadata?.name as string | undefined) ?? "";

  if (profileLoading && !profile) {
    return (
      <div className="app-loader">
        <div className="app-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!profile?.journal_name) {
    return (
      <JournalSetup
        userId={session.user.id}
        fullName={profile?.full_name ?? fullName}
        onComplete={() => refreshProfile(session.user.id)}
      />
    );
  }

  return <App journalName={profile.journal_name} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);