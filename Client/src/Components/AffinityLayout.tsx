import React, { useMemo, useState } from "react";
import "../Styles/affinityLayout.css";
import CharacterPickerModal from "../Components/CharacterPickerModal";
import characters from "../Data/characters.json";

type SlotKey = "child" | "p1" | "p2" | "gp1" | "gp2" | "gp3" | "gp4";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function multiplierToColor(mult: number) {
  const t = clamp((mult - 1.0) / 3.0, 0, 1);
  const r = Math.round(lerp(220, 80, t));
  const g = Math.round(lerp(70, 200, t));
  const b = Math.round(lerp(70, 70, t));
  return `rgb(${r}, ${g}, ${b})`;
}

function Bubble({ multiplier }: { multiplier?: number | null }) {
  const num = typeof multiplier === "number" ? multiplier : NaN;
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
  value?: string | null;
  showBubble?: boolean;
  bubbleMultiplier?: number | null;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function CardSlot({
  label,
  value = null,
  showBubble = false,
  bubbleMultiplier = null,
  onClick,
}: CardSlotProps) {
  const text = value && value.trim().length ? value : label;

  return (
    <div className="slotWrap">
      {showBubble && <Bubble multiplier={bubbleMultiplier} />}
      <button type="button" className="slot" onClick={onClick}>
        <span className="slotLabel">{text}</span>
      </button>
    </div>
  );
}

export default function AffinityLayout(): React.JSX.Element {
  // Selected names per slot
  const [slots, setSlots] = useState<Record<SlotKey, string | null>>({
    child: null,
    p1: null,
    p2: null,
    gp1: null,
    gp2: null,
    gp3: null,
    gp4: null,
  });

  // Bubble multipliers (defaults)
  const multipliers = useMemo(
    () => ({
      p1: null,
      p2: null,
      gp1: null,
      gp2: null,
      gp3: null,
      gp4: null,
    }),
    []
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotKey>("child");

  const openPicker = (slot: SlotKey) => {
    setActiveSlot(slot);
    setPickerOpen(true);
  };

  const titleForSlot = (slot: SlotKey) => {
    switch (slot) {
      case "child":
        return "Select Child";
      case "p1":
        return "Select Parent 1";
      case "p2":
        return "Select Parent 2";
      case "gp1":
        return "Select GP 1";
      case "gp2":
        return "Select GP 2";
      case "gp3":
        return "Select GP 3";
      case "gp4":
        return "Select GP 4";
      default:
        return "Select Character";
    }
  };

  return (
    <div className="page">
      <div className="topBar">
        <button
          className="pillBtn"
          type="button"
          onClick={() =>
            setSlots({
              child: null,
              p1: null,
              p2: null,
              gp1: null,
              gp2: null,
              gp3: null,
              gp4: null,
            })
          }
        >
          Reset
        </button>

        <button className="pillBtn" type="button">
          Recommend
        </button>
      </div>

      <div className="gridArea">
        {/* Child */}
        <div className="row row--center">
          <CardSlot
            label="Child"
            value={slots.child}
            onClick={() => openPicker("child")}
          />
        </div>

        {/* Parents */}
        <div className="row row--two">
          <CardSlot
            label="Parent 1"
            value={slots.p1}
            showBubble
            bubbleMultiplier={multipliers.p1}
            onClick={() => openPicker("p1")}
          />
          <CardSlot
            label="Parent 2"
            value={slots.p2}
            showBubble
            bubbleMultiplier={multipliers.p2}
            onClick={() => openPicker("p2")}
          />
        </div>

        {/* Grandparents */}
        <div className="row row--four">
          <CardSlot
            label="GP 1"
            value={slots.gp1}
            showBubble
            bubbleMultiplier={multipliers.gp1}
            onClick={() => openPicker("gp1")}
          />
          <CardSlot
            label="GP 2"
            value={slots.gp2}
            showBubble
            bubbleMultiplier={multipliers.gp2}
            onClick={() => openPicker("gp2")}
          />
          <CardSlot
            label="GP 3"
            value={slots.gp3}
            showBubble
            bubbleMultiplier={multipliers.gp3}
            onClick={() => openPicker("gp3")}
          />
          <CardSlot
            label="GP 4"
            value={slots.gp4}
            showBubble
            bubbleMultiplier={multipliers.gp4}
            onClick={() => openPicker("gp4")}
          />
        </div>
      </div>

      <div className="bottomBar">
        <div className="bottomLeft">in-game affinity display</div>
        <div className="bottomMid">
          <span className="metric">0</span>
          <span className="dot" />
        </div>
        <div className="bottomMid">
          <span className="metric metric--orange">0</span>
        </div>
        <div className="bottomRight">Compatibility</div>
      </div>

      <CharacterPickerModal
        open={pickerOpen}
        title={titleForSlot(activeSlot)}
        options={characters as string[]}
        initialValue={slots[activeSlot]}
        onClose={() => setPickerOpen(false)}
        onConfirm={(value) => {
          setSlots((prev) => ({ ...prev, [activeSlot]: value }));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
