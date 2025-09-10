import React, { useEffect, useMemo, useState } from "react";
import "../DOCSS/AdminPublicaciones.css";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";
const UPLOADS_HOST = "http://localhost:3000";

const CATEGORIAS = [
  "Todas",
  "Atractivos Naturales",
  "Atractivos Culturales",
  "Atractivos Recreativos",
  "Atractivos Gastronómicos",
  "Atractivos Arqueológicos",
  "Atractivos Históricos",
];

const PAGE_SIZE = 12;

const normNum = (v) =>
  v === null || v === undefined || v === "null" || v === "" ? null : Number(v);

const fmtPrecio = (it) => {
  const moneda = it.moneda || "COP";
  const d = normNum(it.precio_desde);
  const h = normNum(it.precio_hasta);
  const n = (x) => x.toLocaleString("es-CO", { maximumFractionDigits: 0 });
  if (d != null && h != null) return `${moneda} ${n(d)} – ${n(h)}`;
  if (d != null) return `${moneda} ${n(d)}+`;
  if (h != null) return `≤ ${moneda} ${n(h)}`;
  return "—";
};

const fmtHorario = (it) => {
  if (it.horario_desde && it.horario_hasta) {
    const d = String(it.horario_desde).slice(0, 5);
    const h = String(it.horario_hasta).slice(0, 5);
    return `${d} – ${h}`;
  }
  return "—";
};

const imgSrc = (u) => (u ? (u.startsWith("http") ? u : `${UPLOADS_HOST}${u}`) : null);

const AdminPublicaciones = () => {
    const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "ok", ms = 2600) => {
    setToast({ type, msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_URL}/api/perfiles`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudieron cargar las publicaciones");
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return items.filter((it) => {
      const okCat = cat === "Todas" ? true : it.categoria === cat;
      const okText = !text
        ? true
        : [it.nombre_lugar, it.descripcion, it.ciudad, it.direccion, it.info_precios, it.moneda]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(text));
      return okCat && okText;
    });
  }, [items, cat, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  useEffect(() => setPage(1), [cat, q]);

  const askDelete = (it) => {
    setConfirm({
      id: it.id,
      title: `Eliminar publicación #${it.id}`,
      msg: `¿Deseas eliminar “${it.nombre_lugar}”? Esta acción no se puede deshacer.`,
    });
  };

  const doDelete = async (id) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API_URL}/api/perfiles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar");
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast("Publicación eliminada", "ok");
    } catch (e) {
      showToast(e.message, "err");
    } finally {
      setDeletingId(null);
      setConfirm(null);
    }
  };

  return (
    <main className="ap-admin-pubs pe-root">
      {/* ENCABEZADO */}
      <header className="pe-header">
        <div className="pe-header__left">
          <span className="pe-logo" aria-hidden>📁</span>
          <div className="pe-header__right">
      <button
        className="btn btn-outline btn-back"
        onClick={() => navigate(-1)}
     >
       Volver      
    </button>
   </div>
          <div>
            <h1>Administrar publicaciones</h1>
            <p>Listado de lugares creados por las empresas</p>
          </div>
          
        </div>
      </header>
    
      {/* FILTROS */}
      <section className="card-3d" style={{ padding: 16, marginTop: 16 }}>
        <div className="pe-row" style={{ gap: 12, alignItems: "center" }}>
          <div className="field" style={{ minWidth: 220 }}>
            <label>Categoría</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ flex: 1 }}>
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nombre, descripción, ciudad, dirección..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="field" style={{ minWidth: 180 }}>
            <label>Totales</label>
            <div className="badge">
              {filtered.length} / {items.length}
            </div>
          </div>
        </div>
      </section>

      {/* LISTADO */}
      <section className="card-3d" style={{ marginTop: 16 }}>
        {loading ? (
          <div className="empty-state" style={{ padding: 32 }}>Cargando…</div>
        ) : err ? (
          <div className="msg-error" style={{ padding: 16 }}>⚠️ {err}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            No hay publicaciones que coincidan con los filtros.
          </div>
        ) : (
          <>
            <div className="pe-grid-list" style={{ padding: 12 }}>
              {pageSlice.map((it) => {
                const thumb = it.fotos?.[0]?.imagen_url ? imgSrc(it.fotos[0].imagen_url) : null;
                return (
                  <article key={it.id} className="pe-card item card-3d">
                    <div className="pe-card__media">
                      {thumb ? (
                        <img src={thumb} alt={it.nombre_lugar} />
                      ) : (
                        <div className="pe-card__placeholder">Sin imagen</div>
                      )}
                    </div>

                    <div className="pe-card__body">
                      <div className="pe-card__title">
                        <strong>#{it.id}</strong> · {it.nombre_lugar}
                      </div>
                      <div className="pe-card__meta">
                        <span className="chip">{it.categoria}</span>
                        <span className="chip">{it.ciudad || "—"}</span>
                      </div>

                      <div className="pe-card__row">
                        <small><b>Dirección:</b> {it.direccion || "—"}</small>
                      </div>
                      <div className="pe-card__row">
                        <small><b>Horario:</b> {fmtHorario(it)}</small>
                      </div>
                      <div className="pe-card__row">
                        <small><b>Precios:</b> {fmtPrecio(it)}</small>
                      </div>

                      <div className="pe-card__row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div className="avatar -sm">
                          {it.avatar_url ? (
                            <img src={imgSrc(it.avatar_url)} alt="empresa" />
                          ) : (
                            <span>🏢</span>
                          )}
                        </div>
                        <small style={{ opacity: 0.8 }}>
                          <b>Empresa ID:</b> {it.empresa_id}
                        </small>
                      </div>
                    </div>

                    <div className="pe-card__actions">
                      <button className="btn btn-light" onClick={() => setSelected(it)}>
                        Ver
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => askDelete(it)}
                        disabled={deletingId === it.id}
                        title="Eliminar publicación"
                      >
                        {deletingId === it.id ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ display: "flex", gap: 8, padding: 12, justifyContent: "center" }}>
                <button className="btn btn-light" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}>
                  ←
                </button>
                <div className="badge">Página {pageSafe} / {totalPages}</div>
                <button className="btn btn-light" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>
                  →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL DETALLE */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal card-3d" onClick={(e) => e.stopPropagation()}>
            <header className="modal__header">
              <h3>#{selected.id} · {selected.nombre_lugar}</h3>
              <button className="btn btn-light" onClick={() => setSelected(null)}>✕</button>
            </header>

            <div className="modal__body">
              <div className="pe-row" style={{ gap: 16 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div className="field">
                    <label>Categoría</label>
                    <div className="chip">{selected.categoria}</div>
                  </div>
                  <div className="field">
                    <label>Descripción</label>
                    <p style={{ whiteSpace: "pre-wrap" }}>{selected.descripcion || "—"}</p>
                  </div>
                  <div className="field">
                    <label>Ciudad</label>
                    <div>{selected.ciudad || "—"}</div>
                  </div>
                  <div className="field">
                    <label>Dirección</label>
                    <div>{selected.direccion || "—"}</div>
                  </div>
                  <div className="field">
                    <label>Coordenadas</label>
                    <div>{Number(selected.lat)?.toFixed(5)}, {Number(selected.lng)?.toFixed(5)}</div>
                  </div>
                  <div className="field">
                    <label>Horario</label>
                    <div>{fmtHorario(selected)}</div>
                  </div>
                  <div className="field">
                    <label>Precios</label>
                    <div>{fmtPrecio(selected)}</div>
                    {selected.info_precios && <small style={{ opacity: 0.8 }}>{selected.info_precios}</small>}
                  </div>
                  <div className="field">
                    <label>Empresa</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div className="avatar -sm">
                        {selected.avatar_url ? (
                          <img src={imgSrc(selected.avatar_url)} alt="empresa" />
                        ) : (
                          <span>🏢</span>
                        )}
                      </div>
                      <small>ID: {selected.empresa_id}</small>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 280 }}>
                  <label>Fotos ({selected.fotos?.length || 0})</label>
                  <div className="pe-gallery">
                    {(selected.fotos || []).map((f) => (
                      <div key={f.id} className="pe-thumb">
                        <img src={imgSrc(f.imagen_url)} alt={`foto-${f.id}`} />
                      </div>
                    ))}
                    {(selected.fotos || []).length === 0 && (
                      <div className="pe-card__placeholder">Sin fotos</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <footer className="modal__footer">
              <button className="btn btn-danger" onClick={() => askDelete(selected)} disabled={deletingId === selected.id}>
                Eliminar publicación
              </button>
              <button className="btn btn-light" onClick={() => setSelected(null)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN */}
      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="modal card-3d" onClick={(e) => e.stopPropagation()}>
            <header className="modal__header">
              <h3>{confirm.title}</h3>
            </header>
            <div className="modal__body">
              <p style={{ margin: 0 }}>{confirm.msg}</p>
            </div>
            <footer className="modal__footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-light" onClick={() => setConfirm(null)}>Cancelar</button>
              <button
                className="btn btn-danger"
                onClick={() => doDelete(confirm.id)}
                disabled={deletingId === confirm.id}
              >
                {deletingId === confirm.id ? "Eliminando…" : "Eliminar"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`ap-admin-pubs__toast ap-type-${toast.type}`}>{toast.msg}</div>}
    </main>
  );
};

export default AdminPublicaciones;
