import { useMemo, useState } from "react";
import { LiftRow } from "../components/LiftRow.jsx";
import { Card, Label, PrevNext } from "../components/ui.jsx";
import { DAYS, DAY_NAMES } from "../data/program.js";
import { parseDate, shiftDateStr, shortDate, weekStartOf, weekdayKey } from "../lib/dates.js";
import { weekVariant, programForWeek } from "../lib/rotation.js";
import { sessionForDate } from "../lib/schedule.js";
import { totalSets } from "../lib/volume.js";
import { clearLift, isLiftDone, keepSame, recordSet, resolvePrompt } from "../lib/workout.js";
import { colors, fonts } from "../theme.js";

export function TodayScreen({ date, setDate, state, save, dayLog, setDayLog }) {
  const [openId, setOpenId] = useState(null);
  const { lifts, cut, shaved, title, sources, ordinal, nSessions } = useMemo(
    () => sessionForDate(date, state.plans, programForWeek(weekStartOf(date), state.ab)),
    [date, state.plans, state.ab],
  );
  const weekday = weekdayKey(parseDate(date));
  // Notes belong to the program day (the first one, if several are combined).
  const noteKey = sources[0] || weekday;
  const doneCount = lifts.filter((l) => isLiftDone(l, dayLog[l.id])).length;

  const apply = ({ state: nextState, dayLog: nextLog }) => {
    setDayLog(nextLog);
    save(nextState);
  };

  return (
    <div>
      <div style={{ padding: "18px 14px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Label>
              {ordinal ? `Day ${ordinal} of ${nSessions}` : "Rest day"} · Week{" "}
              {weekVariant(weekStartOf(date), state.ab)} · {DAY_NAMES[weekday]} {shortDate(date)}
            </Label>
            <div
              style={{
                fontSize: 25,
                color: colors.cream,
                fontWeight: 600,
                marginTop: 5,
                letterSpacing: -0.4,
              }}
            >
              {title || "Rest"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <PrevNext onStep={(dir) => setDate(shiftDateStr(date, dir))} />
          </div>
        </div>
        {lifts.length > 0 && (
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.dim, marginTop: 8 }}>
            {doneCount}/{lifts.length} lifts · {totalSets(lifts)} sets
            {cut.length > 0 && <span style={{ color: colors.sky }}> · {cut.length} trimmed</span>}
          </div>
        )}
      </div>

      {lifts.length === 0 ? (
        <div
          style={{
            padding: "44px 24px",
            textAlign: "center",
            color: colors.faint,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Rest day.
          <br />
          <span style={{ color: colors.skyDim }}>
            Want to lift today? Edit your schedule in the Week tab.
          </span>
        </div>
      ) : (
        <Card style={{ margin: "0 12px", overflow: "hidden" }}>
          {lifts.map((lift) => (
            <LiftRow
              key={lift.id}
              lift={lift}
              progress={state.prog[lift.id]}
              sets={dayLog[lift.id] || []}
              open={openId === lift.id}
              onToggle={() => setOpenId(openId === lift.id ? null : lift.id)}
              prompt={state.pending[lift.id]}
              onSet={(i, result) => apply(recordSet(state, dayLog, lift, i, result, date))}
              onKeepSame={() => setDayLog(keepSame(state, dayLog, lift))}
              onClear={() => apply(clearLift(state, dayLog, lift, date))}
              onPrompt={(accept) => save(resolvePrompt(state, lift, accept))}
            />
          ))}
        </Card>
      )}

      {(cut.length > 0 || shaved.length > 0) && (
        <div style={{ margin: "12px 14px", fontFamily: fonts.mono, fontSize: 11, lineHeight: 1.7 }}>
          {cut.length > 0 && (
            <div style={{ color: colors.sky }}>Dropped: {cut.map((l) => l.name).join(", ")}</div>
          )}
          {shaved.length > 0 && (
            <div style={{ color: colors.skyDim }}>
              Shortened: {shaved.map((s) => `${s.name} → ${s.to}`).join(", ")}
            </div>
          )}
        </div>
      )}

      {lifts.length > 0 && (
        <div style={{ margin: "14px 12px 0" }}>
          <Label style={{ marginBottom: 6, paddingLeft: 2 }}>
            Notes · {DAYS.find((d) => d.key === noteKey)?.title ?? DAY_NAMES[noteKey]}
          </Label>
          <textarea
            value={state.notes[noteKey] || ""}
            onChange={(e) => save({ ...state, notes: { ...state.notes, [noteKey]: e.target.value } })}
            placeholder="Anything worth remembering"
            style={{
              width: "100%",
              minHeight: 62,
              background: colors.surf,
              border: `1px solid ${colors.line}`,
              borderRadius: 9,
              color: colors.cream,
              padding: 11,
              fontSize: 13,
              fontFamily: fonts.sans,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </div>
  );
}
