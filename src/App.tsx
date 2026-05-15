import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

type JournalEntry = {
  id: string;
  journal_id: string;
  day_key: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Journal = {
  id: string;
  name: string;
  year: number;
  is_current: boolean;
  created_at: string;
  closed_at: string | null;
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
  onJournalNameUpdated?: (nextName: string) => void;
};

async function handleSignOut() {
  await supabase.auth.signOut();
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
  });
}
function getOrdinalDay(day: number) {
  if (day > 3 && day < 21) return `${day}th`;

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
function formatContributionDate(date: Date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  return `${weekday}, ${month} ${getOrdinalDay(date.getDate())}`;
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

function App({ userId, journalName, fullName, onJournalNameUpdated }: AppProps) {
  const initialDate = new Date();

const [hasPassword, setHasPassword] = useState(false);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);

  const [journals, setJournals] = useState<Journal[]>([]);
const [journalsLoading, setJournalsLoading] = useState(true);
const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
const [activeJournalId, setActiveJournalId] = useState<string | null>(null);

  const [renameJournalOpen, setRenameJournalOpen] = useState(false);
const [renameJournalValue, setRenameJournalValue] = useState(journalName);
const [updatingJournalName, setUpdatingJournalName] = useState(false);

const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
const [accountEmail, setAccountEmail] = useState("");

  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [savedText, setSavedText] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [currentDayKey, setCurrentDayKey] = useState(getLocalDayKey(initialDate));
  const [currentDateLabel, setCurrentDateLabel] = useState(formatFullDate(initialDate));
const [selectedPastMonth, setSelectedPastMonth] = useState<string | null>(null);
 
  const [selectedPastEntryId, setSelectedPastEntryId] = useState<string | null>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
const desktopProfileMenuRef = useRef<HTMLDivElement | null>(null);
const mobileProfileMenuRef = useRef<HTMLDivElement | null>(null);

  const [pastMonthMenuOpen, setPastMonthMenuOpen] = useState(false);
  const [selectedPastDay, setSelectedPastDay] = useState<number | null>(null);
const [pastDayMenuOpen, setPastDayMenuOpen] = useState(false);

  const [pastFilterMenuOpen, setPastFilterMenuOpen] = useState(false);
const [selectedPastFilter, setSelectedPastFilter] = useState("Most Recent");
const desktopPastFilterMenuRef = useRef<HTMLDivElement | null>(null);
const mobilePastFilterMenuRef = useRef<HTMLDivElement | null>(null);

const monthFilterActive = selectedPastMonth !== null;
const dayFilterActive = selectedPastDay !== null;

const [journalMenuOpen, setJournalMenuOpen] = useState(false);
const desktopJournalMenuRef = useRef<HTMLDivElement | null>(null);
const mobileJournalMenuRef = useRef<HTMLDivElement | null>(null);

const [currentJournalName, setCurrentJournalName] = useState(journalName);

const [calendarOpen, setCalendarOpen] = useState(false);
const [selectedContributionMonth, setSelectedContributionMonth] = useState(new Date().getMonth());
const [hoveredContributionDayKey, setHoveredContributionDayKey] = useState<string | null>(null);

const [showPasswordFields, setShowPasswordFields] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [updatingPassword, setUpdatingPassword] = useState(false);
const [passwordError, setPasswordError] = useState("");
const [passwordSuccess, setPasswordSuccess] = useState("");

const [pastJournalsOpen, setPastJournalsOpen] = useState(false);

const desktopPastEntryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
const mobilePastEntryRefs = useRef<Record<string, HTMLButtonElement | null>>({});

const activeJournal = useMemo(() => {
  return journals.find((journal) => journal.id === activeJournalId) ?? null;
}, [journals, activeJournalId]);

const activeJournalYear = activeJournal?.year ?? new Date().getFullYear();

const calendarEntries = useMemo<PastEntry[]>(() => {
  return entries
    .filter((entry) => entry.content.trim())
    .map((entry) => ({
      id: entry.id,
      dateKey: entry.day_key,
      dateLabel: formatShortDate(getDateFromDayKey(entry.day_key)),
      content: entry.content,
    }));
}, [entries]);

const calendarEntryMap = useMemo(() => {
  return new Map(calendarEntries.map((entry) => [entry.dateKey, entry]));
}, [calendarEntries]);

const contributionMonths = useMemo(() => {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const firstDay = new Date(activeJournalYear, monthIndex, 1);
    const daysInMonth = new Date(activeJournalYear, monthIndex + 1, 0).getDate();
    const columnCount = Math.ceil((firstDay.getDay() + daysInMonth) / 7);
    const cellCount = columnCount * 7;
    const days = Array.from({ length: cellCount }, (_, cellIndex) => {
      const dayNumber = cellIndex - firstDay.getDay() + 1;

      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return null;
      }

      const date = new Date(activeJournalYear, monthIndex, dayNumber);
      const dayKey = getLocalDayKey(date);

      return {
        date,
        dayKey,
      };
    });

    return {
      key: getMonthKey(firstDay),
      title: firstDay.toLocaleDateString(undefined, { month: "long" }),
      columnCount,
      days,
    };
  });
}, [activeJournalYear]);

const selectedContributionMonthData =
  contributionMonths[selectedContributionMonth] ?? contributionMonths[0];

const selectedContributionEntryCount = useMemo(() => {
  if (!selectedContributionMonthData) return 0;

  return selectedContributionMonthData.days.filter((day) => {
    return day ? calendarEntryMap.has(day.dayKey) : false;
  }).length;
}, [calendarEntryMap, selectedContributionMonthData]);

const openCalendar = () => {
  const today = new Date();
  setJournalMenuOpen(false);
  setMobileMenuOpen(false);
  setHoveredContributionDayKey(null);
  setSelectedContributionMonth(
    activeJournalYear === today.getFullYear() ? today.getMonth() : 0
  );
  setCalendarOpen(true);
};

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



const dayOptions = useMemo(() => {
  return Array.from({ length: 31 }, (_, index) => index + 1);
}, []);


const monthOptions = useMemo(() => {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(activeJournalYear, index, 1);
    return {
      key: getMonthKey(date),
      label: formatMonthLabel(date),
    };
  });
}, [activeJournalYear]);

const selectedPastEntry = useMemo(() => {
  return archivedEntries.find((entry) => entry.id === selectedPastEntryId) ?? null;
}, [archivedEntries, selectedPastEntryId]);

const activeMonthKey = selectedPastMonth;

const activeDayValue = selectedPastDay;

const filteredArchivedEntries = useMemo(() => {
  return archivedEntries.filter((entry) => {
    const entryDate = getDateFromDayKey(entry.dateKey);

    const matchesMonth = activeMonthKey
      ? entry.dateKey.startsWith(activeMonthKey)
      : true;

    const matchesDay = activeDayValue
      ? entryDate.getDate() === activeDayValue
      : true;

    return matchesMonth && matchesDay;
  });
}, [archivedEntries, activeMonthKey, activeDayValue]);

const selectedMonthLabel =
  activeMonthKey
    ? monthOptions.find((month) => month.key === activeMonthKey)?.label ??
      formatMonthLabel(new Date(`${activeMonthKey}-01T12:00:00`))
    : "-";

const selectedDayLabel = activeDayValue ? String(activeDayValue) : "-";

const hasMonthFilter = activeMonthKey !== null;
const hasDayFilter = activeDayValue !== null;

const pastFilterButtonLabel =
  hasMonthFilter && hasDayFilter
    ? `${selectedMonthLabel} ${selectedDayLabel}`
    : hasMonthFilter
    ? selectedMonthLabel
    : hasDayFilter
    ? selectedDayLabel
    : "Filter";

    const isViewingPastJournal =
  activeJournalId !== null &&
  currentJournalId !== null &&
  activeJournalId !== currentJournalId;

 const isViewingPastEntry = selectedPastEntry !== null;
const isReadOnly = isViewingPastEntry || isViewingPastJournal;
const renameJournalIsValid =
  renameJournalValue.length > 0 && renameJournalValue.length <= 40;


const handleClosePastJournals = () => {
  setPastJournalsOpen(false);
};

const handleOpenJournal = (journalId: string) => {
  setSelectedPastEntryId(null);
  setSelectedPastMonth(null);
  setSelectedPastDay(null);
  setSelectedPastFilter("Most Recent");
  setPastMonthMenuOpen(false);
  setPastDayMenuOpen(false);
  setPastFilterMenuOpen(false);
  setMobileMenuOpen(false);
  setProfileMenuOpen(false);
  setPastJournalsOpen(false);
  setActiveJournalId(journalId);
};

  const handleRenameJournal = async () => {
  const nextName = renameJournalValue.trim();

  if (!renameJournalIsValid || updatingJournalName || !activeJournalId) return;

  if (nextName === currentJournalName) {
    setRenameJournalOpen(false);
    return;
  }

  setUpdatingJournalName(true);

  const { error } = await supabase
    .from("journals")
    .update({ name: nextName })
    .eq("id", activeJournalId);

  setUpdatingJournalName(false);

  if (error) {
    console.error("Update journal name error:", error.message);
    return;
  }

  setCurrentJournalName(nextName);
  setRenameJournalValue(nextName);
  setJournals((prev) =>
    prev.map((journal) =>
      journal.id === activeJournalId ? { ...journal, name: nextName } : journal
    )
  );
  onJournalNameUpdated?.(nextName);
  setRenameJournalOpen(false);
};

const handleOpenPasswordFields = () => {
  setShowPasswordFields(true);
  setPasswordError("");
  setNewPassword("");
  setConfirmPassword("");
};

const handleCloseProfileSettings = () => {
  setProfileSettingsOpen(false);
  setShowPasswordFields(false);
  setNewPassword("");
  setConfirmPassword("");
  setPasswordError("");
  setUpdatingPassword(false);
};

const handleUpdatePassword = async () => {
  const trimmedPassword = newPassword.trim();
  const trimmedConfirm = confirmPassword.trim();

  if (!trimmedPassword || !trimmedConfirm) {
    setPasswordError("Fill out both password fields.");
    return;
  }

  if (trimmedPassword.length < 8) {
    setPasswordError("Password must be at least 8 characters.");
    return;
  }

  if (trimmedPassword !== trimmedConfirm) {
    setPasswordError("Passwords do not match.");
    return;
  }

  setUpdatingPassword(true);
  setPasswordError("");
  setPasswordSuccess("");

  const { error } = await supabase.auth.updateUser({
    password: trimmedPassword,
  });

  if (error) {
    setUpdatingPassword(false);
    setPasswordError(error.message);
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ has_password: true })
    .eq("id", userId);

  setUpdatingPassword(false);

  if (profileError) {
    setPasswordError(profileError.message);
    return;
  }

  setHasPassword(true);
  setNewPassword("");
  setConfirmPassword("");
  setPasswordSuccess("Password updated");

  setTimeout(() => {
    setPasswordSuccess("");
  }, 2000);
};

useEffect(() => {
  if (journalName.trim()) {
    setCurrentJournalName(journalName);
    setRenameJournalValue(journalName);
  }
}, [journalName]);

useEffect(() => {
  if (!pastJournalsOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setPastJournalsOpen(false);
    }
  };

  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [pastJournalsOpen]);

useEffect(() => {
  let mounted = true;

  async function loadAccountDetails() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Load user email error:", error.message);
      return;
    }

    if (!user || !mounted) return;

    setAccountEmail(user.email ?? "");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_password")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Load profile auth settings error:", profileError.message);
      return;
    }

    if (!mounted) return;

    setHasPassword(profile?.has_password ?? false);
  }

  loadAccountDetails();

  return () => {
    mounted = false;
  };
}, []);

useEffect(() => {
  if (!selectedPastEntryId) return;

  const timeout = window.setTimeout(() => {
    const isMobileLayout = window.innerWidth <= 900;

    const activeEntryEl = isMobileLayout
      ? mobilePastEntryRefs.current[selectedPastEntryId]
      : desktopPastEntryRefs.current[selectedPastEntryId];

    if (!activeEntryEl) return;

    activeEntryEl.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 120);

  return () => window.clearTimeout(timeout);
}, [selectedPastEntryId, filteredArchivedEntries, mobileMenuOpen, calendarOpen]);

useEffect(() => {
  if (!activeJournalId) return;

  const activeJournal = journals.find((journal) => journal.id === activeJournalId);
  if (!activeJournal) return;

  setCurrentJournalName(activeJournal.name);
  setRenameJournalValue(activeJournal.name);
}, [journals, activeJournalId]);

useEffect(() => {
  if (!profileSettingsOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCloseProfileSettings();
    }
  };

  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [profileSettingsOpen, newPassword, confirmPassword, showPasswordFields]);

useEffect(() => {
  if (!calendarOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setCalendarOpen(false);
    }
  };

  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [calendarOpen]);

useEffect(() => {
  if (!renameJournalOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setRenameJournalOpen(false);
      setRenameJournalValue(currentJournalName);
    }
  };

  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [renameJournalOpen, currentJournalName]);

useEffect(() => {
  if (!journalMenuOpen) return;

  const handlePointerDown = (e: MouseEvent) => {
    const target = e.target as Node;

    const clickedDesktop =
      desktopJournalMenuRef.current?.contains(target) ?? false;

    const clickedMobile =
      mobileJournalMenuRef.current?.contains(target) ?? false;

    if (!clickedDesktop && !clickedMobile) {
      setJournalMenuOpen(false);
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setJournalMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("mousedown", handlePointerDown);
    document.removeEventListener("keydown", handleEscape);
  };
}, [journalMenuOpen]);



useEffect(() => {
  if (selectedPastFilter !== "By Day") {
    setPastDayMenuOpen(false);
  }
}, [selectedPastFilter]);

useEffect(() => {
  if (!selectedPastEntryId) return;

  const stillVisible = filteredArchivedEntries.some((entry) => entry.id === selectedPastEntryId);

  if (!stillVisible) {
    setSelectedPastEntryId(null);
  }
}, [filteredArchivedEntries, selectedPastEntryId]);

useEffect(() => {
  const updateTimer = () => {
    const now = new Date();
    const todayKey = getLocalDayKey(now);

if (todayKey !== currentDayKey) {
  setCurrentDayKey(todayKey);
  setCurrentDateLabel(formatFullDate(now));
  setSelectedPastEntryId(null);
  setJustSaved(false);
  setText("");
  setSavedText("");

  getOrCreateCurrentJournal().then((journal) => {
    if (journal) {
      setActiveJournalId(journal.id);
    }
  });
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
    const target = e.target as Node;

    const clickedDesktop =
      desktopProfileMenuRef.current?.contains(target) ?? false;

    const clickedMobile =
      mobileProfileMenuRef.current?.contains(target) ?? false;

    if (!clickedDesktop && !clickedMobile) {
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

useEffect(() => {
  if (!pastFilterMenuOpen) return;

  const handlePointerDown = (e: MouseEvent) => {
    const target = e.target as Node;

    const clickedDesktop =
      desktopPastFilterMenuRef.current?.contains(target) ?? false;

    const clickedMobile =
      mobilePastFilterMenuRef.current?.contains(target) ?? false;

    if (!clickedDesktop && !clickedMobile) {
      setPastFilterMenuOpen(false);
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setPastFilterMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("mousedown", handlePointerDown);
    document.removeEventListener("keydown", handleEscape);
  };
}, [pastFilterMenuOpen]);

async function getOrCreateCurrentJournal() {
  const currentYear = new Date().getFullYear();

  const { data: existingJournals, error: fetchError } = await supabase
    .from("journals")
    .select("id, name, year, is_current, created_at, closed_at")
    .eq("user_id", userId)
    .order("year", { ascending: false });

  if (fetchError) {
    console.error("Load journals error:", fetchError.message);
    return null;
  }

  const journalsList = existingJournals ?? [];

  const currentYearJournal =
    journalsList.find((journal) => journal.year === currentYear) ?? null;

  const journalsMarkedCurrent = journalsList.filter((journal) => journal.is_current);

  let resolvedJournal: Journal | null = null;

  if (currentYearJournal) {
    resolvedJournal = currentYearJournal;

    const journalsNeedingClose = journalsList.filter(
      (journal) => journal.id !== currentYearJournal.id && journal.is_current
    );

    if (!currentYearJournal.is_current) {
      const { error: promoteError } = await supabase
        .from("journals")
        .update({
          is_current: true,
          closed_at: null,
        })
        .eq("id", currentYearJournal.id);

      if (promoteError) {
        console.error("Promote current year journal error:", promoteError.message);
        return null;
      }
    }

    if (journalsNeedingClose.length > 0) {
      const idsToClose = journalsNeedingClose.map((journal) => journal.id);

      const { error: closeError } = await supabase
        .from("journals")
        .update({
          is_current: false,
          closed_at: new Date().toISOString(),
        })
        .in("id", idsToClose);

      if (closeError) {
        console.error("Close outdated current journals error:", closeError.message);
        return null;
      }
    }
  } else {
    if (journalsMarkedCurrent.length > 0) {
      const idsToClose = journalsMarkedCurrent.map((journal) => journal.id);

      const { error: closeError } = await supabase
        .from("journals")
        .update({
          is_current: false,
          closed_at: new Date().toISOString(),
        })
        .in("id", idsToClose);

      if (closeError) {
        console.error("Close previous year journals error:", closeError.message);
        return null;
      }
    }

const initialJournalName =
  journalName.trim().length > 0 ? journalName.trim() : `${currentYear} Journal`;

const { data: createdJournal, error: createError } = await supabase
  .from("journals")
  .insert({
    user_id: userId,
    name: initialJournalName,
    year: currentYear,
    is_current: true,
    closed_at: null,
  })
  .select("id, name, year, is_current, created_at, closed_at")
  .single();

    if (createError) {
      console.error("Create current year journal error:", createError.message);
      return null;
    }

    resolvedJournal = createdJournal;
  }

  const { data: refreshedJournals, error: refreshError } = await supabase
    .from("journals")
    .select("id, name, year, is_current, created_at, closed_at")
    .eq("user_id", userId)
    .order("year", { ascending: false });

  if (refreshError) {
    console.error("Refresh journals error:", refreshError.message);
    return null;
  }

  const finalJournals = refreshedJournals ?? [];
  const finalCurrentJournal =
    finalJournals.find((journal) => journal.year === currentYear && journal.is_current) ??
    finalJournals.find((journal) => journal.year === currentYear) ??
    resolvedJournal;

  if (!finalCurrentJournal) {
    console.error("No current journal could be resolved.");
    return null;
  }

  setJournals(finalJournals);
  setCurrentJournalId(finalCurrentJournal.id);
  setActiveJournalId((prev) => {
    if (!prev) return finalCurrentJournal.id;

    const prevJournalStillExists = finalJournals.some((journal) => journal.id === prev);
    return prevJournalStillExists ? prev : finalCurrentJournal.id;
  });
  setCurrentJournalName(finalCurrentJournal.name);
  setRenameJournalValue(finalCurrentJournal.name);
  setJournalsLoading(false);

  return finalCurrentJournal;
}

async function loadEntries(journalId: string) {
  setEntriesLoading(true);

  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, journal_id, day_key, content, created_at, updated_at")
    .eq("journal_id", journalId)
    .order("day_key", { ascending: false });

  if (error) {
    console.error("Load entries error:", error.message);
    setEntries([]);
    setSavedText("");
    setText("");
    setEntriesLoading(false);
    return;
  }

  const loadedEntries = data ?? [];
  setEntries(loadedEntries);

  const todayEntry =
    loadedEntries.find((entry) => entry.day_key === getLocalDayKey(new Date())) ?? null;

  const isCurrentJournal = journalId === currentJournalId;

  if (isCurrentJournal) {
    setSavedText(todayEntry?.content ?? "");
    setText(todayEntry?.content ?? "");
  } else {
    setSavedText("");
    setText("");
  }

  setEntriesLoading(false);
}

useEffect(() => {
  if (selectedPastFilter !== "By Month") {
    setPastMonthMenuOpen(false);
  }
}, [selectedPastFilter]);

useEffect(() => {
  async function initializeJournalFlow() {
    setJournalsLoading(true);

    const journal = await getOrCreateCurrentJournal();
    if (!journal) {
      setJournalsLoading(false);
      return;
    }

    await loadEntries(journal.id);
  }

  initializeJournalFlow();
}, [userId, journalName]);

useEffect(() => {
  if (!activeJournalId) return;
  loadEntries(activeJournalId);
}, [activeJournalId]);

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
  !buttonIsAccent || isReadOnly || entriesLoading || savingEntry || journalsLoading;

const handleSave = async () => {
  if (buttonDisabled || savingEntry || !activeJournalId) return;

  const content = text;
  if (!content.trim()) return;

  setSavingEntry(true);

  const { data, error } = await supabase
    .from("journal_entries")
    .upsert(
      {
        user_id: userId,
        journal_id: activeJournalId,
        day_key: currentDayKey,
        content,
      },
      {
        onConflict: "journal_id,day_key",
      }
    )
    .select("id, journal_id, day_key, content, created_at, updated_at")
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

  if (currentJournalId && activeJournalId !== currentJournalId) {
    setActiveJournalId(currentJournalId);
  }
};

  const openPastEntry = (entryId: string) => {
    setSelectedPastEntryId(entryId);
    setMobileMenuOpen(false);
  };

  return (
    <main className="app">
      <div className="shell">
        <aside className="sidebar">
<div className="journal-title-wrap" ref={desktopJournalMenuRef}>
  <button
    type="button"
    className="journal-title-button"
    onClick={() => setJournalMenuOpen((prev) => !prev)}
    aria-expanded={journalMenuOpen}
    aria-haspopup="menu"
  >
<span className="journal-title-text">{currentJournalName}</span>

    <span
      className={`journal-title-chevron ${
        journalMenuOpen ? "journal-title-chevron--open" : ""
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" fill="none">
        <path
          d="M3 6L8 11L13 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </button>

  <div className={`journal-menu ${journalMenuOpen ? "journal-menu--open" : ""}`}>
    <button
      type="button"
      className="journal-menu-item"
   onClick={() => {
  openCalendar();
}}
    >
      <span className="journal-menu-item-icon" aria-hidden="true">
  <svg viewBox="0 0 512 512" fill="currentColor">
    <path d="m344.667 276c0-11.046 8.954-20 20-20h19.333c11.046 0 20 8.954 20 20s-8.954 20-20 20h-19.333c-11.046 0-20-8.954-20-20zm167.333-116.517v194.85c0 30.707-11.958 59.576-33.671 81.289l-42.707 42.707c-21.713 21.713-50.582 33.671-81.289 33.671h-234.183c-32.094 0-62.266-12.498-84.959-35.191s-35.191-52.866-35.191-84.959v-232.367c0-65.706 52.609-118.992 118-120.131v-19.352c0-11.046 8.954-20 20-20s20 8.954 20 20v19.333h196v-19.333c0-11.046 8.954-20 20-20s20 8.954 20 20v19.352c65.421 1.139 118 54.459 118 120.131zm-471.972-2.15h431.943c-1.124-42.968-35.795-76.868-77.972-77.972v19.305c0 11.046-8.954 20-20 20s-20-8.954-20-20v-19.333h-195.999v19.333c0 11.046-8.954 20-20 20s-20-8.954-20-20v-19.305c-42.973 1.126-76.868 35.801-77.972 77.972zm429.289 217h-54.984c-22.056 0-40 17.944-40 40v54.984c12.362-3.4 23.692-9.96 33.004-19.272l42.707-42.707c9.312-9.312 15.873-20.643 19.273-33.005zm2.683-177h-432v194.517c0 21.409 8.337 41.537 23.476 56.675 15.138 15.138 35.265 23.475 56.674 23.475h214.183v-57.667c0-44.112 35.888-80 80-80h57.667zm-344 197.334h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.954 20 20 20zm118.333-98.667h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.955 20 20 20zm-118.333 0h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.954 20 20 20zm118.333 98.667h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.955 20 20 20z"></path>
  </svg>
      </span>

      <span>View calendar</span>
    </button>

    <button
      type="button"
      className="journal-menu-item"
onClick={() => {
  setJournalMenuOpen(false);
  setMobileMenuOpen(false);
  setRenameJournalValue(currentJournalName);
  setRenameJournalOpen(true);
}}
    >
      <span className="journal-menu-item-icon" aria-hidden="true">
     <svg
  id="fi_2040536"
  viewBox="0 0 512.015 512.015"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="m512 256.015v107.628c0 37.396-14.563 72.553-41.006 98.995-4.217 2.976-38.981 49.377-107.366 49.377h-215.256c-68.378 0-103.106-46.371-107.367-49.377-26.443-26.443-41.005-61.599-41.005-98.995v-215.256c0-37.396 14.562-72.552 41.005-98.995 4.212-2.972 38.981-49.377 107.367-49.377h107.628c11.046 0 20 8.954 20 20s-8.954 20-20 20h-107.628c-50.105 0-74.848 34.617-79.083 37.662-18.887 18.887-29.289 43.999-29.289 70.71v215.256c0 26.711 10.402 51.823 29.289 70.71 4.382 3.151 28.708 37.662 79.083 37.662h215.256c50.109 0 74.847-34.615 79.082-37.661 18.888-18.888 29.29-44 29.29-70.711v-107.628c0-11.046 8.954-20 20-20s20 8.954 20 20zm-388.142-14.142 222.094-222.094c26.374-26.373 69.059-26.37 95.43 0l50.854 50.854c26.373 26.373 26.37 69.06-.001 95.431l-222.919 222.918c-3.736 3.737-8.8 5.843-14.084 5.858l-117.175.334c-.019 0-.038 0-.057 0-11.042 0-20-8.959-20-20v-119.159c0-5.304 2.107-10.391 5.858-14.142zm219.426-162.858 89.716 89.716 30.952-30.952c10.739-10.74 10.739-28.122 0-38.862l-50.854-50.854c-10.74-10.741-28.124-10.738-38.862 0zm-185.284 276.102 88.867-.253 157.849-157.849-89.716-89.716-157 157z"></path>
</svg>
      </span>

      <span>Change name</span>
    </button>
  </div>
</div>

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
<div className="past-header">
  <div className="past-title">Past Entries</div>

  <div className="past-filter-wrap" ref={desktopPastFilterMenuRef}>
<button
  type="button"
  className={`past-filter-button ${pastFilterMenuOpen ? "past-filter-button--open" : ""}`}
  aria-expanded={pastFilterMenuOpen}
  onClick={() => {
    setPastFilterMenuOpen((prev) => {
      const nextOpen = !prev;

    if (nextOpen) {
  setPastMonthMenuOpen(false);
  setPastDayMenuOpen(false);
}

      return nextOpen;
    });
  }}
>
  <span className="past-filter-button-label">{pastFilterButtonLabel}</span>

<span className="past-filter-icon">
  <svg
    viewBox="0 0 512.023 512.023"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m492.012 0h-472c-11.046 0-20 8.954-20 20 0 80.598 40.06 155.371 107.159 200.02 43.94 29.239 70.174 78.206 70.174 130.985v62.328c0 19.354 10.334 37.521 26.97 47.412l78.019 46.39c22.981 13.662 52.346-2.925 52.346-29.777v-126.353c0-52.779 26.233-101.746 70.175-130.985 67.097-44.649 107.157-119.423 107.157-200.02 0-11.046-8.954-20-20-20zm-109.32 186.719c-55.111 36.673-88.014 98.088-88.014 164.286v116.935l-69.921-41.575c-4.572-2.719-7.413-7.712-7.413-13.031v-62.328c0-66.198-32.903-127.614-88.015-164.286-50.333-33.493-82.411-87.319-88.325-146.72h430.016c-5.915 59.402-37.994 113.227-88.328 146.719z"/>
  </svg>
</span>
</button>

<div className={`past-filter-menu ${pastFilterMenuOpen ? "past-filter-menu--open" : ""}`} role="menu">
  {["By Month", "By Day", "Most Recent"].map((option) => {
    const isActive =
  option === "By Month"
    ? monthFilterActive
    : option === "By Day"
    ? dayFilterActive
    : !monthFilterActive && !dayFilterActive;

    return (
      <div key={option} className="past-filter-menu-group">
        <button
          type="button"
          className={`past-filter-menu-item ${isActive ? "past-filter-menu-item--active" : ""}`}
          role="menuitem"
onClick={() => {
  if (option === "By Month") {
    if (selectedPastFilter === "By Month") {
      setSelectedPastMonth(null);
      setSelectedPastFilter("Most Recent");
      setPastMonthMenuOpen(false);
      setSelectedPastEntryId(null);
      return;
    }

    setSelectedPastFilter("By Month");
    setPastMonthMenuOpen(false);
    setPastDayMenuOpen(false);
    return;
  }

  if (option === "By Day") {
    if (selectedPastFilter === "By Day") {
      setSelectedPastDay(null);
      setSelectedPastFilter("Most Recent");
      setPastDayMenuOpen(false);
      setSelectedPastEntryId(null);
      return;
    }

    setSelectedPastFilter("By Day");
    setPastDayMenuOpen(false);
    setPastMonthMenuOpen(false);
    return;
  }

  setSelectedPastFilter("Most Recent");
  setSelectedPastMonth(null);
  setSelectedPastDay(null);
  setPastMonthMenuOpen(false);
  setPastDayMenuOpen(false);
  setPastFilterMenuOpen(false);
  setSelectedPastEntryId(null);
}}
        >
          <span>{option}</span>

{(option === "By Month" || option === "By Day") && (
  <span className="past-filter-menu-item-arrow" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3L11 8L6 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
)}
        </button>

{option === "By Month" && (monthFilterActive || selectedPastFilter === "By Month") && (
  <div className="past-filter-submenu">
<button
  type="button"
  className={`past-filter-submenu-trigger ${
    pastMonthMenuOpen ? "past-filter-submenu-trigger--open" : ""
  }`}
  onClick={() => {
    setPastMonthMenuOpen((prev) => !prev);
  }}
>
     <span>{selectedMonthLabel}</span>

      <span
        className={`past-filter-submenu-chevron ${
          pastMonthMenuOpen ? "past-filter-submenu-chevron--open" : ""
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3 6L8 11L13 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>

    {pastMonthMenuOpen && (
      <div className="past-filter-submenu-options">
        {monthOptions.map((month) => (
          <button
            key={month.key}
            type="button"
            className={`past-filter-submenu-item ${
              activeMonthKey === month.key ? "past-filter-submenu-item--active" : ""
            }`}
            onClick={() => {
              setSelectedPastMonth(month.key);
              setPastMonthMenuOpen(false);
              setPastFilterMenuOpen(false);
              setSelectedPastEntryId(null);
            }}
          >
            {month.label}
          </button>
        ))}
      </div>
    )}
  </div>
)}
{option === "By Day" && (dayFilterActive || selectedPastFilter === "By Day") && (
  <div className="past-filter-submenu">
    <button
      type="button"
      className={`past-filter-submenu-trigger ${
        pastDayMenuOpen ? "past-filter-submenu-trigger--open" : ""
      }`}
      onClick={() => {
        setPastDayMenuOpen((prev) => !prev);
      }}
    >
      <span>{selectedDayLabel}</span>

      <span
        className={`past-filter-submenu-chevron ${
          pastDayMenuOpen ? "past-filter-submenu-chevron--open" : ""
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3 6L8 11L13 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>

    {pastDayMenuOpen && (
      <div className="past-filter-submenu-options">
        {dayOptions.map((day) => (
          <button
            key={day}
            type="button"
            className={`past-filter-submenu-item ${
              activeDayValue === day ? "past-filter-submenu-item--active" : ""
            }`}
            onClick={() => {
              setSelectedPastDay(day);
              setPastDayMenuOpen(false);
              setPastFilterMenuOpen(false);
              setSelectedPastEntryId(null);
            }}
          >
            {day}
          </button>
        ))}
      </div>
    )}
  </div>
)}
      </div>
    );
  })}
</div>
  </div>
</div>

              {filteredArchivedEntries.length === 0 ? (
                <div className="past-text">
  {archivedEntries.length === 0
    ? "Your past entries will appear here"
    : "No entries found for this filter"}
</div>
              ) : (
                <div className="past-entry-list">
                  {filteredArchivedEntries.map((entry) => (
<button
  key={entry.id}
ref={(el) => {
  desktopPastEntryRefs.current[entry.id] = el;
}}
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

<div className="sidebar-bottom" ref={desktopProfileMenuRef}>
  <div className="sidebar-divider--bottom" />

  <div className={`profile-menu ${profileMenuOpen ? "profile-menu--open" : ""}`}>
<button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setPastJournalsOpen(true);
  }}
>
  <span className="profile-menu-item-icon" aria-hidden="true">
    <svg viewBox="0 0 512.5 512.5" fill="currentColor">
      <path d="m413.583 393.333c0 11.046-8.954 20-20 20h-78.666c-11.046 0-20-8.954-20-20s8.954-20 20-20h78.666c11.046 0 20 8.955 20 20zm98.667-234.666v273.833c0 44.112-35.888 80-80 80h-352c-44.112 0-80-35.888-80-80v-352.5c0-44.112 35.888-80 80-80h72.48c21.368 0 41.458 8.321 56.568 23.431l55.235 55.235h167.717c44.112.001 80 35.888 80 80.001zm-40 0c0-22.056-17.944-40-40-40h-176c-5.305 0-10.392-2.107-14.143-5.858l-61.093-61.093c-7.554-7.555-17.599-11.716-28.284-11.716h-72.48c-22.056 0-40 17.944-40 40v352.5c0 22.056 17.944 40 40 40h352c22.056 0 40-17.944 40-40z"></path>
    </svg>
  </span>
  <span>My journals</span>
</button>

<button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setProfileSettingsOpen(true);
  }}
>
  <span className="profile-menu-item-icon" aria-hidden="true">
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M489.514 296.695l-21.3-17.534c-14.59-12.011-14.564-34.335.001-46.322l21.299-17.534c15.157-12.479 19.034-33.877 9.218-50.882l-42.058-72.846c-9.818-17.004-30.292-24.344-48.674-17.458l-25.835 9.679c-17.696 6.628-37.016-4.551-40.117-23.161l-4.535-27.214c-3.228-19.366-19.821-33.423-39.455-33.423h-84.115c-19.635 0-36.229 14.057-39.456 33.424l-4.536 27.213c-3.107 18.643-22.453 29.778-40.116 23.162l-25.835-9.68c-18.383-6.886-38.855.455-48.674 17.458l-42.057 72.845c-9.817 17.003-5.941 38.402 9.218 50.882l21.299 17.534c14.592 12.012 14.563 34.334 0 46.322l-21.3 17.534c-15.158 12.48-19.035 33.879-9.218 50.882l42.058 72.846c9.818 17.003 30.286 24.344 48.674 17.458l25.834-9.679c17.699-6.631 37.015 4.556 40.116 23.161l4.536 27.212c3.228 19.369 19.822 33.426 39.456 33.426h84.115c19.634 0 36.228-14.057 39.455-33.424l4.535-27.212c3.106-18.638 22.451-29.781 40.117-23.161l25.836 9.678c18.387 6.887 38.856-.454 48.674-17.458l42.059-72.847c9.815-17.003 5.938-38.402-9.219-50.881zm-67.481 103.728l-25.835-9.679c-41.299-15.471-86.37 10.63-93.605 54.043l-4.535 27.213h-84.115l-4.536-27.213c-7.249-43.497-52.386-69.484-93.605-54.043l-25.835 9.679-42.057-72.846 21.299-17.534c34.049-28.03 33.978-80.114 0-108.086l-21.299-17.534 42.058-72.846 25.834 9.679c41.3 15.47 86.37-10.63 93.605-54.043l4.535-27.213h84.115l4.535 27.213c7.25 43.502 52.389 69.481 93.605 54.043l25.835-9.679 42.067 72.836s-.003.003-.011.009l-21.298 17.534c-34.048 28.028-33.98 80.113-.001 108.086l21.3 17.534zm-166.033-243.09c-54.405 0-98.667 44.262-98.667 98.667s44.262 98.667 98.667 98.667 98.667-44.262 98.667-98.667-44.262-98.667-98.667-98.667zm0 157.334c-32.349 0-58.667-26.318-58.667-58.667s26.318-58.667 58.667-58.667 58.667 26.318 58.667 58.667-26.318 58.667-58.667 58.667z" />
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
    <svg viewBox="0 0 512.473 512.473" fill="currentColor">
      <path d="m512.236 276.474v155.999c0 44.112-35.888 80-80 80h-352c-44.112 0-80-35.888-80-80v-155.999c0-44.112 35.888-80 80-80h58c11.046 0 20 8.954 20 20s-8.954 20-20 20h-58c-22.056 0-40 17.944-40 40v155.999c0 22.056 17.944 40 40 40h352c22.056 0 40-17.944 40-40v-155.999c0-22.056-17.944-40-40-40h-58c-11.046 0-20-8.954-20-20s8.954-20 20-20h58c44.113 0 80 35.887 80 80zm-352.875-156.43c71.479-70.82 68.571-70.054 76.645-74.712l.465 328.668c.016 11.036 8.967 19.972 20 19.972h.029c11.046-.016 19.987-8.982 19.972-20.028l-.465-328.607c8.058 4.651 5.064 3.793 77.105 75.175 7.81 7.81 20.473 7.811 28.284 0s7.811-20.474 0-28.284l-68.826-68.824c-31.028-31.028-81.754-31.383-113.137 0l-68.356 68.356c-7.811 7.811-7.811 20.474 0 28.284s20.474 7.811 28.284 0z" />
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

    <div className="mobile-journal-title-wrap" ref={mobileJournalMenuRef}>
  <button
    type="button"
    className="mobile-journal-title-button"
    onClick={() => setJournalMenuOpen((prev) => !prev)}
    aria-expanded={journalMenuOpen}
    aria-haspopup="menu"
  >
    <span className="mobile-journal-title">{currentJournalName}</span>

    <span
      className={`journal-title-chevron ${
        journalMenuOpen ? "journal-title-chevron--open" : ""
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" fill="none">
        <path
          d="M3 6L8 11L13 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </button>

  <div className={`journal-menu ${journalMenuOpen ? "journal-menu--open" : ""}`}>
    <button
      type="button"
      className="journal-menu-item"
  onClick={() => {
  openCalendar();
}}
    >
      <span className="journal-menu-item-icon" aria-hidden="true">
  <svg viewBox="0 0 512 512" fill="currentColor">
    <path d="m344.667 276c0-11.046 8.954-20 20-20h19.333c11.046 0 20 8.954 20 20s-8.954 20-20 20h-19.333c-11.046 0-20-8.954-20-20zm167.333-116.517v194.85c0 30.707-11.958 59.576-33.671 81.289l-42.707 42.707c-21.713 21.713-50.582 33.671-81.289 33.671h-234.183c-32.094 0-62.266-12.498-84.959-35.191s-35.191-52.866-35.191-84.959v-232.367c0-65.706 52.609-118.992 118-120.131v-19.352c0-11.046 8.954-20 20-20s20 8.954 20 20v19.333h196v-19.333c0-11.046 8.954-20 20-20s20 8.954 20 20v19.352c65.421 1.139 118 54.459 118 120.131zm-471.972-2.15h431.943c-1.124-42.968-35.795-76.868-77.972-77.972v19.305c0 11.046-8.954 20-20 20s-20-8.954-20-20v-19.333h-195.999v19.333c0 11.046-8.954 20-20 20s-20-8.954-20-20v-19.305c-42.973 1.126-76.868 35.801-77.972 77.972zm429.289 217h-54.984c-22.056 0-40 17.944-40 40v54.984c12.362-3.4 23.692-9.96 33.004-19.272l42.707-42.707c9.312-9.312 15.873-20.643 19.273-33.005zm2.683-177h-432v194.517c0 21.409 8.337 41.537 23.476 56.675 15.138 15.138 35.265 23.475 56.674 23.475h214.183v-57.667c0-44.112 35.888-80 80-80h57.667zm-344 197.334h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.954 20 20 20zm118.333-98.667h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.955 20 20 20zm-118.333 0h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.954 20 20 20zm118.333 98.667h19.333c11.046 0 20-8.954 20-20s-8.954-20-20-20h-19.333c-11.046 0-20 8.954-20 20s8.955 20 20 20z"></path>
  </svg>
      </span>

      <span>View calendar</span>
    </button>

    <button
      type="button"
      className="journal-menu-item"
onClick={() => {
  setJournalMenuOpen(false);
  setMobileMenuOpen(false);
  setRenameJournalValue(currentJournalName);
  setRenameJournalOpen(true);
}}
    >
      <span className="journal-menu-item-icon" aria-hidden="true">
<svg
  id="fi_2040536"
  viewBox="0 0 512.015 512.015"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="m512 256.015v107.628c0 37.396-14.563 72.553-41.006 98.995-4.217 2.976-38.981 49.377-107.366 49.377h-215.256c-68.378 0-103.106-46.371-107.367-49.377-26.443-26.443-41.005-61.599-41.005-98.995v-215.256c0-37.396 14.562-72.552 41.005-98.995 4.212-2.972 38.981-49.377 107.367-49.377h107.628c11.046 0 20 8.954 20 20s-8.954 20-20 20h-107.628c-50.105 0-74.848 34.617-79.083 37.662-18.887 18.887-29.289 43.999-29.289 70.71v215.256c0 26.711 10.402 51.823 29.289 70.71 4.382 3.151 28.708 37.662 79.083 37.662h215.256c50.109 0 74.847-34.615 79.082-37.661 18.888-18.888 29.29-44 29.29-70.711v-107.628c0-11.046 8.954-20 20-20s20 8.954 20 20zm-388.142-14.142 222.094-222.094c26.374-26.373 69.059-26.37 95.43 0l50.854 50.854c26.373 26.373 26.37 69.06-.001 95.431l-222.919 222.918c-3.736 3.737-8.8 5.843-14.084 5.858l-117.175.334c-.019 0-.038 0-.057 0-11.042 0-20-8.959-20-20v-119.159c0-5.304 2.107-10.391 5.858-14.142zm219.426-162.858 89.716 89.716 30.952-30.952c10.739-10.74 10.739-28.122 0-38.862l-50.854-50.854c-10.74-10.741-28.124-10.738-38.862 0zm-185.284 276.102 88.867-.253 157.849-157.849-89.716-89.716-157 157z"></path>
</svg>
      </span>

      <span>Change name</span>
    </button>
  </div>
</div>
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
<div className="past-header">
  <div className="past-title">Past Entries</div>

  <div className="past-filter-wrap" ref={mobilePastFilterMenuRef}>
<button
  type="button"
  className={`past-filter-button ${pastFilterMenuOpen ? "past-filter-button--open" : ""}`}
  aria-expanded={pastFilterMenuOpen}
  onClick={() => {
    setPastFilterMenuOpen((prev) => {
      const nextOpen = !prev;

  if (nextOpen) {
  setPastMonthMenuOpen(false);
  setPastDayMenuOpen(false);
}

      return nextOpen;
    });
  }}
>
<span className="past-filter-button-label">{pastFilterButtonLabel}</span>

<span className="past-filter-icon">
  <svg
    viewBox="0 0 512.023 512.023"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m492.012 0h-472c-11.046 0-20 8.954-20 20 0 80.598 40.06 155.371 107.159 200.02 43.94 29.239 70.174 78.206 70.174 130.985v62.328c0 19.354 10.334 37.521 26.97 47.412l78.019 46.39c22.981 13.662 52.346-2.925 52.346-29.777v-126.353c0-52.779 26.233-101.746 70.175-130.985 67.097-44.649 107.157-119.423 107.157-200.02 0-11.046-8.954-20-20-20zm-109.32 186.719c-55.111 36.673-88.014 98.088-88.014 164.286v116.935l-69.921-41.575c-4.572-2.719-7.413-7.712-7.413-13.031v-62.328c0-66.198-32.903-127.614-88.015-164.286-50.333-33.493-82.411-87.319-88.325-146.72h430.016c-5.915 59.402-37.994 113.227-88.328 146.719z"/>
  </svg>
</span>
</button>
<div className={`past-filter-menu ${pastFilterMenuOpen ? "past-filter-menu--open" : ""}`} role="menu">
  {["By Month", "By Day", "Most Recent"].map((option) => {
   const isActive =
  option === "By Month"
    ? monthFilterActive
    : option === "By Day"
    ? dayFilterActive
    : !monthFilterActive && !dayFilterActive;

    return (
      <div key={option} className="past-filter-menu-group">
        <button
          type="button"
          className={`past-filter-menu-item ${isActive ? "past-filter-menu-item--active" : ""}`}
          role="menuitem"
onClick={() => {
  if (option === "By Month") {
    if (selectedPastFilter === "By Month") {
      setSelectedPastMonth(null);
      setSelectedPastFilter("Most Recent");
      setPastMonthMenuOpen(false);
      setSelectedPastEntryId(null);
      return;
    }

    setSelectedPastFilter("By Month");
    setPastMonthMenuOpen(false);
    setPastDayMenuOpen(false);
    return;
  }

  if (option === "By Day") {
    if (selectedPastFilter === "By Day") {
      setSelectedPastDay(null);
      setSelectedPastFilter("Most Recent");
      setPastDayMenuOpen(false);
      setSelectedPastEntryId(null);
      return;
    }

    setSelectedPastFilter("By Day");
    setPastDayMenuOpen(false);
    setPastMonthMenuOpen(false);
    return;
  }

  setSelectedPastFilter("Most Recent");
  setSelectedPastMonth(null);
  setSelectedPastDay(null);
  setPastMonthMenuOpen(false);
  setPastDayMenuOpen(false);
  setPastFilterMenuOpen(false);
  setSelectedPastEntryId(null);
}}
        >
          <span>{option}</span>

{(option === "By Month" || option === "By Day") && (
  <span className="past-filter-menu-item-arrow" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3L11 8L6 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
)}
        </button>

{option === "By Month" && (monthFilterActive || selectedPastFilter === "By Month") && (
  <div className="past-filter-submenu">
<button
  type="button"
  className={`past-filter-submenu-trigger ${
    pastMonthMenuOpen ? "past-filter-submenu-trigger--open" : ""
  }`}
  onClick={() => {
    setPastMonthMenuOpen((prev) => !prev);
  }}
>
<span>{selectedMonthLabel}</span>

      <span
        className={`past-filter-submenu-chevron ${
          pastMonthMenuOpen ? "past-filter-submenu-chevron--open" : ""
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3 6L8 11L13 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>

    {pastMonthMenuOpen && (
      <div className="past-filter-submenu-options">
        {monthOptions.map((month) => (
          <button
            key={month.key}
            type="button"
            className={`past-filter-submenu-item ${
              activeMonthKey === month.key ? "past-filter-submenu-item--active" : ""
            }`}
            onClick={() => {
              setSelectedPastMonth(month.key);
              setPastMonthMenuOpen(false);
              setPastFilterMenuOpen(false);
              setSelectedPastEntryId(null);
            }}
          >
            {month.label}
          </button>
        ))}
      </div>
    )}
  </div>
)}
{option === "By Day" && (dayFilterActive || selectedPastFilter === "By Day") && (
  <div className="past-filter-submenu">
    <button
      type="button"
      className={`past-filter-submenu-trigger ${
        pastDayMenuOpen ? "past-filter-submenu-trigger--open" : ""
      }`}
      onClick={() => {
        setPastDayMenuOpen((prev) => !prev);
      }}
    >
      <span>{selectedDayLabel}</span>

      <span
        className={`past-filter-submenu-chevron ${
          pastDayMenuOpen ? "past-filter-submenu-chevron--open" : ""
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3 6L8 11L13 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>

    {pastDayMenuOpen && (
      <div className="past-filter-submenu-options">
        {dayOptions.map((day) => (
          <button
            key={day}
            type="button"
            className={`past-filter-submenu-item ${
              activeDayValue === day ? "past-filter-submenu-item--active" : ""
            }`}
            onClick={() => {
              setSelectedPastDay(day);
              setPastDayMenuOpen(false);
              setPastFilterMenuOpen(false);
              setSelectedPastEntryId(null);
            }}
          >
            {day}
          </button>
        ))}
      </div>
    )}
  </div>
)}
      </div>
    );
  })}
</div>
  </div>
</div>

{filteredArchivedEntries.length === 0 ? (
  <div className="past-text">
  {archivedEntries.length === 0
    ? "Your past entries will appear here"
    : "No entries found for this filter"}
</div>
) : (
  <div className="past-entry-list">
   {filteredArchivedEntries.map((entry) => (
<button
  key={entry.id}
ref={(el) => {
  mobilePastEntryRefs.current[entry.id] = el;
}}
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

<div className="mobile-profile-wrap" ref={mobileProfileMenuRef}>
  <div className={`profile-menu ${profileMenuOpen ? "profile-menu--open" : ""}`}>
<button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setPastJournalsOpen(true);
  }}
>
  <span className="profile-menu-item-icon" aria-hidden="true">
    <svg viewBox="0 0 512.5 512.5" fill="currentColor">
      <path d="m413.583 393.333c0 11.046-8.954 20-20 20h-78.666c-11.046 0-20-8.954-20-20s8.954-20 20-20h78.666c11.046 0 20 8.955 20 20zm98.667-234.666v273.833c0 44.112-35.888 80-80 80h-352c-44.112 0-80-35.888-80-80v-352.5c0-44.112 35.888-80 80-80h72.48c21.368 0 41.458 8.321 56.568 23.431l55.235 55.235h167.717c44.112.001 80 35.888 80 80.001zm-40 0c0-22.056-17.944-40-40-40h-176c-5.305 0-10.392-2.107-14.143-5.858l-61.093-61.093c-7.554-7.555-17.599-11.716-28.284-11.716h-72.48c-22.056 0-40 17.944-40 40v352.5c0 22.056 17.944 40 40 40h352c22.056 0 40-17.944 40-40z"></path>
    </svg>
  </span>
  <span>My journals</span>
</button>

 <button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    setProfileSettingsOpen(true);
  }}
>
  <span className="profile-menu-item-icon" aria-hidden="true">
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M489.514 296.695l-21.3-17.534c-14.59-12.011-14.564-34.335.001-46.322l21.299-17.534c15.157-12.479 19.034-33.877 9.218-50.882l-42.058-72.846c-9.818-17.004-30.292-24.344-48.674-17.458l-25.835 9.679c-17.696 6.628-37.016-4.551-40.117-23.161l-4.535-27.214c-3.228-19.366-19.821-33.423-39.455-33.423h-84.115c-19.635 0-36.229 14.057-39.456 33.424l-4.536 27.213c-3.107 18.643-22.453 29.778-40.116 23.162l-25.835-9.68c-18.383-6.886-38.855.455-48.674 17.458l-42.057 72.845c-9.817 17.003-5.941 38.402 9.218 50.882l21.299 17.534c14.592 12.012 14.563 34.334 0 46.322l-21.3 17.534c-15.158 12.48-19.035 33.879-9.218 50.882l42.058 72.846c9.818 17.003 30.286 24.344 48.674 17.458l25.834-9.679c17.699-6.631 37.015 4.556 40.116 23.161l4.536 27.212c3.228 19.369 19.822 33.426 39.456 33.426h84.115c19.634 0 36.228-14.057 39.455-33.424l4.535-27.212c3.106-18.638 22.451-29.781 40.117-23.161l25.836 9.678c18.387 6.887 38.856-.454 48.674-17.458l42.059-72.847c9.815-17.003 5.938-38.402-9.219-50.881zm-67.481 103.728l-25.835-9.679c-41.299-15.471-86.37 10.63-93.605 54.043l-4.535 27.213h-84.115l-4.536-27.213c-7.249-43.497-52.386-69.484-93.605-54.043l-25.835 9.679-42.057-72.846 21.299-17.534c34.049-28.03 33.978-80.114 0-108.086l-21.299-17.534 42.058-72.846 25.834 9.679c41.3 15.47 86.37-10.63 93.605-54.043l4.535-27.213h84.115l4.535 27.213c7.25 43.502 52.389 69.481 93.605 54.043l25.835-9.679 42.067 72.836s-.003.003-.011.009l-21.298 17.534c-34.048 28.028-33.98 80.113-.001 108.086l21.3 17.534zm-166.033-243.09c-54.405 0-98.667 44.262-98.667 98.667s44.262 98.667 98.667 98.667 98.667-44.262 98.667-98.667-44.262-98.667-98.667-98.667zm0 157.334c-32.349 0-58.667-26.318-58.667-58.667s26.318-58.667 58.667-58.667 58.667 26.318 58.667 58.667-26.318 58.667-58.667 58.667z" />
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
        <svg viewBox="0 0 512.473 512.473" fill="currentColor">
          <path d="m512.236 276.474v155.999c0 44.112-35.888 80-80 80h-352c-44.112 0-80-35.888-80-80v-155.999c0-44.112 35.888-80 80-80h58c11.046 0 20 8.954 20 20s-8.954 20-20 20h-58c-22.056 0-40 17.944-40 40v155.999c0 22.056 17.944 40 40 40h352c22.056 0 40-17.944 40-40v-155.999c0-22.056-17.944-40-40-40h-58c-11.046 0-20-8.954-20-20s8.954-20 20-20h58c44.113 0 80 35.887 80 80zm-352.875-156.43c71.479-70.82 68.571-70.054 76.645-74.712l.465 328.668c.016 11.036 8.967 19.972 20 19.972h.029c11.046-.016 19.987-8.982 19.972-20.028l-.465-328.607c8.058 4.651 5.064 3.793 77.105 75.175 7.81 7.81 20.473 7.811 28.284 0s7.811-20.474 0-28.284l-68.826-68.824c-31.028-31.028-81.754-31.383-113.137 0l-68.356 68.356c-7.811 7.811-7.811 20.474 0 28.284s20.474 7.811 28.284 0z" />
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
            </div>
          </div>

          <div className="main-inner">
            <div className="main-top">
              <div className="greeting">
                {isReadOnly ? "ARCHIVED ENTRY" : "GOOD EVENING"}
              </div>
<div className="time-left">
  {!isViewingPastEntry && (
    <svg
      className="time-icon"
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m462.623 41.006c-26.442-26.443-61.6-41.006-98.995-41.006h-215.256c-37.396 0-72.553 14.563-98.994 41.005-3.005 4.259-49.378 38.989-49.378 107.367v215.256c0 68.386 46.401 103.149 49.377 107.366 26.442 26.444 61.6 41.006 98.995 41.006h215.256c37.396 0 72.553-14.563 98.994-41.005 3.005-4.259 49.378-38.989 49.378-107.367v-215.256c0-68.386-46.401-103.149-49.377-107.366zm-28.285 401.705c-18.887 18.887-44 29.289-70.71 29.289h-87.596v-27.968c0-11.046-8.954-20-20-20s-20 8.954-20 20v27.968h-87.66c-26.711 0-51.823-10.402-70.711-29.29-3.046-4.235-37.661-28.973-37.661-79.082v-87.628h28c11.046 0 20-8.954 20-20s-8.954-20-20-20h-28v-87.628c0-50.375 34.51-74.701 37.662-79.083 18.887-18.887 43.999-29.289 70.71-29.289h87.66v27.968c0 11.046 8.954 20 20 20s20-8.954 20-20v-27.968h87.596c26.711 0 51.823 10.402 70.711 29.29 3.046 4.235 37.661 28.973 37.661 79.082v87.628h-27.936c-11.046 0-20 8.954-20 20s8.954 20 20 20h27.936v87.628c0 50.375-34.51 74.701-37.662 79.083zm-79.671-186.711c0 11.046-8.954 20-20 20h-78.667c-11.046 0-20-8.954-20-20v-98.667c0-11.046 8.954-20 20-20s20 8.954 20 20v78.667h58.667c11.045 0 20 8.954 20 20z"></path>
    </svg>
  )}

  <span>
    {isReadOnly ? "read only" : `${timeLeft} left today`}
  </span>
</div>
            </div>

            <h2 className="date-heading">
              {isViewingPastEntry ? selectedPastEntry.dateLabel : currentDateLabel}
            </h2>

            <textarea
             className={`writing-area ${isReadOnly ? "writing-area--readonly" : ""}`}
              placeholder="What's on your mind today..."
              value={displayedText}
              onChange={(e) => setText(e.target.value)}
              readOnly={isReadOnly}
              spellCheck={false}
            />

            <div className="bottom-bar">
              <div className="word-count">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </div>

              {isReadOnly ? (
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
  viewBox="0 0 512 512"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="m478.329 96.045-62.374-62.374c-21.713-21.713-50.581-33.671-81.288-33.671h-214.579c-66.273 0-120.088 53.76-120.088 120.088v271.824c0 66.273 53.76 120.088 120.088 120.088h271.824c66.273 0 120.088-53.76 120.088-120.088v-214.579c0-30.707-11.958-59.575-33.671-81.288zm-280.996-56.045h117.333v77.333c0 11.028-8.972 20-20 20h-77.333c-11.028 0-20-8.972-20-20zm274.667 351.912c0 44.187-35.869 80.088-80.088 80.088h-271.824c-44.187 0-80.088-35.869-80.088-80.088v-271.824c0-44.187 35.869-80.088 80.088-80.088h37.246v77.333c0 33.084 26.916 60 60 60h77.333c33.084 0 60-26.916 60-60v-74.65c12.362 3.4 23.692 9.96 33.004 19.272l62.374 62.374c14.158 14.158 21.955 32.982 21.955 53.004zm-78-17.245c0 11.046-8.954 20-20 20h-236c-11.046 0-20-8.954-20-20s8.954-20 20-20h236c11.046 0 20 8.954 20 20zm0-98.667c0 11.046-8.954 20-20 20h-236c-11.046 0-20-8.954-20-20s8.954-20 20-20h236c11.046 0 20 8.954 20 20z"></path>
</svg>
)}
<span>{savingEntry ? "Saving..." : buttonLabel}</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
{renameJournalOpen && (
  <>
    <button
      type="button"
      className="modal-backdrop"
      aria-label="Close rename journal modal"
      onClick={() => {
        setRenameJournalOpen(false);
        setRenameJournalValue(currentJournalName);
      }}
    />

    <div
      className="rename-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-journal-title"
    >
      <button
        type="button"
        className="rename-modal-close"
        aria-label="Close rename journal modal"
        onClick={() => {
          setRenameJournalOpen(false);
          setRenameJournalValue(currentJournalName);
        }}
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="rename-modal-title" id="rename-journal-title">
        Change journal name
      </div>

      <input
        className="rename-modal-input auth-input"
        type="text"
        value={renameJournalValue}
        onChange={(e) => setRenameJournalValue(e.target.value)}
        placeholder="New journal name"
        maxLength={40}
        autoFocus
      />
      <div className="auth-char-count">
  {renameJournalValue.length}/40
</div>

      <div className="rename-modal-actions">
        <button
          type="button"
          className="rename-modal-button auth-button"
          onClick={handleRenameJournal}
          disabled={!renameJournalIsValid || updatingJournalName}
        >
          {updatingJournalName ? (
            <span className="auth-button-spinner" aria-hidden="true" />
          ) : (
            "Update"
          )}
        </button>
      </div>
    </div>
  </>
)}


{calendarOpen && (
  <>
    <button
      type="button"
      className="modal-backdrop"
      aria-label="Close calendar"
      onClick={() => setCalendarOpen(false)}
    />

    <div
      className="calendar-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
    >
      <button
        type="button"
        className="calendar-modal-close"
        aria-label="Close calendar"
        onClick={() => setCalendarOpen(false)}
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

  <div className="calendar-modal-header">
  <div className="calendar-modal-title" id="calendar-modal-title">
    {currentJournalName}
  </div>

  <div className="calendar-modal-year">
    {activeJournalYear}
  </div>

  <select
    className="calendar-month-select"
    value={selectedContributionMonth}
    onChange={(event) => {
      setSelectedContributionMonth(Number(event.target.value));
      setHoveredContributionDayKey(null);
    }}
    aria-label="Choose month"
  >
    {contributionMonths.map((month, index) => (
      <option value={index} key={month.key}>
        {month.title}
      </option>
    ))}
  </select>
</div>

<div
  className="contribution-calendar"
  aria-label={`${activeJournalYear} entry activity`}
>
  {selectedContributionMonthData && (
    <div className="contribution-month-panel">
      <div
        className="contribution-days"
        style={{
          gridTemplateColumns: `repeat(${selectedContributionMonthData.columnCount}, 14px)`,
        }}
      >
        {selectedContributionMonthData.days.map((day, cellIndex) => {
          if (!day) {
            return (
              <span
                className="contribution-day contribution-day--outside"
                key={`${selectedContributionMonthData.key}-${cellIndex}`}
                aria-hidden="true"
              />
            );
          }

          const matchingEntry = calendarEntryMap.get(day.dayKey);
          const dateLabel = formatContributionDate(day.date);
          const popoverIsVisible = hoveredContributionDayKey === day.dayKey;

          if (!matchingEntry) {
            return (
              <span
                className="contribution-day"
                key={day.dayKey}
                onMouseEnter={() => setHoveredContributionDayKey(day.dayKey)}
                onMouseLeave={() => setHoveredContributionDayKey(null)}
              >
                {popoverIsVisible && (
                  <span className="contribution-popover">
                    {dateLabel}
                  </span>
                )}
              </span>
            );
          }

          return (
            <button
              type="button"
              key={day.dayKey}
              className="contribution-day contribution-day--entry"
              aria-label={`Open entry from ${dateLabel}`}
              onMouseEnter={() => setHoveredContributionDayKey(day.dayKey)}
              onMouseLeave={() => setHoveredContributionDayKey(null)}
              onClick={() => {
                setSelectedPastMonth(null);
                setSelectedPastDay(null);
                setSelectedPastFilter("Most Recent");
                setPastMonthMenuOpen(false);
                setPastDayMenuOpen(false);
                setPastFilterMenuOpen(false);
                setHoveredContributionDayKey(null);

                if (matchingEntry.dateKey === currentDayKey) {
                  goToToday();
                } else {
                  setSelectedPastEntryId(matchingEntry.id);
                }
              }}
            >
              {popoverIsVisible && (
                <span className="contribution-popover">
                  {dateLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  )}

  <div className="contribution-footer">
    <div>
      {selectedContributionEntryCount}{" "}
      {selectedContributionEntryCount === 1 ? "entry" : "entries"}
    </div>
    <div className="contribution-legend" aria-hidden="true">
      <span>Empty</span>
      <span className="contribution-legend-square" />
      <span>Completed</span>
      <span className="contribution-legend-square contribution-legend-square--filled" />
    </div>
  </div>
</div>
    </div>
  </>
)}

{profileSettingsOpen && (
  <>
    <button
      type="button"
      className="modal-backdrop"
      aria-label="Close profile settings modal"
      onClick={handleCloseProfileSettings}
    />

    <div
      className="profile-settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
    >
      <button
        type="button"
        className="profile-settings-modal-close"
        aria-label="Close profile settings modal"
        onClick={handleCloseProfileSettings}
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="profile-settings-modal-title" id="profile-settings-title">
        Profile Settings
      </div>

      <div className="profile-settings-card">
        <div className="profile-settings-user">
          <div className="profile-settings-avatar" aria-hidden="true">
            {(fullName || "U").charAt(0).toUpperCase()}
          </div>

          <div className="profile-settings-user-text">
            <div className="profile-settings-name">{fullName || "User"}</div>
            <div className="profile-settings-email">
              {accountEmail || "No email found"}
            </div>
          </div>
        </div>
      </div>
<div className="profile-settings-section">
  <div className="profile-settings-section-label">Account Actions</div>

{!showPasswordFields ? (
  <div className="profile-settings-actions">
    <button
      type="button"
      className="auth-button rename-modal-button"
      onClick={handleOpenPasswordFields}
    >
      {hasPassword ? "Reset password" : "Create password"}
    </button>
  </div>
) : (
    <div className="profile-settings-password-block">
      <input
        type="password"
        className="rename-modal-input auth-input"
        placeholder="New password"
        value={newPassword}
    onChange={(e) => {
  setNewPassword(e.target.value);
  if (passwordError) setPasswordError("");
  if (passwordSuccess) setPasswordSuccess("");
}}
      />

<input
  type="password"
  className="rename-modal-input auth-input"
  placeholder="Confirm new password"
  value={confirmPassword}
  onChange={(e) => {
    setConfirmPassword(e.target.value);
    if (passwordError) setPasswordError("");
    if (passwordSuccess) setPasswordSuccess("");
  }}
/>

  <div
  className="rename-error profile-settings-password-error"
  style={{ opacity: passwordError ? 1 : 0 }}
>
  {passwordError || "placeholder"}
</div>

<div
  className="rename-success profile-settings-password-success"
  style={{ opacity: passwordSuccess ? 1 : 0 }}
>
  {passwordSuccess || "placeholder"}
</div>

      <div className="profile-settings-actions">
        <button
          type="button"
          className="rename-modal-button auth-button"
          onClick={handleUpdatePassword}
          disabled={
            updatingPassword || !newPassword.trim() || !confirmPassword.trim()
          }
        >
          {updatingPassword ? (
            <span className="auth-button-spinner" aria-hidden="true" />
          ) : (
            "Update"
          )}
        </button>
      </div>
    </div>
  )}
</div>
    </div>
  </>
)}

{pastJournalsOpen && (
  <>
    <button
      type="button"
      className="modal-backdrop"
      aria-label="Close past journals modal"
      onClick={handleClosePastJournals}
    />

    <div
      className="past-journals-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-journals-title"
    >
      <button
        type="button"
        className="past-journals-modal-close"
        aria-label="Close past journals modal"
        onClick={handleClosePastJournals}
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="past-journals-modal-title" id="past-journals-title">
        {fullName ? `${fullName}'s Journals` : "My Journals"}
      </div>

{journals.length === 0 ? (
  <div className="past-journals-empty">
    No journals yet
  </div>
) : (
  <div className="past-journals-list">
    {journals.map((journal) => {
      const isCurrent = journal.id === currentJournalId;
      const isActive = journal.id === activeJournalId;

      return (
<button
  key={journal.id}
  type="button"
  className={`past-journals-item ${
    isActive ? "past-journals-item--active" : ""
  }`}
  onClick={() => handleOpenJournal(journal.id)}
>
  <div className="past-journals-item-left">
    <span className="past-journals-icon" aria-hidden="true">
      <svg
        viewBox="0 0 296.999 296.999"
        fill="currentColor"
      >
        <path d="M45.432,35.049c-2.809,0-5.451,1.095-7.446,3.085c-2.017,2.012-3.128,4.691-3.128,7.543v159.365c0,5.844,4.773,10.61,10.641,10.625c24.738,0.059,66.184,5.215,94.776,35.136V84.023c0-1.981-0.506-3.842-1.461-5.382C115.322,40.849,70.226,35.107,45.432,35.049z"/>
        <path d="M262.167,205.042V45.676c0-2.852-1.111-5.531-3.128-7.543c-1.995-1.99-4.639-3.085-7.445-3.085c-24.793,0.059-69.889,5.801-93.357,43.593c-0.955,1.54-1.46,3.401-1.46,5.382v166.779c28.592-29.921,70.038-35.077,94.776-35.136C257.394,215.651,262.167,210.885,262.167,205.042z"/>
        <path d="M286.373,71.801h-7.706v133.241c0,14.921-12.157,27.088-27.101,27.125c-20.983,0.05-55.581,4.153-80.084,27.344c42.378-10.376,87.052-3.631,112.512,2.171c3.179,0.724,6.464-0.024,9.011-2.054c2.538-2.025,3.994-5.052,3.994-8.301V82.427C297,76.568,292.232,71.801,286.373,71.801z"/>
        <path d="M18.332,205.042V71.801h-7.706C4.768,71.801,0,76.568,0,82.427v168.897c0,3.25,1.456,6.276,3.994,8.301c2.545,2.029,5.827,2.78,9.011,2.054c25.46-5.803,70.135-12.547,112.511-2.171c-24.502-23.19-59.1-27.292-80.083-27.342C30.49,232.13,18.332,219.963,18.332,205.042z"/>
      </svg>
    </span>

    <div className="past-journals-item-text">
      <div className="past-journals-item-name">{journal.name}</div>
      <div className="past-journals-item-year">
        {journal.year}
        {isCurrent ? " (current year)" : ""}
      </div>
    </div>
  </div>
</button>
      );
    })}
  </div>
)}
    </div>
  </>
)}
    </main>
  );
}

export default App;
