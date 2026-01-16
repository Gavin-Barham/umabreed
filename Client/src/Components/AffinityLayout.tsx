import React from "react";
import "./AffinityLayout.css";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function multiplierToColor(mult: number) {
  // normalize 1.0 -> 0, 4.0 -> 1
  const t = clamp((mult - 1.0) / (4.0 - 1.0), 0, 1);

  // red -> green gradient
  const r = Math.round(lerp(220, 80, t));
  const g = Math.round(lerp(70, 200, t));
  const b = Math.round(lerp(70, 70, t));

  return `rgb(${r}, ${g}, ${b})`;
}

type BubbleProps = {
  multiplier?: number | null;
};

function Bubble({ multiplier }: { multiplier?: number | null }) {
  const num = typeof multiplier === "number" ? multiplier : NaN;

  // Unset if: undefined, null, NaN, OR <= 0
  const unset = !Number.isFinite(num) || num <= 0;

  const display = unset ? "x0.00" : `x${num.toFixed(2)}`;

  const bg = unset ? "#ffffff" : multiplierToColor(num);
  const fg = unset ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.78)";

  return (
    <div className="bubble" style={{ backgroundColor: bg, color: fg }}>
      {display}
    </div>
  );
}


type CardSlotProps = {
  label: string;
  showBubble?: boolean;
  bubbleMultiplier?: number | null;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function CardSlot({
  label,
  showBubble = false,
  bubbleMultiplier = null,
  onClick,
}: CardSlotProps) {
  return (
    <div className="slotWrap">
      {showBubble && <Bubble multiplier={bubbleMultiplier} />}
      <button type="button" className="slot" onClick={onClick}>
        <span className="slotLabel">{label}</span>
      </button>
    </div>
  );
}

export default function AffinityLayout(): React.JSX.Element {
  // Defaults: unset => white bubbles showing x0.00
  const multipliers: Record<string, number | null> = {
    p1: null,
    p2: null,
    gp1: null,
    gp2: null,
    gp3: null,
    gp4: null,
  };

  return (
    <div className="page">
      <div className="topBar">
        <button className="pillBtn" type="button">
          Reset
        </button>

        <button className="pillBtn" type="button">
          Recommend
        </button>
      </div>

      <div className="gridArea">
        {/* Top / child */}
        <div className="row row--center">
          <CardSlot label="Child" />
        </div>

        {/* Parents (2) */}
        <div className="row row--two">
          <CardSlot label="Parent 1" showBubble bubbleMultiplier={multipliers.p1} />
          <CardSlot label="Parent 2" showBubble bubbleMultiplier={multipliers.p2} />
        </div>

        {/* Grandparents (4) */}
        <div className="row row--four">
          <CardSlot label="GP 1" showBubble bubbleMultiplier={multipliers.gp1} />
          <CardSlot label="GP 2" showBubble bubbleMultiplier={multipliers.gp2} />
          <CardSlot label="GP 3" showBubble bubbleMultiplier={multipliers.gp3} />
          <CardSlot label="GP 4" showBubble bubbleMultiplier={multipliers.gp4} />
        </div>
      </div>

      <div className="bottomBar">
        <div className="bottomLeft">in-game affinity display</div>
        <div className="bottomMid">
          <span className="metric">62</span>
          <span className="dot" />
        </div>
        <div className="bottomMid">
          <span className="metric metric--orange">106</span>
        </div>
        <div className="bottomRight">Compatibility</div>
      </div>
    </div>
  );
}
