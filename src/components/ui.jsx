// Small shared building blocks. Styling is inline, using the tokens in theme.js.

import { MUSCLES, WEEKLY_SET_TARGETS } from "../data/program.js";
import { colors, fonts } from "../theme.js";

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: colors.surf,
        border: `1px solid ${colors.line}`,
        borderRadius: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Small uppercase caption.
export function Label({ children, style }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: colors.faint,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// − value + control.
export function Stepper({ value, onChange, step = 1, min = 0, width = 62 }) {
  const button = {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: `1px solid ${colors.line}`,
    background: colors.surf2,
    color: colors.cream,
    fontSize: 21,
    lineHeight: "36px",
    padding: 0,
    cursor: "pointer",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={button} onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>
        −
      </button>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 17,
          color: colors.cream,
          width,
          textAlign: "center",
        }}
      >
        {value}
      </div>
      <button style={button} onClick={() => onChange(+(value + step).toFixed(2))}>
        +
      </button>
    </div>
  );
}

// Progress bar against a target: red under half, amber over 125%. The tick
// marks two-thirds of the bar, i.e. 100% of target.
function VolumeBar({ value, target }) {
  const pct = Math.min(150, (value / target) * 100);
  const color = value < target * 0.5 ? colors.red : value > target * 1.25 ? colors.amber : colors.grass;
  return (
    <div
      style={{
        height: 6,
        background: colors.surf2,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color }} />
      <div
        style={{
          position: "absolute",
          left: "66.6%",
          top: 0,
          bottom: 0,
          width: 1,
          background: colors.faint,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

// Every muscle's set count against its weekly target.
export function MuscleVolumeList({ volume }) {
  return MUSCLES.map((muscle) => (
    <div key={muscle} style={{ marginBottom: 9 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        <span style={{ color: colors.cream }}>{muscle}</span>
        <span style={{ fontFamily: fonts.mono, color: colors.dim }}>
          {volume[muscle]} / {WEEKLY_SET_TARGETS[muscle]}
        </span>
      </div>
      <VolumeBar value={volume[muscle]} target={WEEKLY_SET_TARGETS[muscle]} />
    </div>
  ));
}

// ‹ › buttons for stepping back and forward. Calls onStep(-1) or onStep(1).
export function PrevNext({ onStep }) {
  return [-1, 1].map((dir) => (
    <button
      key={dir}
      onClick={() => onStep(dir)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        border: `1px solid ${colors.line}`,
        background: colors.surf,
        color: colors.dim,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  ));
}

// Filled grass-green call-to-action button style.
export const primaryButton = {
  borderRadius: 7,
  border: "none",
  background: colors.grass,
  color: colors.onGrass,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: fonts.sans,
};

// Outlined low-emphasis button style.
export const secondaryButton = {
  borderRadius: 7,
  border: `1px solid ${colors.line}`,
  background: "transparent",
  color: colors.dim,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: fonts.sans,
};
