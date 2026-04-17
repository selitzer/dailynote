import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

type JournalEntry = {
  id: string;
  day_key: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type PastEntry = {
  id: string;
  dateKey: string;
  dateLabel: string;
  content: string;
};

type AppProps = {
  userId: string;
  journalName: string;
  fullName: string;
};

async function handleSignOut() {
  await supabase.auth.signOut();
}

function getDateFromDayKey(dayKey: string) {
  return new Date(`${dayKey}T12:00:00`);
}

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function App({ userId, journalName, fullName }: AppProps) {
  const initialDate = new Date();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);

  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [savedText, setSavedText] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [currentDayKey, setCurrentDayKey] = useState(getLocalDayKey(initialDate));
  const [currentDateLabel, setCurrentDateLabel] = useState(formatFullDate(initialDate));

 
  const [selectedPastEntryId, setSelectedPastEntryId] = useState<string | null>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

const archivedEntries = useMemo<PastEntry[]>(() => {
  return entries
    .filter((entry) => entry.day_key < currentDayKey && entry.content.trim())
    .map((entry) => ({
      id: entry.id,
      dateKey: entry.day_key,
      dateLabel: formatShortDate(getDateFromDayKey(entry.day_key)),
      content: entry.content,
    }));
}, [entries, currentDayKey]);

const selectedPastEntry = useMemo(() => {
  return archivedEntries.find((entry) => entry.id === selectedPastEntryId) ?? null;
}, [archivedEntries, selectedPastEntryId]);

  const isViewingPastEntry = selectedPastEntry !== null;

useEffect(() => {
  const updateTimer = () => {
    const now = new Date();
    const todayKey = getLocalDayKey(now);

if (todayKey !== currentDayKey) {
  setCurrentDayKey(todayKey);
  setCurrentDateLabel(formatFullDate(now));
  setSelectedPastEntryId(null);
  setJustSaved(false);
  loadEntries();
}

    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight.getTime() - now.getTime();
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    setTimeLeft(`${hours}h ${minutes}m`);
  };

  updateTimer();
  const interval = setInterval(updateTimer, 1000);

  return () => clearInterval(interval);
}, [currentDayKey, entries]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (window.innerWidth > 900) return;

    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

useEffect(() => {
  if (!profileMenuOpen) return;

  const handlePointerDown = (e: MouseEvent) => {
    if (!profileMenuRef.current) return;
    if (!profileMenuRef.current.contains(e.target as Node)) {
      setProfileMenuOpen(false);
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setProfileMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("mousedown", handlePointerDown);
    document.removeEventListener("keydown", handleEscape);
  };
}, [profileMenuOpen]);

async function loadEntries() {
  setEntriesLoading(true);

  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, day_key, content, created_at, updated_at")
    .eq("user_id", userId)
    .order("day_key", { ascending: false });

  if (error) {
    console.error("Load entries error:", error.message);
    setEntries([]);
    setEntriesLoading(false);
    return;
  }

  const loadedEntries = data ?? [];
  setEntries(loadedEntries);

  const todayEntry =
    loadedEntries.find((entry) => entry.day_key === getLocalDayKey(new Date())) ?? null;

  setSavedText(todayEntry?.content ?? "");
  setText(todayEntry?.content ?? "");

  setEntriesLoading(false);
}


useEffect(() => {
  loadEntries();
}, [userId]);

  const displayedText = isViewingPastEntry ? selectedPastEntry.content : text;

  const wordCount = useMemo(() => {
    const trimmed = displayedText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [displayedText]);

  const trimmedSavedText = savedText.trim();
  const hasSavedText = trimmedSavedText.length > 0;
  const isDirty = text !== savedText;

  const buttonLabel =
    justSaved ? "Saved" : isDirty && hasSavedText ? "Save Edit" : "Save";

  const buttonIsAccent = isDirty && !justSaved;
const buttonDisabled =
  !buttonIsAccent || isViewingPastEntry || entriesLoading || savingEntry;

const handleSave = async () => {
  if (buttonDisabled || savingEntry) return;

  const content = text;
  if (!content.trim()) return;

  setSavingEntry(true);

  const { data, error } = await supabase
    .from("journal_entries")
    .upsert(
      {
        user_id: userId,
        day_key: currentDayKey,
        content,
      },
      {
        onConflict: "user_id,day_key",
      }
    )
    .select("id, day_key, content, created_at, updated_at")
    .single();

  setSavingEntry(false);

  if (error) {
    console.error("Save entry error:", error.message);
    return;
  }

  setSavedText(content);
  setJustSaved(true);

  setEntries((prev) => {
    const withoutToday = prev.filter((entry) => entry.day_key !== currentDayKey);
    return [data, ...withoutToday].sort((a, b) => b.day_key.localeCompare(a.day_key));
  });

  setTimeout(() => {
    setJustSaved(false);
  }, 2500);
};

  const totalEntries = archivedEntries.length;

const dayStreak = useMemo(() => {
  const archivedDayKeys = entries
    .filter((entry) => entry.day_key < currentDayKey && entry.content.trim())
    .map((entry) => entry.day_key)
    .sort((a, b) => b.localeCompare(a));

  if (archivedDayKeys.length === 0) return 0;

  let streak = 1;

for (let i = 1; i < archivedDayKeys.length; i++) {
  const olderDate = getDateFromDayKey(archivedDayKeys[i]);

  const expectedNewerDate = new Date(olderDate);
  expectedNewerDate.setDate(expectedNewerDate.getDate() + 1);

  if (getLocalDayKey(expectedNewerDate) === archivedDayKeys[i - 1]) {
    streak += 1;
  } else {
    break;
  }
}

  return streak;
}, [entries, currentDayKey]);

  const goToToday = () => {
    setSelectedPastEntryId(null);
    setMobileMenuOpen(false);
  };

  const openPastEntry = (entryId: string) => {
    setSelectedPastEntryId(entryId);
    setMobileMenuOpen(false);
  };

  return (
    <main className="app">
      <div className="shell">
        <aside className="sidebar">
          <h1 className="journal-title">
            {journalName}
          </h1>

          <div className="stats">
            <div className="stat">
              <div className="stat-number">{dayStreak}</div>
              <div className="stat-label">day streak</div>
            </div>

            <div className="stat">
              <div className="stat-number">{totalEntries}</div>
              <div className="stat-label">entries</div>
            </div>
          </div>

          <button
            className={`today-card ${!isViewingPastEntry ? "today-card--active" : ""}`}
            type="button"
            onClick={goToToday}
          >
            <div className="today-title">Today</div>
            <div className="today-subtitle">Write your daily entry</div>
          </button>

          <div className="sidebar-divider" />

          <div className="past-section">
            <div className="past-title">Past Entries</div>

              {archivedEntries.length === 0 ? (
                <div className="past-text">Your past entries will appear here</div>
              ) : (
                <div className="past-entry-list">
                  {archivedEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`past-entry-button ${
                      selectedPastEntryId === entry.id ? "past-entry-button--active" : ""
                    }`}
                    onClick={() => openPastEntry(entry.id)}
                  >
                    <div className="past-entry-date">{entry.dateLabel}</div>
                    <div className="past-entry-preview">{entry.content}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

{profileMenuOpen && (
  <button
    type="button"
    className="profile-menu-backdrop"
    aria-label="Close profile menu"
    onClick={() => setProfileMenuOpen(false)}
  />
)}

<div className="sidebar-bottom" ref={profileMenuRef}>
  <div className="sidebar-divider--bottom" />

  <div className={`profile-menu ${profileMenuOpen ? "profile-menu--open" : ""}`}>
    <button type="button" className="profile-menu-item">
      <span className="profile-menu-item-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 6.5C5 5.67157 5.67157 5 6.5 5H10.25C10.6642 5 11 5.33579 11 5.75V18.25C11 18.6642 10.6642 19 10.25 19H6.5C5.67157 19 5 18.3284 5 17.5V6.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M13 5.75C13 5.33579 13.3358 5 13.75 5H17.5C18.3284 5 19 5.67157 19 6.5V17.5C19 18.3284 18.3284 19 17.5 19H13.75C13.3358 19 13 18.6642 13 18.25V5.75Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <span>Past journals</span>
    </button>

    <button type="button" className="profile-menu-item">
      <span className="profile-menu-item-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 0 0 12 8.75Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M19.4 13.5C19.4667 13.0067 19.5 12.5067 19.5 12C19.5 11.4933 19.4667 10.9933 19.4 10.5L21 9.25L19.25 6.25L17.35 7C16.5833 6.4 15.7167 5.91667 14.75 5.55L14.5 3.5H9.5L9.25 5.55C8.28333 5.91667 7.41667 6.4 6.65 7L4.75 6.25L3 9.25L4.6 10.5C4.53333 10.9933 4.5 11.4933 4.5 12C4.5 12.5067 4.53333 13.0067 4.6 13.5L3 14.75L4.75 17.75L6.65 17C7.41667 17.6 8.28333 18.0833 9.25 18.45L9.5 20.5H14.5L14.75 18.45C15.7167 18.0833 16.5833 17.6 17.35 17L19.25 17.75L21 14.75L19.4 13.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>Profile settings</span>
    </button>

    <div className="profile-menu-divider" />

    <button
      type="button"
      className="profile-menu-item profile-menu-item--danger"
      onClick={handleSignOut}
    >
      <span className="profile-menu-item-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M10 7V5.75C10 4.7835 10.7835 4 11.75 4H18.25C19.2165 4 20 4.7835 20 5.75V18.25C20 19.2165 19.2165 20 18.25 20H11.75C10.7835 20 10 19.2165 10 18.25V17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 12H14.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M11.5 8.5L15 12L11.5 15.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>Log out</span>
    </button>
  </div>

  <button
    type="button"
    className="profile-button"
    onClick={() => setProfileMenuOpen((prev) => !prev)}
    aria-expanded={profileMenuOpen}
    aria-haspopup="menu"
  >
    <span className="profile-button-avatar" aria-hidden="true">
      {(fullName || "U").charAt(0).toUpperCase()}
    </span>

    <span className="profile-button-name">{fullName}</span>

    <span
      className={`profile-button-chevron ${
        profileMenuOpen ? "profile-button-chevron--open" : ""
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" fill="none">
        <path
          d="M3 10L8 5L13 10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </button>
</div>
        </aside>

        <section className="main">
          <div className="mobile-topbar">
            <button
              type="button"
              className={`mobile-menu-button ${mobileMenuOpen ? "mobile-menu-button--open" : ""}`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="mobile-journal-title">{journalName}</div>
          </div>

          <div className={`mobile-menu-overlay ${mobileMenuOpen ? "mobile-menu-overlay--open" : ""}`}>
            <div className="mobile-menu-content">
              <div className="stats">
                <div className="stat">
                  <div className="stat-number">{dayStreak}</div>
                  <div className="stat-label">day streak</div>
                </div>

                <div className="stat">
                  <div className="stat-number">{totalEntries}</div>
                  <div className="stat-label">entries</div>
                </div>
              </div>

              <button
                className={`today-card ${!isViewingPastEntry ? "today-card--active" : ""}`}
                type="button"
                onClick={goToToday}
              >
                <div className="today-title">Today</div>
                <div className="today-subtitle">Write your daily entry</div>
              </button>

              <div className="sidebar-divider" />

              <div className="past-section">
                <div className="past-title">Past Entries</div>

{archivedEntries.length === 0 ? (
  <div className="past-text">Your past entries will appear here</div>
) : (
  <div className="past-entry-list">
    {archivedEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className={`past-entry-button ${
                          selectedPastEntryId === entry.id ? "past-entry-button--active" : ""
                        }`}
                        onClick={() => openPastEntry(entry.id)}
                      >
                        <div className="past-entry-date">{entry.dateLabel}</div>
                        <div className="past-entry-preview">{entry.content}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="mobile-signout"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="main-inner">
            <div className="main-top">
              <div className="greeting">
                {isViewingPastEntry ? "ARCHIVED ENTRY" : "GOOD EVENING"}
              </div>
              <div className="time-left">
                {isViewingPastEntry ? "read only" : `${timeLeft} left today`}
              </div>
            </div>

            <h2 className="date-heading">
              {isViewingPastEntry ? selectedPastEntry.dateLabel : currentDateLabel}
            </h2>

            <textarea
              className={`writing-area ${isViewingPastEntry ? "writing-area--readonly" : ""}`}
              placeholder="What's on your mind today..."
              value={displayedText}
              onChange={(e) => setText(e.target.value)}
              readOnly={isViewingPastEntry}
              spellCheck={false}
            />

            <div className="bottom-bar">
              <div className="word-count">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </div>

              {isViewingPastEntry ? (
                <div className="locked-label">Locked</div>
              ) : (
                <button
                  className={`saved-button ${buttonIsAccent ? "saved-button--accent" : ""} ${
                    buttonDisabled ? "saved-button--disabled" : ""
                  }`}
                  type="button"
                  onClick={handleSave}
                  disabled={buttonDisabled}
                >
{savingEntry ? (
  <svg
    className="saved-icon saved-icon--spinner"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="8"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.28"
    />
    <path
      d="M20 12a8 8 0 0 0-8-8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
) : justSaved ? (
  <svg
    className="saved-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 12.5L9.5 17L19 7.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
) : (
  <svg
    className="saved-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 5.5C4 4.67157 4.67157 4 5.5 4H15.8787C16.2765 4 16.658 4.15804 16.9393 4.43934L19.5607 7.06066C19.842 7.34196 20 7.72348 20 8.12132V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.67157 20 4 19.3284 4 18.5V5.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M8 4V9H15V6.5L12.5 4H8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M8 20V13H16V20"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
)}
<span>{savingEntry ? "Saving..." : buttonLabel}</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;