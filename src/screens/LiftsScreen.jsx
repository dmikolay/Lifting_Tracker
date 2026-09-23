import { useState } from "react";
import { Card, Label, Stepper } from "../components/ui.jsx";
import { DAYS, DAY_NAMES, EQUIPMENT_LABELS, daySlots } from "../data/program.js";
import { shortDate } from "../lib/dates.js";
import { sortLifts } from "../lib/volume.js";
import { colors, fonts } from "../theme.js";

// Every lift by program day (both A/B variants), with its current target editable
// by hand. A lift on several days is one record, so edits show on every day.
export function LiftsScreen({ state, save }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div style={{ padding: "18px 12px 12px" }}>
      {DAYS.map(({ key: dayKey, title }) => (
        <div key={dayKey} style={{ marginBottom: 16 }}>
          <Label style={{ padding: "0 2px 8px" }}>
            {DAY_NAMES[dayKey]} · {title}
          </Label>
          <Card style={{ overflow: "hidden" }}>
            {sortLifts(
              daySlots(dayKey)
                .flat()
                .map(({ lift, sets, variant }) => ({ ...lift, sets, variant })),
            ).map((lift) => {
              const progress = state.prog[lift.id];
              const rowKey = `${dayKey}:${lift.id}`;
              const open = openId === rowKey;
              const update = (field) => (value) =>
                save({ ...state, prog: { ...state.prog, [lift.id]: { ...progress, [field]: value } } });
              return (
                <div key={lift.id} style={{ borderBottom: `1px solid ${colors.line}` }}>
                  <div
                    onClick={() => setOpenId(open ? null : rowKey)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, color: colors.cream }}>{lift.name}</div>
                      <div
                        style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.faint, marginTop: 3 }}
                      >
                        {EQUIPMENT_LABELS[lift.equipment]} · tier {lift.tier} · {lift.sets} sets
                        {lift.variant && ` · week ${lift.variant}`}
                      </div>
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.grass }}>
                      {lift.mode === "weight"
                        ? `${progress.w} × ${progress.r}`
                        : lift.mode === "amrap"
                          ? "max"
                          : `× ${progress.r}`}
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding: "0 14px 14px", background: colors.surf2 }}>
                      <div style={{ fontSize: 12, color: colors.dim, padding: "10px 0", lineHeight: 1.6 }}>
                        {Object.entries(lift.muscles)
                          .map(([m, weight]) => `${m}${weight < 1 ? " (½)" : ""}`)
                          .join(" · ")}
                      </div>
                      {lift.mode !== "amrap" && (
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                          {lift.mode === "weight" && (
                            <div>
                              <Label style={{ marginBottom: 4 }}>Weight</Label>
                              <Stepper value={progress.w} step={lift.increment} onChange={update("w")} />
                            </div>
                          )}
                          <div>
                            <Label style={{ marginBottom: 4 }}>Reps</Label>
                            <Stepper value={progress.r} width={40} onChange={update("r")} />
                          </div>
                          <div>
                            <Label style={{ marginBottom: 4 }}>Range</Label>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <Stepper value={progress.lo} width={34} onChange={update("lo")} />
                              <Stepper value={progress.hi} width={34} onChange={update("hi")} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.faint, marginTop: 12 }}
                      >
                        {(progress.hist || []).length} sessions logged
                        {progress.hist && progress.hist.length
                          ? ` · earned ${shortDate(progress.hist[progress.hist.length - 1].d)}`
                          : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      ))}
    </div>
  );
}
