import { useEffect, useMemo, useState } from "react";
import "./App.css";

type PastEntry = {
  id: string;
  dateKey: string;
  dateLabel: string;
  content: string;
};

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

function App() {
  const initialDate = new Date();

  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [savedText, setSavedText] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const [currentDayKey, setCurrentDayKey] = useState(getLocalDayKey(initialDate));
const [currentDateLabel, setCurrentDateLabel] = useState(formatFullDate(initialDate));

  const [pastEntries, setPastEntries] = useState<PastEntry[]>([]);
  const [selectedPastEntryId, setSelectedPastEntryId] = useState<string | null>(null);

  const selectedPastEntry = useMemo(() => {
    return pastEntries.find((entry) => entry.id === selectedPastEntryId) ?? null;
  }, [pastEntries, selectedPastEntryId]);

  const isViewingPastEntry = selectedPastEntry !== null;

  useEffect(() => {
    const finalizeCurrentDay = () => {
      const archivedContent = savedText.trim();

      const oldDayDate = new Date(currentDayKey + "T12:00:00");
      const nextDayDate = new Date(oldDayDate);
      nextDayDate.setDate(nextDayDate.getDate() + 1);

      if (archivedContent) {
        setPastEntries((prev) => [
          {
            id: currentDayKey,
            dateKey: currentDayKey,
            dateLabel: formatShortDate(oldDayDate),
            content: archivedContent,
          },
          ...prev.filter((entry) => entry.id !== currentDayKey),
        ]);
      }

      setText("");
      setSavedText("");
      setJustSaved(false);
      setSelectedPastEntryId(null);

      setCurrentDayKey(getLocalDayKey(nextDayDate));
      setCurrentDateLabel(formatFullDate(nextDayDate));
    };

    const updateTimer = () => {
      const now = new Date();
      const todayKey = getLocalDayKey(now);

      if (todayKey !== currentDayKey) {
        finalizeCurrentDay();
        return;
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
  }, [currentDayKey, currentDateLabel, savedText]);

  const displayedText = isViewingPastEntry ? selectedPastEntry.content : text;

  const wordCount = useMemo(() => {
    const trimmed = displayedText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [displayedText]);

  const trimmedSavedText = savedText.trim();
  const hasSavedText = trimmedSavedText.length > 0;
  const isDirty = text !== savedText;

  const buttonLabel = justSaved
    ? "Saved"
    : isDirty && hasSavedText
    ? "Save Edit"
    : "Save";

  const buttonIsAccent = isDirty && !justSaved;
  const buttonDisabled = !buttonIsAccent || isViewingPastEntry;

  const handleSave = () => {
    if (buttonDisabled) return;

    setSavedText(text);
    setJustSaved(true);

    setTimeout(() => {
      setJustSaved(false);
    }, 2500);
  };

  const totalEntries = pastEntries.length + (savedText.trim() ? 1 : 0);

  return (
    <main className="app">
      <div className="shell">
        <aside className="sidebar">
          <h1 className="journal-title">Journal</h1>

          <div className="stats">
            <div className="stat">
              <div className="stat-number">0</div>
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
            onClick={() => setSelectedPastEntryId(null)}
          >
            <div className="today-title">Today</div>
            <div className="today-subtitle">Write your daily entry</div>
          </button>

          <div className="sidebar-divider" />

          <div className="past-section">
            <div className="past-title">Past Entries</div>

            {pastEntries.length === 0 ? (
              <div className="past-text">Your past entries will appear here</div>
            ) : (
              <div className="past-entry-list">
                {pastEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`past-entry-button ${
                      selectedPastEntryId === entry.id ? "past-entry-button--active" : ""
                    }`}
                    onClick={() => setSelectedPastEntryId(entry.id)}
                  >
                    <div className="past-entry-date">{entry.dateLabel}</div>
                    <div className="past-entry-text">{entry.content}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="main">
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
                  {justSaved ? (
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
                  <span>{buttonLabel}</span>
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