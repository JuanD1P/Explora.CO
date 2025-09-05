/*----------------------VISTA INICIO EMPRESA----------------
VISTA PRINCIPAL DEL INICIO DE LA EMPRESA EN DONDE SE MUESTRAN PUBLICACIONES 
Y EVENTOS CREADOS X EL USUARIO---------------------------*/

import React from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import "../DOCSS/InicioEmpresa.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const UPLOADS_HOST = import.meta.env.VITE_UPLOADS_HOST || "http://localhost:3000";

/* ===== Helpers ===== */
const fadeUp = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };
const currency = (v, cur = "COP") =>
  v == null ? null : new Intl.NumberFormat("es-CO", { style: "currency", currency: cur }).format(Number(v));
const timeHHMM = (t) => (t ? String(t).slice(0, 5) : null);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }) : null);
const absUrl = (u) => (!u ? null : u.startsWith("http") ? u : `${UPLOADS_HOST}${u}`);

/* ===== API helpers ===== */
async function apiDeletePerfil(id) {
  const res = await fetch(`${API_BASE}/perfiles/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    let msg = "Error al eliminar";
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
async function apiDeleteEvento(id) {
  const res = await fetch(`${API_BASE}/eventos/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    let msg = "Error al eliminar";
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

const IconPlus = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden {...props}>
    <circle cx="24" cy="24" r="22" fill="currentColor" opacity=".1" />
    <path d="M24 14v20M14 24h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const InicioE = () => {
  const navigate = useNavigate();

  const empresaId = React.useMemo(() => {
    const v = Number(localStorage.getItem("user-id"));
    return Number.isFinite(v) ? v : null;
  }, []);


  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user-id") window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Publicaciones  */
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [detail, setDetail] = React.useState(null); 

  /* Eventos */
  const [eventos, setEventos] = React.useState([]);
  const [loadingEv, setLoadingEv] = React.useState(true);
  const [errorEv, setErrorEv] = React.useState("");
  const [detailEv, setDetailEv] = React.useState(null); 

  /* Cargar publicaciones  */
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (empresaId === null) {
          setItems([]);
          setError("Inicia sesión para ver tus publicaciones.");
          return;
        }
        const url = `${API_BASE}/perfiles?empresa_id=${empresaId}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("No se pudieron cargar las publicaciones");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setError("");
      } catch (e) {
        setError(e.message || "Error cargando publicaciones");
      } finally {
        setLoading(false);
      }
    })();
  }, [empresaId]);

  /* Cargar eventos  */
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingEv(true);
        if (empresaId === null) {
          setEventos([]);
          setErrorEv("Inicia sesión para ver tus eventos.");
          return;
        }
        const url = `${API_BASE}/eventos?empresa_id=${empresaId}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("No se pudieron cargar los eventos");
        const data = await res.json();
        setEventos(Array.isArray(data) ? data : []);
        setErrorEv("");
      } catch (e) {
        setErrorEv(e.message || "Error cargando eventos");
      } finally {
        setLoadingEv(false);
      }
    })();
  }, [empresaId]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDetail(null);
        setDetailEv(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onImgError = (e) => { e.currentTarget.src = imgDemo; e.currentTarget.onerror = null; };

  /* Handlers publicaciones */
  const handleEdit = (id) => navigate(`/PerfilEmpresa/${id}`); // tu form ya soporta :id
  const handleView = (p) => setDetail(p);
  const handleDelete = async (id) => {
    const ok = confirm("¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await apiDeletePerfil(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message || "No se pudo eliminar");
    }
  };

  /* Handlers eventos */
  const handleEditEv = (id) => navigate(`/EventosLugar/${id}`);
  const handleViewEv = async (evOrId) => {
    const id = typeof evOrId === "object" ? evOrId.id : evOrId;
    try {
      const res = await fetch(`${API_BASE}/eventos/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar el evento");
      setDetailEv(data); 
    } catch (e) {
      alert(e.message || "Error al cargar detalles");
    }
  };
  const handleDeleteEv = async (id) => {
    const ok = confirm("¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await apiDeleteEvento(id);
      setEventos((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message || "No se pudo eliminar");
    }
  };

  return (
    <main className="emp-root">
      {/* HEADER */}
      <header className="emp-header glass">
        <div className="emp-brand">
          <span className="emp-logo" aria-hidden>🏢</span>
          <strong>Panel de Empresa</strong>
        </div>
      </header>

      {/* HERO */}
      <section className="emp-hero card-3d">
        <motion.div
          className="emp-cta"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <button className="emp-create-btn" onClick={() => navigate("/PerfilEmpresa")}>
            <IconPlus className="emp-plus" />
            <span>Crear publicación</span>
          </button>
          <button className="emp-create-btn" onClick={() => navigate("/EventosLugar")}>
            <IconPlus className="emp-plus" />
            <span>Crear evento</span>
          </button>
        </motion.div>
      </section>

      {/* ====== PUBLICACIONES ====== */}
      <section className="emp-section emp-section--glass">
        <div className="emp-section__head">
          <h3>Mis publicaciones</h3>
          <p>Gestiona y mejora tu alcance</p>
        </div>

        {loading && <div style={{ padding: 12 }}>Cargando publicaciones…</div>}
        {error && !loading && <div style={{ padding: 12, color: "crimson" }}>{error}</div>}

        <div className="emp-grid">
          {!loading && !items.length && !error && (
            <div style={{ gridColumn: "1/-1", padding: 12 }}>No hay publicaciones aún.</div>
          )}

          {items.map((p) => {
            const img0 = absUrl(p?.fotos?.[0]?.imagen_url) || imgDemo;
            const title = p.nombre_lugar || p.titulo || "Publicación";
            const desc = p.descripcion || p.desc || "";
            const avatar = absUrl(p.avatar_url);

            return (
              <motion.article
                key={p.id}
                className="emp-card hover-raise"
                initial={{ y: 12, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="emp-card__media">
                  <img className="media-img" src={img0} onError={onImgError} alt={title} loading="lazy" />
                  {avatar ? (
                    <img className="emp-card__avatar" src={avatar} alt="Empresa" />
                  ) : (
                    <div className="emp-card__avatar emp-card__avatar--fallback">🏷️</div>
                  )}
                </div>

                <div className="emp-card__body">
                  <h4 className="emp-card__title">{title}</h4>
                  <p className="emp-card__desc">
                    {desc ? desc : <span style={{ opacity: 0.65 }}>Sin descripción</span>}
                  </p>
                </div>

                <footer className="emp-card__actions">
                  <button className="icon-btn" title="Editar" onClick={() => handleEdit(p.id)}>✏️</button>
                  <button className="icon-btn" title="Eliminar" onClick={() => handleDelete(p.id)}>🗑️</button>
                  <button className="icon-btn" title="Ver" onClick={() => setDetail(p)} aria-label={`Ver ${title}`}>👁️</button>
                </footer>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ====== EVENTOS ====== */}
      <section className="emp-section emp-section--glass">
        <div className="emp-section__head">
          <h3>Mis eventos</h3>
          <p>Administra y promociona tus actividades</p>
        </div>

        {loadingEv && <div style={{ padding: 12 }}>Cargando eventos…</div>}
        {errorEv && !loadingEv && <div style={{ padding: 12, color: "crimson" }}>{errorEv}</div>}

        <div className="emp-grid">
          {!loadingEv && !eventos.length && !errorEv && (
            <div style={{ gridColumn: "1/-1", padding: 12 }}>Aún no tienes eventos.</div>
          )}

        {eventos.map((ev) => {
          const img0 = absUrl(ev?.fotos?.[0]?.imagen_url) || imgDemo;
          const title = ev.titulo || ev.nombre_evento || ev.nombre || "Evento";
          const desc = ev.descripcion || ev.detalle || "";
          const avatar = absUrl(ev.avatar_url);

          const fIni = ev.fecha_inicio || ev.fecha_desde || ev.fecha || ev.inicio;
          const fFin = ev.fecha_fin || ev.fecha_hasta || ev.fin;
          const hIni = ev.hora_desde || ev.hora_inicio;
          const hFin = ev.hora_hasta || ev.hora_fin;

          return (
            <motion.article
              key={ev.id}
              className="emp-card hover-raise"
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="emp-card__media">
                <img className="media-img" src={img0} onError={onImgError} alt={title} loading="lazy" />
                {avatar ? (
                  <img className="emp-card__avatar" src={avatar} alt="Empresa" />
                ) : (
                  <div className="emp-card__avatar emp-card__avatar--fallback">🏷️</div>
                )}
              </div>

              <div className="emp-card__body">
                <h4 className="emp-card__title">{title}</h4>
                <p className="emp-card__desc">
                  {desc ? desc : <span style={{ opacity: .65 }}>Sin descripción</span>}
                </p>
                {(fIni || fFin || hIni || hFin) && (
                  <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                    {fmtDate(fIni)} {timeHHMM(hIni)} {(fFin || hFin) && "—"} {fmtDate(fFin)} {timeHHMM(hFin)}
                  </div>
                )}
              </div>

              <footer className="emp-card__actions">
                <button className="icon-btn" title="Editar" onClick={() => handleEditEv(ev.id)}>✏️</button>
                <button className="icon-btn" title="Eliminar" onClick={() => handleDeleteEv(ev.id)}>🗑️</button>
                <button className="icon-btn" title="Ver" onClick={() => handleViewEv(ev.id)} aria-label={`Ver ${title}`}>👁️</button>
              </footer>
            </motion.article>
          );
        })}
        </div>
      </section>

      {/* MODAL DETALLES PUBLICACIÓN */}
      {detail && (
        <div className="emp-modal__backdrop" onClick={() => setDetail(null)} role="dialog" aria-modal="true">
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal__media">
              <img
                className="media-img"
                src={absUrl(detail?.fotos?.[0]?.imagen_url) || imgDemo}
                alt={detail.nombre_lugar}
                onError={onImgError}
              />
              {detail.avatar_url ? (
                <img className="emp-modal__avatar" src={absUrl(detail.avatar_url)} alt="Empresa" />
              ) : (
                <div className="emp-modal__avatar emp-card__avatar--fallback">🏷️</div>
              )}
            </div>

            <div className="emp-modal__body">
              <h3 style={{ margin: "0 0 6px" }}>{detail.nombre_lugar}</h3>
              <div style={{ color: "#6b7280", marginBottom: 10 }}>
                {detail.categoria} — {detail.ciudad}
              </div>

              {(detail.horario_desde || detail.horario_hasta) && (
                <div className="emp-detail-row">
                  <span className="emp-detail-label">Horario</span>
                  <span className="emp-detail-value">
                    {timeHHMM(detail.horario_desde)} – {timeHHMM(detail.horario_hasta)}
                  </span>
                </div>
              )}

              {(detail.precio_desde != null || detail.precio_hasta != null || detail.info_precios) && (
                <>
                  <div className="emp-detail-row">
                    <span className="emp-detail-label">Precios</span>
                    <span className="emp-detail-value">
                      {currency(detail.precio_desde, detail.moneda) || "—"} {" – "}
                      {currency(detail.precio_hasta, detail.moneda) || "—"}
                    </span>
                  </div>
                  {detail.info_precios && (
                    <div className="emp-detail-row">
                      <span className="emp-detail-label">Detalle</span>
                      <span className="emp-detail-value">{detail.info_precios}</span>
                    </div>
                  )}
                </>
              )}

              {detail.descripcion && (
                <div className="emp-detail-row">
                  <span className="emp-detail-label">Descripción</span>
                  <span className="emp-detail-value">{detail.descripcion}</span>
                </div>
              )}

              <div className="emp-modal__actions">
                <button className="emp-create-btn" onClick={() => setDetail(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES EVENTO */}
      {detailEv && (
        <div className="emp-modal__backdrop" onClick={() => setDetailEv(null)} role="dialog" aria-modal="true">
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal__media">
              <img
                className="media-img"
                src={absUrl(detailEv?.fotos?.[0]?.imagen_url) || imgDemo}
                alt={detailEv.titulo || detailEv.nombre_evento || "Evento"}
                onError={onImgError}
              />
              {detailEv.avatar_url ? (
                <img className="emp-modal__avatar" src={absUrl(detailEv.avatar_url)} alt="Empresa" />
              ) : (
                <div className="emp-modal__avatar emp-card__avatar--fallback">🏷️</div>
              )}
            </div>

            <div className="emp-modal__body">
              <h3 style={{ margin: "0 0 6px" }}>
                {detailEv.titulo || detailEv.nombre_evento || "Evento"}
              </h3>

              {(detailEv.nombre_lugar || detailEv.ciudad) && (
                <div style={{ color: "#6b7280", marginBottom: 10 }}>
                  {[detailEv.nombre_lugar, detailEv.ciudad].filter(Boolean).join(" — ")}
                </div>
              )}

              {(detailEv.fecha_inicio || detailEv.fecha_desde || detailEv.fecha || detailEv.inicio ||
                detailEv.fecha_fin || detailEv.fecha_hasta || detailEv.fin ||
                detailEv.hora_desde || detailEv.hora_inicio || detailEv.hora_hasta || detailEv.hora_fin) && (
                <div className="emp-detail-row">
                  <span className="emp-detail-label">Fecha y hora</span>
                  <span className="emp-detail-value">
                    {fmtDate(detailEv.fecha_inicio || detailEv.fecha_desde || detailEv.fecha || detailEv.inicio)} {timeHHMM(detailEv.hora_desde || detailEv.hora_inicio)}
                    {" — "}
                    {fmtDate(detailEv.fecha_fin || detailEv.fecha_hasta || detailEv.fin)} {timeHHMM(detailEv.hora_hasta || detailEv.hora_fin)}
                  </span>
                </div>
              )}

              {(detailEv.precio_desde != null || detailEv.precio_hasta != null || detailEv.info_precios) && (
                <>
                  <div className="emp-detail-row">
                    <span className="emp-detail-label">Precios</span>
                    <span className="emp-detail-value">
                      {currency(detailEv.precio_desde, detailEv.moneda) || "—"} {" – "}
                      {currency(detailEv.precio_hasta, detailEv.moneda) || "—"}
                    </span>
                  </div>
                  {detailEv.info_precios && (
                    <div className="emp-detail-row">
                      <span className="emp-detail-label">Detalle</span>
                      <span className="emp-detail-value">{detailEv.info_precios}</span>
                    </div>
                  )}
                </>
              )}

              {detailEv.descripcion && (
                <div className="emp-detail-row">
                  <span className="emp-detail-label">Descripción</span>
                  <span className="emp-detail-value">{detailEv.descripcion}</span>
                </div>
              )}

              <div className="emp-modal__actions">
                <button className="emp-create-btn" onClick={() => setDetailEv(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="emp-footer">
        <small>© {new Date().getFullYear()} Tu Empresa — Panel</small>
      </footer>
    </main>
  );
};

export default InicioE;
