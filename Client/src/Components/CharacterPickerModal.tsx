import React, { useMemo, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  options: string[];
  initialValue?: string | null;
  onClose: () => void;
  onConfirm: (value: string) => void;
};

export default function CharacterPickerModal({
  open,
  title,
  options,
  initialValue = null,
  onClose,
  onConfirm,
}: Props): React.JSX.Element | null {
  // Initialize local state from props on mount.
  // The parent will remount this component when opening via a changing `key`.
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(initialValue);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((n) => n.toLowerCase().includes(q));
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
            While this menu is open, pick a character then press OK.
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
              onClick={() => setSelected(null)}
              title="Clear selection"
            >
              Reset
            </button>
          </div>

          <div className="modalGridWrap">
            <div className="modalGrid">
              {filtered.map((name) => {
                const isActive = selected === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`charTile ${isActive ? "charTile--active" : ""}`}
                    onClick={() => setSelected(name)}
                  >
                    <div className="charTileText">{name}</div>
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
