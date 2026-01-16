import React, { useMemo, useState } from "react";

export type CharacterOption = {
  id: number;
  name: string;
  image: string; // ideally "/CharacterSprites/1.png"
};

type Props = {
  open: boolean;
  title: string;
  options: CharacterOption[];
  initialValue?: CharacterOption | null;
  onClose: () => void;
  onConfirm: (value: CharacterOption) => void;
};

export default function CharacterPickerModal({
  open,
  title,
  options,
  initialValue = null,
  onClose,
  onConfirm,
}: Props): React.JSX.Element | null {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(initialValue?.id ?? null);

  const selected = useMemo(
    () => (selectedId == null ? null : options.find((o) => o.id === selectedId) ?? null),
    [options, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <div className="modalTitle">{title}</div>
        </div>

        <div className="modalBody">
          <div className="modalHint">
            Pick a character, then press OK.
          </div>

          <div className="modalSearchRow">
            <input
              className="modalSearch"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              className="modalSmallBtn"
              onClick={() => setSelectedId(null)}
              title="Clear selection"
            >
              Reset
            </button>
          </div>

          <div className="modalGridWrap">
            <div className="modalGrid">
              {filtered.map((c) => {
                const isActive = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`charTile ${isActive ? "charTile--active" : ""}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="charCircle">
                      <img className="charImg" src={c.image} alt={c.name} loading="lazy" />
                    </div>
                    <div className="charName">{c.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <button type="button" className="modalBtn modalBtn--ghost" onClick={onClose}>
            Back
          </button>

          <button
            type="button"
            className="modalBtn modalBtn--ok"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onConfirm(selected);
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
