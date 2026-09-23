// One lift on the Today screen: a summary row that expands into the set logger.

import { useEffect, useState } from "react";
import { shortDate } from "../lib/dates.js";
import { isLiftDone } from "../lib/workout.js";
import { colors, fonts } from "../theme.js";
import { Label, Stepper, primaryButton, secondaryButton } from "./ui.jsx";

const HIT_BG = "rgba(168,198,134,.16)";
const MISS_BG = "rgba(196,97,79,.18)";

export function LiftRow({ lift, progress, sets, open, onToggle, prompt, ...actions }) {
  const done = isLiftDone(lift, sets);
  const slots = Array.from({ length: lift.sets }, (_, i) => sets[i]);
  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.line}`,
        opacity: done && !open ? 0.42 : 1,
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 14px",
          cursor: "pointer",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, color: colors.cream, fontWeight: 500, lineHeight: 1.3 }}>
            {lift.name}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.dim, marginTop: 3 }}>
            {lift.mode === "weight"
              ? `${progress.w} × ${progress.r}`
              : lift.mode === "amrap"
                ? "max reps"
                : `BW × ${progress.r}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {slots.map((set, i) => {
            const missed = set && set.ok === false;
            return (
              <div
                key={i}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  border: `1px solid ${set ? "transparent" : colors.line}`,
                  background: set ? (missed ? MISS_BG : HIT_BG) : "transparent",
                  color: set ? (missed ? colors.red : colors.grass) : colors.faint,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.mono,
                }}
              >
                {set ? (lift.mode === "amrap" ? set.r : missed ? "✕" : "✓") : ""}
              </div>
            );
          })}
        </div>
      </div>
      {open && <SetLogger lift={lift} progress={progress} sets={sets} prompt={prompt} {...actions} />}
    </div>
  );
}

function Stat({ label, color = colors.cream, children }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ fontFamily: fonts.mono, fontSize: 14, color, marginTop: 3 }}>{children}</div>
    </div>
  );
}

function SetLogger({ lift, progress, sets, onSet, onKeepSame, onClear, prompt, onPrompt }) {
  // Weight/reps for the next set tapped; starts at the target, adjustable.
  const [weight, setWeight] = useState(progress.w);
  const [reps, setReps] = useState(progress.r);
  useEffect(() => {
    setWeight(progress.w);
    setReps(progress.r);
  }, [progress.w, progress.r]);

  const last = progress.hist && progress.hist.length ? progress.hist[progress.hist.length - 1] : null;
  const anyLogged = sets.some(Boolean);

  const setButton = (hit, selected, dimmed) => ({
    flex: 1,
    height: 52,
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 22,
    fontFamily: fonts.sans,
    border: `1px solid ${hit ? colors.forest : "rgba(196,97,79,.5)"}`,
    background: selected
      ? hit
        ? "rgba(44,107,71,.38)"
        : "rgba(196,97,79,.28)"
      : hit
        ? "rgba(44,107,71,.13)"
        : "rgba(196,97,79,.07)",
    color: hit ? colors.grass : colors.red,
    opacity: dimmed ? 0.3 : 1,
  });

  const dashedButton = {
    flex: 1,
    padding: "11px 0",
    borderRadius: 8,
    border: `1px dashed ${colors.line}`,
    background: "transparent",
    color: colors.dim,
    fontSize: 12,
    fontFamily: fonts.sans,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "4px 14px 16px", background: colors.surf2 }}>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12 }}>
        <Stat label="Target">
          {lift.sets} × {lift.mode === "amrap" ? "max" : progress.r}
          {lift.mode === "weight" ? ` @ ${progress.w}` : ""}
        </Stat>
        <Stat label="Range">{lift.mode === "amrap" ? "—" : `${progress.lo}–${progress.hi}`}</Stat>
        <Stat label="Last time" color={last ? colors.grass : colors.faint}>
          {last
            ? `${lift.mode === "weight" ? last.w + " × " : ""}${last.r} · ${shortDate(last.d)}`
            : "no data"}
        </Stat>
        {progress.strikes > 0 && (
          <Stat label="Strikes" color={colors.amber}>
            {progress.strikes} of 2
          </Stat>
        )}
      </div>

      {lift.mode !== "amrap" && (
        <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
          {lift.mode === "weight" && (
            <div>
              <Label style={{ marginBottom: 4 }}>Weight</Label>
              <Stepper value={weight} onChange={setWeight} step={lift.increment} />
            </div>
          )}
          <div>
            <Label style={{ marginBottom: 4 }}>Reps</Label>
            <Stepper value={reps} onChange={setReps} width={40} />
          </div>
        </div>
      )}

      {slotsFor(lift).map((i) => {
        const set = sets[i];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {lift.mode === "amrap" ? (
              <>
                <Stepper
                  value={set ? set.r : last ? last.r : 10}
                  onChange={(r) => onSet(i, { ok: true, w: 0, r })}
                  width={48}
                />
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.faint }}>
                  reps to failure
                </div>
              </>
            ) : (
              <>
                <button
                  style={setButton(true, set && set.ok === true, set && set.ok !== true)}
                  onClick={() => onSet(i, { ok: true, w: weight, r: reps })}
                >
                  ✓
                </button>
                <button
                  style={setButton(false, set && set.ok === false, set && set.ok !== false)}
                  onClick={() => onSet(i, { ok: false, w: weight, r: reps })}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onKeepSame} style={dashedButton}>
          Keep same
        </button>
        <button
          onClick={onClear}
          disabled={!anyLogged}
          style={{
            ...dashedButton,
            cursor: anyLogged ? "pointer" : "default",
            opacity: anyLogged ? 1 : 0.35,
          }}
        >
          Clear
        </button>
      </div>

      {prompt && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: colors.forestDim,
            border: `1px solid ${colors.forest}`,
          }}
        >
          <div style={{ fontSize: 13, color: colors.cream, marginBottom: 9 }}>{promptText(prompt, lift)}</div>
          {prompt.type !== "revert" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onPrompt(true)}
                style={{ ...primaryButton, flex: 1, padding: "8px 0", borderRadius: 6 }}
              >
                Take it
              </button>
              <button
                onClick={() => onPrompt(false)}
                style={{ ...secondaryButton, flex: 1, padding: "8px 0", borderRadius: 6 }}
              >
                Not yet
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const slotsFor = (lift) => Array.from({ length: lift.sets }, (_, i) => i);

function promptText(prompt, lift) {
  switch (prompt.type) {
    case "reps":
      return `All sets hit. Move to ${prompt.to} reps next time?`;
    case "weight":
      return `Top of range. Add ${lift.increment} lb → ${prompt.to} × ${prompt.reps}?`;
    case "range":
      return `Top of range. Move to ${prompt.lo}–${prompt.hi} reps?`;
    case "revert":
      return `Missed twice. Back to ${prompt.w} × ${prompt.r}.`;
    default:
      return null;
  }
}
