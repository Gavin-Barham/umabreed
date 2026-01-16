import React, { useMemo, useState } from "react";
import "../Styles/affinityLayout.css";

import CharacterPickerModal from "./CharacterPickerModal";
import type { CharacterOption } from "./CharacterPickerModal";

import MultiCharacterPickerModal from "./MultiCharacterPickerModal";
import type { CharacterOption as MultiCharacterOption } from "./MultiCharacterPickerModal";

type SlotKey = "child" | "p1" | "p2" | "gp1" | "gp2" | "gp3" | "gp4";

const API_BASE = "http://localhost:5000";

function imgFromName(name: string) {
  return `/CharacterSprites/${encodeURIComponent(name)}.png`;
}

function toOption(name: string): CharacterOption {
  return { id: name, name, image: imgFromName(name) };
}

async function fetchCharacters(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/characters`);
  if (!res.ok) throw new Error(`GET /characters failed: ${res.status}`);
  return (await res.json()) as string[];
}

async function fetchAffinity(childName: string): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE}/affinity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character_name: childName }),
  });
  if (!res.ok) throw new Error(`POST /affinity failed: ${res.status}`);
  return (await res.json()) as Record<string, number>;
}

type OptimizeResponse = {
  P1: number;
  P2: number;
  GP1_1: number;
  GP1_2: number;
  GP2_1: number;
  GP2_2: number;
  "Total compatibility": number;
  "Displayed affinity": number;
  lineage: [string, string, string, string, string, string, string];
};

async function postOptimize(args: {
  lineage_names: [string, string, string, string, string, string, string];
  available_names: string[];
}): Promise<OptimizeResponse> {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST /optimize failed: ${res.status} ${text}`);
  }
  return (await res.json()) as OptimizeResponse;
}

function sortAffinityKeysDesc(aff: Record<string, number>) {
  return Object.entries(aff)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0) - (a[0] > b[0] ? 1 : -1))
    .map(([name]) => name);
}

function scoreToMultiplier(score?: number) {
  if (typeof score !== "number") return null;
  return score / 100 + 1;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Bubble color scale: 1.0 -> 1.5
 */
function multiplierToColor(mult: number) {
  const t = clamp((mult - 1.0) / 0.5, 0, 1); // 1.0..1.5
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
  selected?: CharacterOption | null;
  showBubble?: boolean;
  bubbleMultiplier?: number | null;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function CardSlot({
  label,
  selected = null,
  showBubble = false,
  bubbleMultiplier = null,
  disabled = false,
  onClick,
}: CardSlotProps) {
  return (
    <div className="slotWrap">
      {showBubble && <Bubble multiplier={bubbleMultiplier} />}

      <button
        type="button"
        className={`slot ${disabled ? "slot--disabled" : ""}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {selected ? (
          <img className="slotImg" src={selected.image} alt={selected.name} />
        ) : (
          <span className="slotLabel">{label}</span>
        )}
      </button>
    </div>
  );
}

export default function AffinityLayout(): React.JSX.Element {
  const [slots, setSlots] = useState<Record<SlotKey, CharacterOption | null>>({
    child: null,
    p1: null,
    p2: null,
    gp1: null,
    gp2: null,
    gp3: null,
    gp4: null,
  });

  const childSelected = !!slots.child;

  // Bottom bar metrics (were hardcoded 0 before)
  const [displayedAffinity, setDisplayedAffinity] = useState<number>(0);
  const [totalCompatibility, setTotalCompatibility] = useState<number>(0);

  // Latest affinity map for selected child (drives badges + bubbles)
  const [childAffinity, setChildAffinity] = useState<Record<string, number>>({});

  // Bubble multipliers derived from selected name -> affinity score -> score/100+1
  const multipliers = useMemo(() => {
    return {
      p1: scoreToMultiplier(childAffinity[slots.p1?.id ?? ""]),
      p2: scoreToMultiplier(childAffinity[slots.p2?.id ?? ""]),
      gp1: scoreToMultiplier(childAffinity[slots.gp1?.id ?? ""]),
      gp2: scoreToMultiplier(childAffinity[slots.gp2?.id ?? ""]),
      gp3: scoreToMultiplier(childAffinity[slots.gp3?.id ?? ""]),
      gp4: scoreToMultiplier(childAffinity[slots.gp4?.id ?? ""]),
    };
  }, [childAffinity, slots]);

  // Recommend pool (multi-select)
  const [availableUmas, setAvailableUmas] = useState<MultiCharacterOption[]>([]);

  // Single picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotKey>("child");
  const [modalKey, setModalKey] = useState(0);
  const [pickerOptions, setPickerOptions] = useState<CharacterOption[]>([]);
  const [pickerTitle, setPickerTitle] = useState("Select Character");

  // Score map for P/GP modal tiles
  const [pickerScoreById, setPickerScoreById] = useState<Record<string, number>>({});
  const [pickerShowScore, setPickerShowScore] = useState(false);

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

  const openPicker = async (slot: SlotKey) => {
    if (slot !== "child" && !slots.child) return;

    setActiveSlot(slot);
    setPickerTitle(titleForSlot(slot));
    setModalKey((k) => k + 1); // remount -> clears search

    try {
      if (slot === "child") {
        const names = await fetchCharacters();
        setPickerOptions(names.map(toOption));
        setPickerScoreById({});
        setPickerShowScore(false);
      } else {
        const childName = slots.child!.name;
        const aff = await fetchAffinity(childName);

        setChildAffinity(aff);

        const names = sortAffinityKeysDesc(aff);
        setPickerOptions(names.map(toOption));
        setPickerScoreById(aff);
        setPickerShowScore(true);
      }

      setPickerOpen(true);
    } catch (e) {
      console.error(e);
      setPickerOptions([]);
      setPickerScoreById({});
      setPickerShowScore(slot !== "child");
      setPickerOpen(true);
    }
  };

  // Recommend modal state
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendKey, setRecommendKey] = useState(0);
  const [recommendOptions, setRecommendOptions] = useState<MultiCharacterOption[]>([]);
  const [recommendScoreById, setRecommendScoreById] = useState<Record<string, number>>({});

  const openRecommend = async () => {
    if (!slots.child) return;

    setRecommendKey((k) => k + 1);

    try {
      const childName = slots.child.name;
      const aff = await fetchAffinity(childName);

      setChildAffinity(aff);

      const names = sortAffinityKeysDesc(aff).filter((n) => n !== childName);

      setRecommendOptions(names.map((n) => ({ id: n, name: n, image: imgFromName(n) })));
      setRecommendScoreById(aff);
      setRecommendOpen(true);
    } catch (e) {
      console.error(e);
      setRecommendOptions([]);
      setRecommendScoreById({});
      setRecommendOpen(true);
    }
  };

 const handleRecommendConfirm = (selected: MultiCharacterOption[]) => {
  setAvailableUmas(selected);
  setRecommendOpen(false);

  void (async () => {
    try {
      const childName = slots.child?.name;
      if (!childName) return;

      // ✅ lineage_names uses existing selections (P/GP), blanks for unselected
      const lineage_names: [string, string, string, string, string, string, string] = [
        childName,
        slots.p1?.name ?? "",
        slots.p2?.name ?? "",
        slots.gp1?.name ?? "",
        slots.gp2?.name ?? "",
        slots.gp3?.name ?? "",
        slots.gp4?.name ?? "",
      ];

      // ✅ available_names is ONLY the multiselect modal picks
      const available_names = selected.map((s) => s.name);

      const payload = { lineage_names, available_names };

      // ✅ log what we're sending
      console.log("[/optimize] request payload:", payload);

      const result = await postOptimize(payload);

      // ✅ log what we got back
      console.log("[/optimize] response:", result);

      // Update bottom bar numbers
      setDisplayedAffinity(result["Displayed affinity"] ?? 0);
      setTotalCompatibility(result["Total compatibility"] ?? 0);

      const [rChild, rP1, rP2, rGP1, rGP2, rGP3, rGP4] = result.lineage;

      // Fill ONLY slots the user did not pick
      setSlots((prev) => ({
        child: prev.child ?? (rChild ? toOption(rChild) : null),
        p1: prev.p1 ?? (rP1 ? toOption(rP1) : null),
        p2: prev.p2 ?? (rP2 ? toOption(rP2) : null),
        gp1: prev.gp1 ?? (rGP1 ? toOption(rGP1) : null),
        gp2: prev.gp2 ?? (rGP2 ? toOption(rGP2) : null),
        gp3: prev.gp3 ?? (rGP3 ? toOption(rGP3) : null),
        gp4: prev.gp4 ?? (rGP4 ? toOption(rGP4) : null),
      }));

      // Refresh affinity map for bubbles/badges
      const nextChild = rChild || childName;
      const aff = await fetchAffinity(nextChild);
      setChildAffinity(aff);
    } catch (e) {
      console.error("[/optimize] error:", e);
    }
  })();
};


  return (
    <div className="page">
      <div className="topBar">
        <button
          className="pillBtn"
          type="button"
          onClick={() => {
            setSlots({ child: null, p1: null, p2: null, gp1: null, gp2: null, gp3: null, gp4: null });
            setAvailableUmas([]);
            setChildAffinity({});
            setPickerScoreById({});
            setRecommendScoreById({});
            setDisplayedAffinity(0);
            setTotalCompatibility(0);
          }}
        >
          Reset
        </button>

        <button
          className={`pillBtn ${!childSelected ? "pillBtn--disabled" : ""}`}
          type="button"
          onClick={openRecommend}
          disabled={!childSelected}
          aria-disabled={!childSelected}
          title={!childSelected ? "Select a Child first" : undefined}
        >
          Recommend
        </button>
      </div>

      <div className="gridArea">
        <div className="row row--center">
          <CardSlot label="Child" selected={slots.child} onClick={() => void openPicker("child")} />
        </div>

        <div className="row row--two">
          <CardSlot
            label="Parent 1"
            selected={slots.p1}
            showBubble
            bubbleMultiplier={multipliers.p1}
            disabled={!childSelected}
            onClick={() => void openPicker("p1")}
          />
          <CardSlot
            label="Parent 2"
            selected={slots.p2}
            showBubble
            bubbleMultiplier={multipliers.p2}
            disabled={!childSelected}
            onClick={() => void openPicker("p2")}
          />
        </div>

        <div className="row row--four">
          <CardSlot
            label="GP 1"
            selected={slots.gp1}
            showBubble
            bubbleMultiplier={multipliers.gp1}
            disabled={!childSelected}
            onClick={() => void openPicker("gp1")}
          />
          <CardSlot
            label="GP 2"
            selected={slots.gp2}
            showBubble
            bubbleMultiplier={multipliers.gp2}
            disabled={!childSelected}
            onClick={() => void openPicker("gp2")}
          />
          <CardSlot
            label="GP 3"
            selected={slots.gp3}
            showBubble
            bubbleMultiplier={multipliers.gp3}
            disabled={!childSelected}
            onClick={() => void openPicker("gp3")}
          />
          <CardSlot
            label="GP 4"
            selected={slots.gp4}
            showBubble
            bubbleMultiplier={multipliers.gp4}
            disabled={!childSelected}
            onClick={() => void openPicker("gp4")}
          />
        </div>
      </div>

      <div className="bottomBar">
        <div className="bottomLeft">in-game affinity display</div>

        <div className="bottomMid">
          <span className="metric">{displayedAffinity}</span>
          <span className="dot" />
        </div>

        <div className="bottomMid">
          <span className="metric metric--orange">{totalCompatibility}</span>
        </div>

        <div className="bottomRight">Compatibility</div>
      </div>

      {/* Single-select picker */}
      <CharacterPickerModal
        key={`${activeSlot}-${modalKey}`}
        open={pickerOpen}
        title={pickerTitle}
        options={pickerOptions}
        initialValue={slots[activeSlot]}
        onClose={() => setPickerOpen(false)}
        onConfirm={(value) => {
          setPickerOpen(false);

          if (activeSlot === "child") {
            // child changes: clear lineage (but keep child), reset metrics, reset affinity map
            setAvailableUmas((prev) => prev.filter((u) => u.id !== value.id));
            setChildAffinity({});
            setDisplayedAffinity(0);
            setTotalCompatibility(0);

            setSlots({
              child: value,
              p1: null,
              p2: null,
              gp1: null,
              gp2: null,
              gp3: null,
              gp4: null,
            });
            return;
          }

          setSlots((prev) => ({ ...prev, [activeSlot]: value }));
        }}
        showScore={pickerShowScore}
        scoreById={pickerScoreById}
      />

      {/* Recommend multi-select picker */}
      <MultiCharacterPickerModal
        key={`recommend-${recommendKey}`}
        open={recommendOpen}
        title="Select Available Characters"
        options={recommendOptions}
        initialSelectedIds={availableUmas.map((u) => u.id)}
        onClose={() => setRecommendOpen(false)}
        onConfirm={handleRecommendConfirm}
        showScore={true}
        scoreById={recommendScoreById}
      />
    </div>
  );
}
