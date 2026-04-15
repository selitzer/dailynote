import "./index.css";

function App() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="app">
      <section className="journal-shell">
        <p className="journal-date">{today}</p>
        <h1 className="journal-title">Today’s Entry</h1>
        <p className="journal-subtitle">
          A small reflection is enough. You do not need to write a lot.
        </p>

        <textarea
          className="journal-input"
          placeholder="Write about your day..."
        />

        <button className="save-button">Save Entry</button>
      </section>
    </main>
  );
}

export default App;