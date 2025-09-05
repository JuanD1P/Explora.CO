/* ./components/DepartmentCombo.jsx */
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function DepartmentCombo({
  items = [],
  value,
  onChange,
  onEnter,
  placeholder = "Departamento",
  storageKey = "explora_recent_departments",
  id = "deptoCombo"
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState([]);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const recentsRef = useRef(null);
  const resultsRef = useRef(null);

  // Cargar recientes
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
  const pool = hasRecents ? [...recents, ...filtered] : filtered;

  // Cerrar por click afuera y escape global
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

  // Atajo Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") ||
          (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choose = (item) => {
    if (!item) return;
    setQ(item);
    onChange?.(item);
    setOpen(false);
    onEnter?.(item);

    try {
      const next = [item, ...(recents || [])]
        .filter((x, i, arr) => arr.indexOf(x) === i)
        .slice(0, 6);
      setRecents(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const clearInput = () => {
    setQ("");
    onChange?.("");
    setActive(0);
    setOpen(true);
    inputRef.current?.focus({ preventScroll: true });
  };

  const clearRecents = () => {
    setRecents([]);
    try { localStorage.removeItem(storageKey); } catch {}
  };

  const scrollIntoView = (idx) => {
    const inRecents = hasRecents && idx < recents.length;
    const container = inRecents ? recentsRef.current : resultsRef.current;
    const childIdx = inRecents ? idx : (hasRecents ? idx - recents.length : idx);
    const el = container?.children?.[childIdx];
    el?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(i => {
        const next = Math.min(i + 1, pool.length - 1);
        requestAnimationFrame(() => scrollIntoView(next));
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(i => {
        const next = Math.max(i - 1, 0);
        requestAnimationFrame(() => scrollIntoView(next));
        return next;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
      requestAnimationFrame(() => scrollIntoView(0));
    } else if (e.key === "End") {
      e.preventDefault();
      const last = pool.length - 1;
      setActive(last);
      requestAnimationFrame(() => scrollIntoView(last));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(pool[active] || q);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const comboId = `${id}-listbox`;
  const activeId = pool[active] ? `${id}-opt-${active}` : undefined;

  // Resalta coincidencias
  const renderLabel = (item) => {
    const s = q.trim();
    if (!s) return item;
    const i = item.toLowerCase().indexOf(s.toLowerCase());
    if (i < 0) return item;
    return (
      <>
        {item.slice(0, i)}
        <mark className="combo__mark">{item.slice(i, i + s.length)}</mark>
        {item.slice(i + s.length)}
      </>
    );
  };

  return (
    <div className="combo" ref={wrapRef}>
      <label className="sr-only" htmlFor={`${id}-input`}>Departamento</label>

      <div className={`combo__control ${open ? "is-open" : ""}`}>
        <input
          id={`${id}-input`}
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
          aria-controls={comboId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
        />
        {q && (
          <button className="combo__clear" onClick={clearInput} type="button" aria-label="Limpiar">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        )}
        <button
          type="button"
          className="combo__arrow"
          onClick={() => { setOpen(v => !v); inputRef.current?.focus({ preventScroll: true }); }}
          aria-label="Abrir lista"
          aria-haspopup="listbox"
          aria-controls={comboId}
          aria-expanded={open}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {open && (
        <div className="combo__panel" role="listbox" id={comboId}>
          {hasRecents && (
            <>
              <div className="combo__sectionTitle">
                Recientes
                <button type="button" className="combo__tiny" onClick={clearRecents} aria-label="Limpiar recientes">Limpiar</button>
              </div>
              <ul ref={recentsRef} className="combo__list">
                {recents.map((item, i) => {
                  const idx = i; // virtual
                  return (
                    <li
                      id={`${id}-opt-${idx}`}
                      key={`r-${item}`}
                      role="option"
                      aria-selected={active === idx}
                      className={`combo__item ${active === idx ? "is-active" : ""}`}
                      onMouseEnter={() => setActive(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(item)}
                    >
                      {renderLabel(item)}
                    </li>
                  );
                })}
              </ul>
              <div className="combo__divider" />
            </>
          )}

          <div className="combo__sectionTitle">Departamentos</div>
          {filtered.length === 0 ? (
            <div className="combo__empty">Sin resultados</div>
          ) : (
            <ul ref={resultsRef} className="combo__list">
              {filtered.map((item, i) => {
                const idx = (hasRecents ? recents.length : 0) + i;
                return (
                  <li
                    id={`${id}-opt-${idx}`}
                    key={item}
                    role="option"
                    aria-selected={active === idx}
                    className={`combo__item ${active === idx ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(item)}
                  >
                    {renderLabel(item)}
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
