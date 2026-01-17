import React, { useMemo, useState } from "react";

export type CharacterOption = {
  id: string; // name as id
  name: string;
  image: string;
};

type Props = {
  open: boolean;
  title: string;
  options: CharacterOption[];
  initialSelectedIds?: string[];
  onClose: () => void;
  onConfirm: (selected: CharacterOption[]) => void;

  showScore?: boolean;
  scoreById?: Record<string, number>;
};

export default function MultiCharacterPickerModal({
  open,
  title,
  options,
  initialSelectedIds = [],
  onClose,
  onConfirm,
  showScore = false,
  scoreById = {},
}: Props): React.JSX.Element | null {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const selectedList = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return options.filter((o) => selectedIds.has(o.id));
  }, [options, selectedIds]);

  const allVisibleSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((o) => selectedIds.has(o.id));
  }, [filtered, selectedIds]);

  if (!open) return null;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ✅ Toggle Select/Deselect all VISIBLE (filtered)
  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (filtered.length === 0) return next;

      const everythingVisibleIsSelected = filtered.every((o) => next.has(o.id));

      if (everythingVisibleIsSelected) {
        // Deselect only visible
        for (const o of filtered) next.delete(o.id);
      } else {
        // Select only visible
        for (const o of filtered) next.add(o.id);
      }

      return next;
    });
  };

  const reset = () => setSelectedIds(new Set());

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <div className="modalTitle">{title}</div>
        </div>

        <div className="modalBody">
          <div className="modalHint">Select multiple, then press OK.</div>

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
              onClick={toggleAllVisible}
              disabled={filtered.length === 0}
              title={
                allVisibleSelected
                  ? "Deselect all visible results"
                  : "Select all visible results"
              }
            >
              {allVisibleSelected ? "Deselect All" : "Select All"}
            </button>

            <button
              type="button"
              className="modalSmallBtn"
              onClick={reset}
              title="Clear all selections"
            >
              Reset
            </button>
          </div>

          <div className="modalGridWrap">
            <div className="modalGrid">
              {filtered.map((c) => {
                const isActive = selectedIds.has(c.id);
                const score = showScore ? scoreById[c.id] : undefined;

                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`charTile ${isActive ? "charTile--active" : ""}`}
                    onClick={() => toggleOne(c.id)}
                  >
                    <div className="charCircle">
                      <img
                        className="charImg"
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                      />
                      {showScore && typeof score === "number" && (
                        <div className="charScore" title={`Affinity: ${score}`}>
                          {score}
                        </div>
                      )}
                    </div>
                    <div className="charName">{c.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <button
            type="button"
            className="modalBtn modalBtn--ghost"
            onClick={onClose}
          >
            Back
          </button>

          <button
            type="button"
            className="modalBtn modalBtn--ok"
            disabled={selectedIds.size === 0}
            onClick={() => onConfirm(selectedList)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
