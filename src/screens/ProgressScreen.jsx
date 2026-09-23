import { useMemo, useState } from "react";
import { Card, Label, MuscleVolumeList, primaryButton, secondaryButton } from "../components/ui.jsx";
import {
  DAY_KEYS,
  DAY_NAMES,
  LIFTS,
  LIFTS_BY_ID,
  LIFT_DAYS,
  MAX_TEST_LIFTS,
  unitLabel,
} from "../data/program.js";
import { daysBetween, monthKey, parseDate, shiftDateStr, shortDate } from "../lib/dates.js";
import { LEGACY_IDS, liftForLoggedId, liftName } from "../lib/migrate.js";
import { setsByMuscle } from "../lib/volume.js";
import { colors, fonts } from "../theme.js";

const MAX_TEST_INTERVAL_DAYS = 120;
const STALL_WEEKS = 4;

// The number tracked for a lift over time: weight for weighted lifts, else reps.
const metric = (lift) => (lift.mode === "weight" ? "w" : "r");

const loggedSetCount = (sets) => sets.filter((s) => s && s.ok !== null).length;

// Chart picker groups: each lift listed once, under the first day it's on.
const CHART_GROUPS = DAY_KEYS.map((key) => [key, LIFTS.filter((l) => LIFT_DAYS[l.id][0] === key)]);

export function ProgressScreen({ state, save, logs, date }) {
  const [chartLiftId, setChartLiftId] = useState(MAX_TEST_LIFTS[0] ? MAX_TEST_LIFTS[0].id : LIFTS[0].id);
  const [loggingTest, setLoggingTest] = useState(false);

  // Sets actually logged over the 7 days ending on `date`, by muscle.
  // Only months already loaded into `logs` are counted.
  const rollingVolume = useMemo(() => {
    const entries = [];
    for (let back = 0; back < 7; back++) {
      const ds = shiftDateStr(date, -back);
      const dayLog = (logs[monthKey(ds)] || {})[ds] || {};
      for (const [liftId, sets] of Object.entries(dayLog)) {
        const lift = liftForLoggedId(liftId);
        if (!lift) continue;
        const n = loggedSetCount(sets);
        if (n) entries.push({ lift, sets: n });
      }
    }
    return setsByMuscle(entries);
  }, [logs, date]);

  // Lifts whose tracked number hasn't moved in STALL_WEEKS+ (needs 3+ sessions).
  const stalled = useMemo(
    () =>
      LIFTS.map((lift) => {
        const hist = state.prog[lift.id].hist || [];
        if (hist.length < 3) return null;
        const latest = hist[hist.length - 1];
        const key = metric(lift);
        let since = null;
        for (let i = hist.length - 1; i >= 0 && hist[i][key] === latest[key]; i--) since = hist[i].d;
        const weeks = since ? Math.floor(daysBetween(since, latest.d) / 7) : 0;
        return weeks >= STALL_WEEKS ? { lift, weeks, value: latest[key] } : null;
      })
        .filter(Boolean)
        .sort((a, b) => b.weeks - a.weeks),
    [state.prog],
  );

  const chartPoints = useMemo(() => {
    const lift = LIFTS_BY_ID[chartLiftId];
    return (state.prog[chartLiftId].hist || []).map((h) => ({ d: h.d, v: h[metric(lift)] }));
  }, [chartLiftId, state.prog]);

  // Sets logged per day of the current month, for the heatmap.
  const month = useMemo(() => {
    const mk = monthKey(date);
    const first = parseDate(mk + "-01");
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return {
      lead: (first.getDay() + 6) % 7, // blank cells before the 1st, Monday-first grid
      cells: Array.from({ length: daysInMonth }, (_, i) => {
        const ds = `${mk}-${String(i + 1).padStart(2, "0")}`;
        const dayLog = (logs[mk] || {})[ds] || {};
        const n = Object.entries(dayLog)
          .filter(([liftId]) => !LEGACY_IDS[liftId]) // counted under the current id
          .reduce((sum, [, sets]) => sum + loggedSetCount(sets), 0);
        return { ds, n, num: i + 1 };
      }),
    };
  }, [logs, date]);

  // Lifts whose tracked number rose (or didn't) over the last 30 days.
  const last30 = useMemo(() => {
    const since = shiftDateStr(date, -30);
    const up = [];
    const flat = [];
    for (const lift of LIFTS) {
      const recent = (state.prog[lift.id].hist || []).filter((h) => h.d >= since);
      if (recent.length < 2) continue;
      const key = metric(lift);
      const delta = recent[recent.length - 1][key] - recent[0][key];
      if (delta > 0) up.push({ lift, delta, pct: delta / (recent[0][key] || 1) });
      else flat.push({ lift });
    }
    up.sort((a, b) => b.pct - a.pct);
    return { up, flat };
  }, [state.prog, date]);

  const lastTest = state.tests.length ? state.tests[state.tests.length - 1] : null;
  const testDue = !lastTest || daysBetween(lastTest.d, date) >= MAX_TEST_INTERVAL_DAYS;

  const section = { padding: "0 2px" };
  const row = { display: "flex", justifyContent: "space-between" };

  return (
    <div style={{ padding: "18px 12px 12px" }}>
      <Label style={section}>Rolling 7 days</Label>
      <Card style={{ padding: "12px 14px", margin: "9px 0 20px" }}>
        <MuscleVolumeList volume={rollingVolume} />
      </Card>

      <Label style={section}>Load over time</Label>
      <Card style={{ padding: "12px 10px 6px", margin: "9px 0 20px" }}>
        <select
          value={chartLiftId}
          onChange={(e) => setChartLiftId(e.target.value)}
          style={{
            width: "100%",
            background: colors.surf2,
            color: colors.cream,
            border: `1px solid ${colors.line}`,
            borderRadius: 7,
            padding: "8px 10px",
            fontSize: 13,
            marginBottom: 8,
            fontFamily: fonts.sans,
          }}
        >
          {CHART_GROUPS.map(([key, lifts]) => (
            <optgroup key={key} label={DAY_NAMES[key]}>
              {lifts.map((lift) => (
                <option key={lift.id} value={lift.id}>
                  {lift.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <LineChart points={chartPoints} unit={unitLabel(LIFTS_BY_ID[chartLiftId])} />
      </Card>

      <Label style={section}>Stalled · no movement in 4+ weeks</Label>
      <Card style={{ padding: "6px 0", margin: "9px 0 20px" }}>
        {stalled.length === 0 ? (
          <div style={{ padding: "16px 14px", color: colors.faint, fontSize: 12 }}>Nothing stalled.</div>
        ) : (
          stalled.slice(0, 12).map(({ lift, weeks, value }) => (
            <div key={lift.id} style={{ ...row, padding: "9px 14px", fontSize: 13 }}>
              <span style={{ color: colors.cream }}>
                {lift.name}
                <span style={{ color: colors.faint, fontSize: 11 }}> · {LIFT_DAYS[lift.id].join("/")}</span>
              </span>
              <span style={{ fontFamily: fonts.mono, color: colors.amber, fontSize: 12 }}>
                {value} · {weeks}w
              </span>
            </div>
          ))
        )}
        {stalled.length > 6 && (
          <div
            style={{
              padding: "10px 14px",
              borderTop: `1px solid ${colors.line}`,
              fontSize: 12,
              color: colors.amber,
              lineHeight: 1.5,
            }}
          >
            {stalled.length} lifts stalled. That's the fatigue signal — worth an easy week.
          </div>
        )}
      </Card>

      <Label style={section}>
        {parseDate(date).toLocaleDateString(undefined, { month: "long" })} · volume
      </Label>
      <Card style={{ padding: 14, margin: "9px 0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div
              key={i}
              style={{ textAlign: "center", fontFamily: fonts.mono, fontSize: 9, color: colors.faint }}
            >
              {d}
            </div>
          ))}
          {Array.from({ length: month.lead }, (_, i) => (
            <div key={"l" + i} />
          ))}
          {month.cells.map((cell) => (
            <div
              key={cell.ds}
              style={{
                aspectRatio: "1",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 9,
                background:
                  cell.n === 0 ? colors.surf2 : `rgba(168,198,134,${Math.min(0.85, 0.15 + cell.n / 55)})`,
                color: cell.n === 0 ? colors.faint : colors.onGrass,
              }}
            >
              {cell.num}
            </div>
          ))}
        </div>
      </Card>

      <Label style={section}>Last 30 days</Label>
      <Card style={{ padding: "13px 14px", margin: "9px 0 20px" }}>
        <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.grass, marginBottom: 8 }}>
          {last30.up.length} moved up · {last30.flat.length} flat
        </div>
        {last30.up.slice(0, 6).map(({ lift, delta }) => (
          <div key={lift.id} style={{ ...row, fontSize: 13, padding: "4px 0" }}>
            <span style={{ color: colors.cream }}>{lift.name}</span>
            <span style={{ fontFamily: fonts.mono, color: colors.grass, fontSize: 12 }}>
              +{delta}
              {unitLabel(lift)}
            </span>
          </div>
        ))}
        {last30.up.length === 0 && (
          <div style={{ color: colors.faint, fontSize: 12 }}>No increases logged yet.</div>
        )}
      </Card>

      <Label style={section}>Max test {testDue && <span style={{ color: colors.amber }}>· due</span>}</Label>
      <Card style={{ padding: "13px 14px", margin: "9px 0 20px" }}>
        <div style={{ fontSize: 12, color: colors.dim, marginBottom: 10, lineHeight: 1.5 }}>
          Every four months: {MAX_TEST_LIFTS.map((l) => l.name).join(", ")}.
          {lastTest && <span> Last: {shortDate(lastTest.d)}.</span>}
        </div>
        {loggingTest ? (
          <MaxTestForm
            date={date}
            onSave={(test) => {
              save({ ...state, tests: [...state.tests, test] });
              setLoggingTest(false);
            }}
            onCancel={() => setLoggingTest(false)}
          />
        ) : (
          <button
            onClick={() => setLoggingTest(true)}
            style={{
              ...secondaryButton,
              width: "100%",
              padding: "9px 0",
              background: colors.surf2,
              color: colors.cream,
            }}
          >
            Log a test
          </button>
        )}
        {state.tests
          .slice()
          .reverse()
          .slice(0, 3)
          .map((test, i) => (
            <div key={i} style={{ marginTop: 11, paddingTop: 10, borderTop: `1px solid ${colors.line}` }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.faint, marginBottom: 5 }}>
                {shortDate(test.d)}
                {test.bw ? ` · ${test.bw} lb bw` : ""}
              </div>
              {Object.entries(test.vals)
                .filter(([, v]) => v)
                .map(([liftId, v]) => (
                  <div key={liftId} style={{ ...row, fontSize: 12, padding: "2px 0" }}>
                    <span style={{ color: colors.cream }}>{liftName(liftId)}</span>
                    <span style={{ fontFamily: fonts.mono, color: colors.grass }}>{v}</span>
                  </div>
                ))}
            </div>
          ))}
      </Card>
    </div>
  );
}

function LineChart({ points, unit }) {
  if (points.length < 2) {
    return (
      <div style={{ padding: "36px 0", textAlign: "center", color: colors.faint, fontSize: 12 }}>
        Need at least two sessions.
      </div>
    );
  }
  const W = 320;
  const H = 130;
  const pad = 24;
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={colors.line} strokeWidth="1" />
      <path
        d={path}
        fill="none"
        stroke={colors.grass}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r="2.6" fill={colors.grass} />
      ))}
      <text x={pad} y={14} fill={colors.dim} fontSize="10" fontFamily={fonts.mono}>
        {max}
        {unit}
      </text>
      <text x={pad} y={H - 6} fill={colors.dim} fontSize="10" fontFamily={fonts.mono}>
        {min}
        {unit}
      </text>
      <text x={W - pad} y={H - 6} fill={colors.faint} fontSize="9" fontFamily={fonts.mono} textAnchor="end">
        {shortDate(points[points.length - 1].d)}
      </text>
    </svg>
  );
}

function MaxTestForm({ date, onSave, onCancel }) {
  const [vals, setVals] = useState({});
  const [bodyweight, setBodyweight] = useState("");
  const input = {
    width: 78,
    background: colors.surf2,
    border: `1px solid ${colors.line}`,
    borderRadius: 6,
    color: colors.cream,
    padding: "6px 8px",
    fontFamily: fonts.mono,
    fontSize: 13,
    textAlign: "right",
  };
  const row = { display: "flex", justifyContent: "space-between", alignItems: "center" };
  return (
    <div>
      {MAX_TEST_LIFTS.map((lift) => (
        <div key={lift.id} style={{ ...row, marginBottom: 7 }}>
          <span style={{ fontSize: 13, color: colors.cream }}>
            {lift.name}
            <span style={{ color: colors.faint, fontSize: 11 }}>
              {lift.mode === "weight" ? " · 1RM lb" : " · max reps"}
            </span>
          </span>
          <input
            inputMode="numeric"
            style={input}
            value={vals[lift.id] || ""}
            onChange={(e) => setVals({ ...vals, [lift.id]: e.target.value })}
          />
        </div>
      ))}
      <div style={{ ...row, marginBottom: 11 }}>
        <span style={{ fontSize: 13, color: colors.cream }}>
          Bodyweight
          <span style={{ color: colors.faint, fontSize: 11 }}> · for the chin-up number</span>
        </span>
        <input
          inputMode="numeric"
          style={input}
          value={bodyweight}
          onChange={(e) => setBodyweight(e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onSave({ d: date, vals, bw: bodyweight })}
          style={{ ...primaryButton, flex: 1, padding: "9px 0" }}
        >
          Save test
        </button>
        <button onClick={onCancel} style={{ ...secondaryButton, padding: "9px 14px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
