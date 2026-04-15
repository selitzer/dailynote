import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const journalName = "My Journal";
  const userName = "DANIEL";

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const formatted = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      setTimeLeft(formatted);
    };

    updateTimer(); // run immediately

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-left">{today}</div>
        <div className="topbar-center">{journalName}</div>
        <div className="topbar-right">{userName}</div>
      </header>

      <section className="editor-shell">
        <div className="editor-meta">
          <div className="editor-meta-left">
            <p className="editor-subinfo">LAST UPDATED: --</p>
          </div>

          <div className="editor-meta-right">
            <div className="deadline-row">
              <span className="editor-subinfo">END OF DAY:</span>
              <span className="deadline-badge">{timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="editor-body">
          <textarea
            className="journal-editor"
            placeholder="Start writing..."
          />
        </div>
      </section>
    </main>
  );
}

export default App;