import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Auth.css";

type Props = {
  userId: string;
  fullName: string;
  onComplete: () => void;
};

export default function JournalSetup({ userId, fullName, onComplete }: Props) {
  const [journalName, setJournalName] = useState("");
  const [saving, setSaving] = useState(false);
const currentYear = new Date().getFullYear();
  const isValid =
    journalName.length > 0 && journalName.length <= 40;

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!isValid || saving) return;

  setSaving(true);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Load user error:", userError?.message);
    setSaving(false);
    return;
  }

  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : "email";

const { error } = await supabase.from("profiles").upsert({
  id: userId,
  full_name: fullName,
  journal_name: journalName,
  email: user.email ?? null,
  auth_provider: provider,
  has_password: provider === "email",
});

  setSaving(false);

  if (error) {
    console.error("Profile save error:", error.message);
    return;
  }

  onComplete();
}

  return (
    <main className="auth-page">
      <div className="auth-header">
        <h1 className="auth-logo">Daily Diario</h1>
      </div>

      <div className="auth-container">
<p className="auth-subtitle">Give your {currentYear} journal a name</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
           placeholder={`My ${currentYear} Journal`}
            value={journalName}
            maxLength={40} // ✅ hard limit
            onChange={(e) => setJournalName(e.target.value)}
          />

          {/* optional but clean */}
          <div className="auth-char-count">
            {journalName.length}/40
          </div>

          <button
            className="auth-button"
            type="submit"
            disabled={saving || !isValid} // ✅ block invalid
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}