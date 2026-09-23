import { useCallback, useEffect, useState } from "react";
import { today, monthKey } from "./lib/dates.js";
import { STATE_KEY, loadState, logKey, readJSON, writeJSON } from "./lib/storage.js";
import { LiftsScreen } from "./screens/LiftsScreen.jsx";
import { ProgressScreen } from "./screens/ProgressScreen.jsx";
import { TodayScreen } from "./screens/TodayScreen.jsx";
import { WeekScreen } from "./screens/WeekScreen.jsx";
import { colors, fonts } from "./theme.js";

const TABS = [
  ["today", "Today"],
  ["week", "Week"],
  ["progress", "Progress"],
  ["lifts", "Lifts"],
];

export function App() {
  const [tab, setTab] = useState("today");
  const [date, setDate] = useState(today);
  const [{ state: initialState, warning }] = useState(loadState);
  const [state, setState] = useState(initialState);
  // Day logs by month ("YYYY-MM"), loaded from storage as months are visited.
  const [logs, setLogs] = useState({});

  const month = monthKey(date);
  useEffect(() => {
    if (!logs[month]) setLogs((prev) => ({ ...prev, [month]: readJSON(logKey(month)) || {} }));
  }, [month, logs]);

  // Every change is written straight to localStorage.
  const save = useCallback((next) => {
    setState(next);
    writeJSON(STATE_KEY, next);
  }, []);

  const dayLog = (logs[month] || {})[date] || {};
  const setDayLog = (nextDayLog) => {
    const monthLog = { ...(logs[month] || {}), [date]: nextDayLog };
    setLogs((prev) => ({ ...prev, [month]: monthLog }));
    writeJSON(logKey(month), monthLog);
  };

  return (
    <div
      style={{
        background: colors.bg,
        minHeight: "100vh",
        fontFamily: fonts.sans,
        color: colors.cream,
        paddingTop: "calc(env(safe-area-inset-top) + 6px)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {warning && (
        <div
          style={{
            background: "rgba(201,162,39,.14)",
            borderBottom: `1px solid ${colors.amber}`,
            color: colors.amber,
            fontSize: 12,
            padding: "10px 14px",
            lineHeight: 1.5,
          }}
        >
          {warning}
        </div>
      )}
      {tab === "today" && (
        <TodayScreen
          date={date}
          setDate={setDate}
          state={state}
          save={save}
          dayLog={dayLog}
          setDayLog={setDayLog}
        />
      )}
      {tab === "week" && <WeekScreen date={date} state={state} save={save} />}
      {tab === "progress" && <ProgressScreen state={state} save={save} logs={logs} date={date} />}
      {tab === "lifts" && <LiftsScreen state={state} save={save} />}

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(15,21,18,.96)",
          borderTop: `1px solid ${colors.line}`,
          display: "flex",
          maxWidth: 520,
          margin: "0 auto",
          backdropFilter: "blur(8px)",
        }}
      >
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "13px 0 calc(20px + env(safe-area-inset-bottom))",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: tab === key ? colors.grass : colors.faint,
              fontSize: 12,
              fontFamily: fonts.mono,
              letterSpacing: 0.6,
              borderTop: `2px solid ${tab === key ? colors.grass : "transparent"}`,
              marginTop: -1,
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
