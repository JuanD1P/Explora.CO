import React, { useEffect, useMemo, useRef, useState } from "react";

export default function DepartmentCombo({
  items = [],
  value,
  onChange,
  onEnter,
  placeholder = "Departamento",
  storageKey = "explora_recent_departments"
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState([]);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(d => d.toLowerCase().includes(s));
  }, [q, items]);

  const hasRecents = recents && recents.length > 0 && !q.trim();


  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);


  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") ||
          (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollIntoView = (idx) => {
    const el = listRef.current?.children[idx];
    el?.scrollIntoView({ block: "nearest" });
  };

  const choose = (item) => {
    if (!item) return;
    setQ(item);
    onChange?.(item);
    setOpen(false);
    onEnter?.(item);

    try {
      const next = [item, ...(recents || [])].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 6);
      setRecents(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, (hasRecents ? recents.length : 0) + filtered.length - 1));
      scrollIntoView(active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      scrollIntoView(active - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pool = hasRecents ? [...recents, ...filtered] : filtered;
      const pick = pool[active] || q;
      choose(pick);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const clearInput = () => {
    setQ("");
    onChange?.("");
    setActive(0);
    inputRef.current?.focus();
    setOpen(true);
  };

  return (
    <div className="combo" ref={wrapRef}>
      <label className="sr-only" htmlFor="deptoInput">Departamento</label>

      <div className={`combo__control ${open ? "is-open" : ""}`}>
        <input
          id="deptoInput"
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); onChange?.(e.target.value); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="combo__input"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="combo-list"
          aria-autocomplete="list"
        />
        {q && (
          <button className="combo__clear" onClick={clearInput} type="button" aria-label="Limpiar">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        )}
        <button
          type="button"
          className="combo__arrow"
          onClick={() => { setOpen(v => !v); inputRef.current?.focus(); }}
          aria-label="Abrir lista"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {open && (
        <div className="combo__panel" role="listbox" id="combo-list">
          {hasRecents && (
            <>
              <div className="combo__sectionTitle">Recientes</div>
              <ul ref={listRef} className="combo__list">
                {recents.map((item, i) => (
                  <li
                    key={`r-${item}`}
                    role="option"
                    aria-selected={active === i}
                    className={`combo__item ${active === i ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="combo__divider" />
            </>
          )}

          <div className="combo__sectionTitle">Departamentos</div>
          {filtered.length === 0 ? (
            <div className="combo__empty">Sin resultados</div>
          ) : (
            <ul ref={listRef} className="combo__list">
              {filtered.map((item, i) => {
                const idx = (hasRecents ? recents.length : 0) + i;
                return (
                  <li
                    key={item}
                    role="option"
                    aria-selected={active === idx}
                    className={`combo__item ${active === idx ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(item)}
                  >
                    {item}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
