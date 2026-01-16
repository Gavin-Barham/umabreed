import React from "react";
import "../Styles/affinityLayout.css";

type BubbleTone = "red" | "amber" | "green" | "olive";

type BubbleProps = {
  value?: string;
  tone?: BubbleTone;
};

function Bubble({ value = "x0.00", tone = "green" }: BubbleProps) {
  return <div className={`bubble bubble--${tone}`}>{value}</div>;
}

type CardSlotProps = {
  label: string;
  showBubble?: boolean;
  bubbleValue?: string;
  bubbleTone?: BubbleTone;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function CardSlot({
  label,
  showBubble = false,
  bubbleValue = "x0.00",
  bubbleTone = "green",
  onClick,
}: CardSlotProps) {
  return (
    <div className="slotWrap">
      {showBubble && <Bubble value={bubbleValue} tone={bubbleTone} />}
      <button type="button" className="slot" onClick={onClick}>
        <span className="slotLabel">{label}</span>
      </button>
    </div>
  );
}

export default function AffinityLayout(): React.JSX.Element {
  const multipliers = {
    p1: "x0.00",
    p2: "x0.00",
    gp1: "x0.00",
    gp2: "x0.00",
    gp3: "x0.00",
    gp4: "x0.00",
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
        <div className="row row--center">
          <CardSlot label="Child" />
        </div>

        <div className="row row--two">
          <CardSlot label="Parent 1" showBubble bubbleValue={multipliers.p1} bubbleTone="red" />
          <CardSlot label="Parent 2" showBubble bubbleValue={multipliers.p2} bubbleTone="amber" />
        </div>

        <div className="row row--four">
          <CardSlot label="GP 1" showBubble bubbleValue={multipliers.gp1} bubbleTone="green" />
          <CardSlot label="GP 2" showBubble bubbleValue={multipliers.gp2} bubbleTone="green" />
          <CardSlot label="GP 3" showBubble bubbleValue={multipliers.gp3} bubbleTone="olive" />
          <CardSlot label="GP 4" showBubble bubbleValue={multipliers.gp4} bubbleTone="green" />
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
