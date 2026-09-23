import { useEffect, useState } from "react";
import {
  Card,
  Label,
  MuscleVolumeList,
  PrevNext,
  primaryButton,
  secondaryButton,
} from "../components/ui.jsx";
import { DAY_KEYS, DAY_NAMES } from "../data/program.js";
import {
  addDays,
  parseDate,
  shiftDateStr,
  shortDate,
  toDateStr,
  today,
  weekdayKey,
  weekPosition,
} from "../lib/dates.js";
import {
  DEFAULT_ASSIGNMENT,
  WEEKDAY_INDEXES,
  buildSession,
  defaultSplitPicks,
  getAssignment,
  getSplits,
  shiftAssignment,
  splitHalfNames,
  splitSide,
  usedWeekdays,
} from "../lib/schedule.js";
import { programForWeek, toggleFlip, weekVariant } from "../lib/rotation.js";
import { setsByMuscle, sortLifts, totalSets } from "../lib/volume.js";
import { colors, fonts } from "../theme.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function WeekScreen({ date, state, save }) {
  const [weekStart, setWeekStart] = useState(() => weekPosition(date).start);
  useEffect(() => {
    setWeekStart(weekPosition(date).start);
  }, [date]);

  const savedPlan = state.plans[weekStart];
  const [editing, setEditing] = useState(false);
  // Draft plan being edited; mirrors the saved plan whenever not editing.
  const [assign, setAssign] = useState(() => ({ ...getAssignment(weekStart, state.plans) }));
  const [splits, setSplits] = useState(() => getSplits(weekStart, state.plans));

  useEffect(() => {
    setAssign({ ...getAssignment(weekStart, state.plans) });
    setSplits(getSplits(weekStart, state.plans));
    setEditing(false);
  }, [weekStart]);
  useEffect(() => {
    if (!editing) {
      setAssign({ ...getAssignment(weekStart, state.plans) });
      setSplits(getSplits(weekStart, state.plans));
    }
  }, [state.plans, editing, weekStart]);

  const weekday = (index) => {
    const d = addDays(parseDate(weekStart), index);
    const key = weekdayKey(d);
    return {
      short: key.slice(0, 2),
      num: d.getDate(),
      full: `${DAY_NAMES[key]} ${d.getDate()}`,
      ds: toDateStr(d),
    };
  };

  const variant = weekVariant(weekStart, state.ab);
  const program = programForWeek(weekStart, state.ab);
  const flipWeek = () => save({ ...state, ab: toggleFlip(state.ab, weekStart) });

  const sessions = WEEKDAY_INDEXES.map((i) => buildSession(program, assign, splits, i));
  const volume = setsByMuscle(sessions.flatMap((s) => s.lifts.map((lift) => ({ lift, sets: lift.sets }))));
  const weekSets = sessions.reduce((sum, s) => sum + totalSets(s.lifts), 0);
  const sessionCount = sessions.filter((s) => s.lifts.length).length;
  const isThisWeek = weekStart === weekPosition(today()).start;
  const dirty =
    !same(assign, getAssignment(weekStart, state.plans)) || !same(splits, getSplits(weekStart, state.plans));
  const firstDay = Math.min(...usedWeekdays(assign, splits));
  const canReset = !same(assign, DEFAULT_ASSIGNMENT) || !!savedPlan || Object.keys(splits).length > 0;

  const reset = () => {
    setAssign({ ...DEFAULT_ASSIGNMENT });
    setSplits({});
    if (savedPlan) {
      const plans = { ...state.plans };
      delete plans[weekStart];
      save({ ...state, plans });
    }
  };

  // Slide the whole week so it starts on `index`, if everything still fits.
  const startOn = (index) => {
    const delta = index - firstDay;
    const shifted = shiftAssignment(assign, delta);
    const splitsFit = Object.values(splits).every((sp) =>
      sp.to.every((t) => t + delta >= 0 && t + delta <= 6),
    );
    if (shifted !== assign && splitsFit) {
      setAssign(shifted);
      setSplits(
        Object.fromEntries(
          Object.entries(splits).map(([k, sp]) => [k, { ...sp, to: sp.to.map((t) => t + delta) }]),
        ),
      );
    }
  };

  const commit = () => {
    if (dirty) {
      const plan = Object.keys(splits).length ? { assign, split: splits } : { assign };
      save({ ...state, plans: { ...state.plans, [weekStart]: plan } });
    }
    setEditing(false);
  };

  const startDayButton = (index, label) => {
    const selected = firstDay === index;
    return (
      <button
        key={index}
        onClick={() => startOn(index)}
        style={{
          flex: 1,
          padding: "8px 0",
          borderRadius: 6,
          fontSize: 13,
          fontFamily: fonts.sans,
          cursor: "pointer",
          border: `1px solid ${selected ? colors.grass : colors.line}`,
          background: selected ? "rgba(168,198,134,.15)" : "transparent",
          color: selected ? colors.grass : colors.dim,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ padding: "18px 12px 12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
          padding: "0 2px",
        }}
      >
        <div>
          <Label>
            {isThisWeek ? "This week" : "Week"} · Week {variant}
          </Label>
          <div style={{ fontSize: 20, color: colors.cream, fontWeight: 600, marginTop: 4 }}>
            {shortDate(weekStart)} – {shortDate(shiftDateStr(weekStart, 6))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <PrevNext onStep={(dir) => setWeekStart(shiftDateStr(weekStart, dir * 7))} />
          <button
            onClick={() => (editing ? commit() : setEditing(true))}
            style={{
              padding: "0 13px",
              height: 32,
              borderRadius: 7,
              border: `1px solid ${editing ? colors.grass : colors.line}`,
              background: editing ? "rgba(168,198,134,.12)" : colors.surf,
              color: editing ? colors.grass : colors.dim,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: fonts.sans,
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.faint,
          padding: "0 2px",
          marginBottom: 14,
        }}
      >
        <span>
          {sessionCount} sessions · {weekSets} sets
        </span>
        <button
          onClick={flipWeek}
          style={{
            padding: "3px 10px",
            borderRadius: 5,
            fontSize: 11,
            fontFamily: fonts.sans,
            cursor: "pointer",
            border: `1px solid ${colors.line}`,
            background: "transparent",
            color: colors.dim,
          }}
        >
          Make this week {variant === "A" ? "B" : "A"}
        </button>
      </div>

      {editing && (
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <Label style={{ marginBottom: 7 }}>Start day</Label>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {startDayButton(0, "Sunday")}
            {startDayButton(1, "Monday")}
          </div>
          <Label style={{ marginBottom: 9 }}>Sessions</Label>
          {DAY_KEYS.map((dayKey, i) => (
            <DayPlanRow
              key={dayKey}
              dayKey={dayKey}
              position={i}
              assign={assign}
              setAssign={setAssign}
              splits={splits}
              setSplits={setSplits}
              weekday={weekday}
              program={program}
            />
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              onClick={commit}
              style={{
                ...primaryButton,
                flex: 1,
                padding: "10px 0",
                background: dirty ? colors.grass : colors.surf2,
                color: dirty ? colors.onGrass : colors.dim,
              }}
            >
              Save · {sessionCount} sessions
            </button>
            <button
              disabled={!canReset}
              onClick={reset}
              style={{
                ...secondaryButton,
                padding: "10px 14px",
                cursor: canReset ? "pointer" : "default",
                opacity: canReset ? 1 : 0.35,
              }}
            >
              Reset
            </button>
          </div>
        </Card>
      )}

      {sessions.map((session) => {
        const day = weekday(session.i);
        const rest = session.sources.length === 0;
        return (
          <Card
            key={session.i}
            style={{
              padding: "13px 14px",
              marginBottom: 9,
              borderColor: day.ds === date ? colors.forest : colors.line,
              opacity: rest ? 0.55 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 15, color: colors.cream, fontWeight: 500 }}>{day.full}</div>
              <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.dim }}>
                {rest ? "—" : `${session.lifts.length} lifts · ${totalSets(session.lifts)} sets`}
              </div>
            </div>
            <div style={{ fontSize: 12, color: rest ? colors.faint : colors.grassDim, marginTop: 4 }}>
              {rest ? "Rest" : session.labels.join(" + ")}
            </div>
            {session.cut.length > 0 && (
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.sky,
                  marginTop: 5,
                  lineHeight: 1.6,
                }}
              >
                Dropped: {session.cut.map((l) => l.name).join(", ")}
              </div>
            )}
            {session.shaved.length > 0 && (
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.skyDim,
                  marginTop: 3,
                  lineHeight: 1.6,
                }}
              >
                Shortened: {session.shaved.map((s) => `${s.name} → ${s.to}`).join(", ")}
              </div>
            )}
          </Card>
        );
      })}

      <Label style={{ margin: "20px 2px 9px" }}>Weekly sets by muscle</Label>
      <Card style={{ padding: "12px 14px" }}>
        <MuscleVolumeList volume={volume} />
      </Card>
    </div>
  );
}

// One program day in the plan editor: pick its weekday, or split it across two.
function DayPlanRow({ dayKey, position, assign, setAssign, splits, setSplits, weekday, program }) {
  const split = splits[dayKey];
  const halfNames = splitHalfNames(program, dayKey);

  const weekdayPicker = (selectedIndex, onPick, accent) => (
    <div style={{ display: "flex", gap: 4 }}>
      {WEEKDAY_INDEXES.map((i) => {
        const day = weekday(i);
        const selected = selectedIndex === i;
        const color = accent || colors.grass;
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 5,
              fontFamily: fonts.mono,
              fontSize: 10,
              cursor: "pointer",
              lineHeight: 1.4,
              border: `1px solid ${selected ? color : colors.line}`,
              background: selected
                ? accent
                  ? "rgba(143,187,217,.15)"
                  : "rgba(168,198,134,.15)"
                : "transparent",
              color: selected ? color : colors.faint,
            }}
          >
            {day.short}
            <br />
            {day.num}
          </button>
        );
      })}
    </div>
  );

  const toggleSplit = () => {
    const next = { ...splits };
    if (split) {
      delete next[dayKey];
      setSplits(next);
      return;
    }
    // Default the halves onto the neighbouring program days' weekdays.
    const neighbourDay = (key, side) =>
      key ? (splits[key] ? splits[key].to[side] : assign[key]) : assign[dayKey];
    const to = [neighbourDay(DAY_KEYS[position - 1], 1), neighbourDay(DAY_KEYS[position + 1], 0)];
    next[dayKey] = { to, pick: defaultSplitPicks(program, dayKey, to, assign, splits) };
    setAssign({ ...assign, [dayKey]: to[0] });
    setSplits(next);
  };

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
      <div style={{ fontSize: 13, color: colors.cream }}>
        {position + 1}. {program.days[position].title}
      </div>
      <button
        onClick={toggleSplit}
        style={{
          padding: "3px 10px",
          borderRadius: 5,
          fontSize: 11,
          fontFamily: fonts.sans,
          cursor: "pointer",
          border: `1px solid ${split ? colors.sky : colors.line}`,
          background: "transparent",
          color: split ? colors.sky : colors.faint,
        }}
      >
        {split ? "Unsplit" : "Split"}
      </button>
    </div>
  );

  if (!split) {
    return (
      <div style={{ marginBottom: 10 }}>
        {header}
        {weekdayPicker(assign[dayKey], (i) => setAssign({ ...assign, [dayKey]: i }))}
      </div>
    );
  }

  const lifts = sortLifts(program.liftsByDay[dayKey]);
  const setsOnSide = (side) => totalSets(lifts.filter((l) => splitSide(split, l) === side));
  const moveHalf = (side, index) => {
    const to = [...split.to];
    to[side] = index;
    setSplits({ ...splits, [dayKey]: { ...split, to } });
  };
  const flipLift = (lift) => {
    setSplits({
      ...splits,
      [dayKey]: { ...split, pick: { ...split.pick, [lift.id]: splitSide(split, lift) ? 0 : 1 } },
    });
  };
  const halfLabel = (side, color) => (
    <div style={{ fontFamily: fonts.mono, fontSize: 10, color, margin: "7px 0 4px" }}>
      {halfNames[side]} · {setsOnSide(side)} sets →
    </div>
  );

  return (
    <div
      style={{
        marginBottom: 12,
        padding: "8px 9px 10px",
        border: `1px solid ${colors.line}`,
        borderRadius: 8,
      }}
    >
      {header}
      {halfLabel(0, colors.grass)}
      {weekdayPicker(split.to[0], (i) => moveHalf(0, i))}
      {halfLabel(1, colors.sky)}
      {weekdayPicker(split.to[1], (i) => moveHalf(1, i), colors.sky)}
      <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.faint, margin: "10px 0 5px" }}>
        Tap a lift to move it to the other half
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {lifts.map((lift) => {
          const side = splitSide(split, lift);
          return (
            <button
              key={lift.id}
              onClick={() => flipLift(lift)}
              style={{
                padding: "4px 7px",
                borderRadius: 5,
                fontSize: 10,
                fontFamily: fonts.mono,
                cursor: "pointer",
                border: `1px solid ${side ? colors.sky : colors.grassDim}`,
                background: "transparent",
                color: side ? colors.sky : colors.grass,
              }}
            >
              {lift.name} · {lift.sets}
            </button>
          );
        })}
      </div>
    </div>
  );
}
