import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "../DOCSS/PublicacionDetalle.css";

const API_URL = "http://localhost:3000";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ===== Helpers de formato ===== */
const nfMoney = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const hhmm = (t) => (t ? String(t).slice(0, 5) : "—");
const fmtMoney = (v, cur = "COP") => {
  if (v === null || v === undefined || v === "") return "—";
  try { return new Intl.NumberFormat("es-CO", { style: "currency", currency: cur }).format(Number(v)); }
  catch { return nfMoney.format(Number(v)); }
};
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("es-CO");
};
const timeHHMM = (t) => (t ? String(t).slice(0, 5) : "");

/* ===== Estrellas (UI) ===== */
function Stars({ value = 0, outOf = 5, size = "md" }) {
  const whole = Math.floor(value);
  const frac = value - whole;
  const half = frac >= 0.25 && frac < 0.75;
  const cls = `star star-${size}`;
  return (
    <div className="stars" aria-label={`Calificación ${value} de ${outOf}`}>
      {Array.from({ length: outOf }).map((_, i) => {
        const state = i < whole ? "full" : half && i === whole ? "half" : "empty";
        return <span key={i} className={`${cls} is-${state}`} aria-hidden="true">★</span>;
      })}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Selecciona calificación">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value >= n}
          className={`star star-lg ${value >= n ? "is-full" : "is-empty"}`}
          onClick={() => onChange(n)}
          title={`${n} estrellas`}
          style={{ cursor: "pointer", background: "transparent", border: 0, padding: 2 }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PublicacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ===== Publicación ===== */
  const [loading, setLoading] = useState(true);
  const [pub, setPub] = useState(null);
  const [tab, setTab] = useState("resumen");

  /* Carrusel */
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/api/perfiles/${id}`, { credentials: "include" });
        if (!r.ok) throw new Error("No se pudo cargar la publicación");
        const data = await r.json();
        if (alive) setPub(data);
      } catch (e) {
        console.error(e);
        if (alive) setPub(null);
      } finally { alive && setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  const fotos = Array.isArray(pub?.fotos) ? pub.fotos : [];
  const portada = fotos[0]?.imagen_url
    ? (/^https?:\/\//i.test(fotos[0].imagen_url) ? fotos[0].imagen_url : `${API_URL}${fotos[0].imagen_url}`)
    : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(pub?.nombre_lugar || "publicacion")}`;
  const slides = fotos.length
    ? fotos.map(f => (/^https?:\/\//i.test(f.imagen_url) ? f.imagen_url : `${API_URL}${f.imagen_url}`))
    : [portada];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => { if (!hoverRef.current) setIdx(i => (i + 1) % slides.length); }, 4200);
    return () => clearInterval(t);
  }, [slides.length]);

  /* Ubicación (solo para mapa y “Cómo llegar”) */
  const hasCoords = Number.isFinite(Number(pub?.lat)) && Number.isFinite(Number(pub?.lng));
  const center = useMemo(() => {
    const lat = Number(pub?.lat) || 4.711;
    const lng = Number(pub?.lng) || -74.0721;
    return [lat, lng];
  }, [pub]);

  /* ===== Eventos (reales del perfil) ===== */
  const perfilId = Number(id);
  const [evLoading, setEvLoading] = useState(true);
  const [evError, setEvError] = useState(null);
  const [eventos, setEventos] = useState([]);

  const firstEventPhoto = (ev) => {
    const u = ev?.fotos?.[0]?.imagen_url;
    if (!u) {
      const name = ev?.titulo || ev?.nombre_evento || "evento";
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`;
    }
    return /^https?:\/\//i.test(u) ? u : `${API_URL}${u}`;
  };

  useEffect(() => {
    if (!perfilId) return;
    let alive = true;
    (async () => {
      setEvLoading(true);
      setEvError(null);
      try {
        const url = `${API_URL}/api/eventos?perfil_id=${encodeURIComponent(perfilId)}`;
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) throw new Error("No se pudieron cargar los eventos");
        const data = await r.json();
        if (alive) setEventos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (alive) {
          setEventos([]);
          setEvError(e.message || "Error cargando eventos");
        }
      } finally {
        alive && setEvLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [perfilId]);

  /* ===== Valoraciones ===== */
  const userId = Number(localStorage.getItem("user-id") || 0);

  const [ratLoading, setRatLoading] = useState(true);
  const [ratError, setRatError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [summary, setSummary] = useState({ total: 0, promedio: 0, dist: { 5:0, 4:0, 3:0, 2:0, 1:0 } });
  const [reviews, setReviews] = useState([]);

  const my = useMemo(() => reviews.find(r => Number(r.usuario_id) === userId) || null, [reviews, userId]);

  const [form, setForm] = useState({ estrellas: 5, comentario: "" });
  useEffect(() => {
    if (my) setForm({ estrellas: Number(my.estrellas), comentario: my.comentario || "" });
    else setForm({ estrellas: 5, comentario: "" });
  }, [my]);

  const [toast, setToast] = useState(null);
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  const [editMode, setEditMode] = useState(false);
  useEffect(() => { if (my) setEditMode(false); }, [my?.id]);

  const orderedReviews = useMemo(() => {
    if (!reviews?.length) return [];
    const mine = my ? [my] : [];
    const others = reviews.filter(r => Number(r.usuario_id) !== userId);
    return [...mine, ...others];
  }, [reviews, my, userId]);

  async function fetchRatings() {
    setRatError(null);
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`${API_URL}/api/valoraciones/summary?perfil_id=${perfilId}`),
        fetch(`${API_URL}/api/valoraciones?perfil_id=${perfilId}`)
      ]);
      if (!sRes.ok) throw new Error("No se pudo obtener el resumen");
      if (!lRes.ok) throw new Error("No se pudieron obtener las valoraciones");

      const sData = await sRes.json();
      const lData = await lRes.json();

      setSummary({
        total: Number(sData.total || 0),
        promedio: Number(sData.promedio || 0),
        dist: {
          5: Number(sData?.dist?.[5] || 0),
          4: Number(sData?.dist?.[4] || 0),
          3: Number(sData?.dist?.[3] || 0),
          2: Number(sData?.dist?.[2] || 0),
          1: Number(sData?.dist?.[1] || 0),
        }
      });
      setReviews(Array.isArray(lData) ? lData : []);
    } catch (e) {
      console.error(e);
      setRatError(e.message || "Error cargando valoraciones");
    }
  }

  useEffect(() => {
    if (!perfilId) return;
    setRatLoading(true);
    fetchRatings().finally(() => setRatLoading(false));
  }, [perfilId]);

  async function handleSubmitReview(e) {
    e?.preventDefault?.();
    if (!userId) { alert("Debes iniciar sesión para opinar"); return; }

    const payload = {
      perfil_id: perfilId,
      usuario_id: userId,
      estrellas: Number(form.estrellas),
      comentario: form.comentario?.trim() || null
    };

    try {
      setIsSaving(true);

      if (my) {
        setReviews(cur => cur.map(r => r.id === my.id ? { ...r, ...payload, updated_at: new Date().toISOString() } : r));
      } else {
        const tempId = `temp-${Date.now()}`;
        setReviews(cur => [{ id: tempId, ...payload, created_at: new Date().toISOString(), nombre_completo: "Tú" }, ...cur]);
      }

      const res = await fetch(`${API_URL}/api/valoraciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        await fetchRatings();
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudo guardar tu valoración");
      }

      showToast(my ? "✅ Opinión actualizada" : "✅ Opinión publicada");
      setEditMode(false);
      await fetchRatings();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteReview(idReview) {
    if (!userId) return;
    const ok = confirm("¿Eliminar tu opinión? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      setIsDeleting(true);
      const prev = reviews;
      setReviews(cur => cur.filter(r => r.id !== idReview));

      const res = await fetch(`${API_URL}/api/valoraciones/${idReview}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: userId })
      });
      if (!res.ok) {
        setReviews(prev);
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudo eliminar tu valoración");
      }
      showToast("🗑️ Opinión eliminada");
      await fetchRatings();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setIsDeleting(false);
    }
  }

  const maxBar = useMemo(() => {
    const vals = Object.values(summary.dist || {});
    return vals.length ? Math.max(...vals) : 0;
  }, [summary]);

  /* ===== Lightbox handlers ===== */
  const openLightbox = (i) => { setIdx(i); setLightboxOpen(true); };
  useEffect(() => {
    const onKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, slides.length]);

  return (
    <main className="pubk-root" aria-busy={loading ? "true" : "false"}>
      <div className="pubk-container">

        {/* ENCABEZADO */}
        <header className="pubk-head">
          <div className="pubk-head-left">
            <h1 className="pubk-title">{pub?.nombre_lugar || "—"}</h1>
            <div className="pubk-chips">
              <span className="pubk-chip">{pub?.categoria || "—"}</span>
              {pub?.ciudad && <span className="pubk-chip ghost">{pub?.ciudad}</span>}
            </div>
          </div>

          <button className="pubk-btn-back" onClick={() => navigate(-1)} aria-label="Volver" title="Volver">
            <span className="pubk-back-ico">↩</span> Volver
          </button>
        </header>

        {/* VISTAS */}
        <nav className="pubk-views" role="tablist" aria-label="Vistas">
          {[
            { id: "resumen", label: "Resumen" },
            { id: "ubicacion", label: "Ubicación" },
            { id: "precios", label: "Precios" },
          ].map(t => (
            <button
              key={t.id}
              className={`pubk-view ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* BLOQUE PRINCIPAL */}
        <section className="pubk-main">
          {/* Carrusel mejorado */}
          <div
            className="pubk-carousel"
            onMouseEnter={() => (hoverRef.current = true)}
            onMouseLeave={() => (hoverRef.current = false)}
          >
            <button className="pubk-carr-arrow is-left" onClick={() => setIdx(i => (i - 1 + slides.length) % slides.length)} aria-label="Anterior">‹</button>
            <div className="pubk-carr-box" role="region" aria-label="Galería destacada">
              {slides.map((src, i) => (
                <button
                  key={i}
                  className={`pubk-carr-slide ${i === idx ? "is-active" : ""}`}
                  aria-hidden={i !== idx}
                  onClick={() => openLightbox(i)}
                  title="Ampliar imagen"
                >
                  <img
                    src={src}
                    alt={pub?.nombre_lugar || "imagen destacada"}
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(pub?.nombre_lugar || "publicacion")}`; }}
                  />
                </button>
              ))}
            </div>
            <button className="pubk-carr-arrow is-right" onClick={() => setIdx(i => (i + 1) % slides.length)} aria-label="Siguiente">›</button>
            {slides.length > 1 && (
              <div className="pubk-carr-dots">
                {slides.map((_, i) => (
                  <button key={i} className={`pubk-dot ${i === idx ? "is-active" : ""}`} onClick={() => setIdx(i)} aria-label={`Ir a imagen ${i + 1}`} />
                ))}
              </div>
            )}
          </div>

          {/* Lado derecho con tarjetas limpias */}
          <aside className="pubk-side">
            <div className="pubk-side-content">
              {loading && <div className="pubk-empty">Cargando…</div>}
              {!loading && !pub && <div className="pubk-empty">No se encontró la publicación.</div>}

              {!loading && pub && (
                <>
                  {tab === "resumen" && (
                    <div className="pubk-card">
                      <dl className="pubk-kv">
                        <div className="pubk-kv-row"><dt>Dirección</dt><dd>{pub?.direccion || "—"}</dd></div>
                        {pub?.descripcion && (
                          <div className="pubk-kv-row pubk-row-multi"><dt>Descripción</dt><dd>{pub.descripcion}</dd></div>
                        )}
                        <div className="pubk-kv-row"><dt>Creado</dt><dd>{pub?.created_at ? new Date(pub.created_at).toLocaleString("es-CO") : "—"}</dd></div>
                        <div className="pubk-kv-row"><dt>Actualizado</dt><dd>{pub?.updated_at ? new Date(pub.updated_at).toLocaleString("es-CO") : "—"}</dd></div>
                      </dl>
                    </div>
                  )}

                  {tab === "ubicacion" && (
                    <div className="pubk-card">
                      <div className="pubk-loc-top">
                        {hasCoords ? (
                          <a className="pubk-link" href={`https://www.google.com/maps?q=${encodeURIComponent(pub.lat + "," + pub.lng)}`} target="_blank" rel="noreferrer">
                            ¿Cómo llegar? Abrir en Google Maps
                          </a>
                        ) : (
                          <span className="pubk-link muted">Ubicación no disponible</span>
                        )}
                      </div>
                      <div className="pubk-map">
                        {hasCoords ? (
                          <MapContainer center={center} zoom={13} style={{ width: "100%", height: 260 }}>
                            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={center}>
                              <Popup><b>{pub?.nombre_lugar}</b><div style={{ maxWidth: 220, marginTop: 6 }}>{pub?.direccion || pub?.ciudad}</div></Popup>
                            </Marker>
                          </MapContainer>
                        ) : <div className="pubk-empty">Sin mapa disponible</div>}
                      </div>
                    </div>
                  )}

                  {tab === "precios" && (
                    <div className="pubk-card">
                      <div className="pubk-two">
                        <div className="pubk-block">
                          <h3 className="pubk-h3">Horarios</h3>
                          <div className="pubk-rows">
                            <div><span>Desde</span><strong>{hhmm(pub?.horario_desde)}</strong></div>
                            <div><span>Hasta</span><strong>{hhmm(pub?.horario_hasta)}</strong></div>
                          </div>
                        </div>
                        <div className="pubk-block">
                          <h3 className="pubk-h3">Precios</h3>
                          <div className="pubk-rows">
                            <div><span>Moneda</span><strong>{pub?.moneda || "COP"}</strong></div>
                            <div><span>Desde</span><strong>{fmtMoney(pub?.precio_desde, pub?.moneda)}</strong></div>
                            <div><span>Hasta</span><strong>{fmtMoney(pub?.precio_hasta, pub?.moneda)}</strong></div>
                            {pub?.info_precios && <div className="pubk-row-full"><span>Detalle</span><strong>{pub.info_precios}</strong></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </section>

        {/* ===================== EVENTOS (reales) ===================== */}
        <section className="pubk-section" aria-labelledby="sec-eventos">
          <div className="pubk-sec-head">
            <h2 id="sec-eventos" className="pubk-sec-title">Eventos</h2>
            <span className="pubk-sec-sub">{evLoading ? "Cargando…" : `${eventos.length} evento(s)`}</span>
          </div>

          {evError && <div className="pubk-empty">⚠️ {evError}</div>}

          {!evLoading && !evError && eventos.length === 0 && (
            <div className="pubk-empty">Aún no hay eventos para este lugar.</div>
          )}

          <div className="pubk-events-grid">
            {eventos.map(ev => {
              const title = ev.titulo || ev.nombre_evento || ev.nombre || "Evento";
              const fIni = ev.fecha_inicio || ev.fecha_desde || ev.fecha || ev.inicio;
              const fFin = ev.fecha_fin || ev.fecha_hasta || ev.fin;
              const hIni = ev.hora_desde || ev.hora_inicio;
              const hFin = ev.hora_hasta || ev.hora_fin;

              return (
                <article key={ev.id} className="event-card">
                  <div className="event-media">
                    <img
                      src={firstEventPhoto(ev)}
                      alt={title}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}`;
                      }}
                    />
                  </div>
                  <div className="event-body">
                    <h3 className="event-title">{title}</h3>

                    {(fIni || fFin || hIni || hFin) && (
                      <div className="event-meta">
                        <span className="event-date" aria-label="Fecha del evento">
                          {fmtDate(fIni)} {timeHHMM(hIni)} {(fFin || hFin) && "—"} {fmtDate(fFin)} {timeHHMM(hFin)}
                        </span>
                      </div>
                    )}

                    {ev.descripcion && <p className="event-desc">{ev.descripcion}</p>}

                    {(ev.precio_desde != null || ev.precio_hasta != null) && (
                      <div className="event-prices">
                        <span className="k">Precios:</span>{" "}
                        <strong>{fmtMoney(ev.precio_desde, ev.moneda)} – {fmtMoney(ev.precio_hasta, ev.moneda)}</strong>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===================== VALORACIONES ===================== */}
        <section className="pubk-section" aria-labelledby="sec-valoraciones">
          <div className="pubk-sec-head">
            <h2 id="sec-valoraciones" className="pubk-sec-title">Valoraciones</h2>
          </div>

          {ratLoading && <div className="pubk-empty">Cargando valoraciones…</div>}
          {ratError && <div className="pubk-empty">⚠️ {ratError}</div>}

          {!ratLoading && !ratError && (
            <>
              {/* Resumen */}
              <div className="rating-god" style={{ marginBottom: 16 }}>
                <div className="rating-main">
                  <div className="rating-number">{Number(summary.promedio || 0).toFixed(1)}</div>
                  <Stars value={Number(summary.promedio || 0)} size="xl" />
                  <div className="rating-count">{summary.total} opiniones</div>
                </div>

                <div className="rating-bars">
                  {[5,4,3,2,1].map(n => {
                    const val = summary?.dist?.[n] ?? 0;
                    const pct = maxBar ? (val / maxBar) * 100 : 0;
                    return (
                      <div key={n} className={`bar-row bar-${n}`}>
                        <span className="bar-label">{n}★</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="bar-val">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mi reseña */}
              <div className="pubk-card my-review-card" style={{ marginBottom: 12 }}>
                {!userId ? (
                  <div className="pubk-empty">Para opinar debes iniciar sesión.</div>
                ) : (!my || editMode) ? (

                  <form onSubmit={handleSubmitReview} className={`my-review-form ${editMode ? "is-edit" : ""}`} style={{ display: "grid", gap: 10 }}>
                    <div className="form-title">
                      <h3 className="pubk-h3">{my ? "Editar tu opinión" : "Escribe una opinión"}</h3>
                      {my && (
                        <button type="button" className="link-cancel" onClick={() => setEditMode(false)} aria-label="Cancelar edición">Cancelar</button>
                      )}
                    </div>
                    <div className="score-row">
                      <StarPicker value={form.estrellas} onChange={(n) => setForm(f => ({ ...f, estrellas: n }))} />
                      <span className="score-val">{form.estrellas} / 5</span>
                    </div>
                    <textarea
                      value={form.comentario}
                      onChange={(e) => setForm(f => ({ ...f, comentario: e.target.value }))}
                      placeholder="Cuéntanos tu experiencia (opcional)"
                      rows={3}
                      className="field-area"
                    />
                    <div className="actions-row">
                      <button type="submit" className="pubk-btn-review" disabled={isSaving}>
                        {my ? (isSaving ? "Guardando..." : "💾 Guardar cambios") : (isSaving ? "Publicando..." : "✍️ Publicar opinión")}
                      </button>
                      {my && (
                        <button type="button" className="pubk-btn-outline danger" onClick={() => handleDeleteReview(my.id)} disabled={isDeleting}>
                          {isDeleting ? "Eliminando..." : "🗑️ Eliminar"}
                        </button>
                      )}
                    </div>
                  </form>
                ) : (

                  <div className="my-review-view">
                    <div className="my-review-head">
                      <div className="pill-you" aria-label="Tu reseña">Tú</div>
                      <span className="review-when">
                        {new Date(my.updated_at || my.created_at).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <div className="my-review-score">
                      <Stars value={Number(my.estrellas)} size="md" />
                      <span className="my-review-stars">{my.estrellas} / 5</span>
                    </div>
                    {my.comentario && <p className="my-review-text">{my.comentario}</p>}
                    <div className="my-review-actions">
                      <button type="button" className="pubk-btn-outline" onClick={() => setEditMode(true)}>✏️ Editar</button>
                      <button type="button" className="pubk-btn-outline danger" onClick={() => handleDeleteReview(my.id)} disabled={isDeleting}>
                        {isDeleting ? "Eliminando..." : "🗑️ Eliminar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de opiniones */}
              <div className="reviews">
                {orderedReviews.length === 0 && (
                  <div className="pubk-empty">Aún no hay opiniones para esta publicación.</div>
                )}

                {orderedReviews.map(op => (
                  <article key={op.id} className={`review-card ${Number(op.usuario_id) === userId ? "is-mine" : ""}`}>
                    <div className="review-avatar">
                      <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(op.nombre_completo || `u-${op.usuario_id}`)}`}
                        alt={op.nombre_completo || "Usuario"}
                      />
                    </div>
                    <div className="review-body">
                      <header className="review-head">
                        <h3 className="review-author">
                          {Number(op.usuario_id) === userId ? "Tú" : (op.nombre_completo || "Usuario")}
                        </h3>
                        <span className="review-when">
                          {new Date(op.updated_at || op.created_at).toLocaleDateString("es-CO")}
                        </span>
                      </header>
                      <Stars value={Number(op.estrellas)} />
                      {op.comentario && <p className="review-text">{op.comentario}</p>}
                    </div>
                  </article>
                ))}
              </div>

              {/* Toast */}
              {toast && <div className="toast-pop" role="status" aria-live="polite">{toast}</div>}
            </>
          )}
        </section>
      </div>

      {/* ==== LIGHTBOX (pantalla completa) ==== */}
      {lightboxOpen && (
        <div className="lb-backdrop" onClick={() => setLightboxOpen(false)} role="dialog" aria-modal="true">
          <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lb-close" onClick={() => setLightboxOpen(false)} aria-label="Cerrar">✕</button>
            <button className="lb-nav left" onClick={() => setIdx(i => (i - 1 + slides.length) % slides.length)} aria-label="Anterior">‹</button>
            <div className="lb-stage">
              <img src={slides[idx]} alt={`imagen ${idx + 1}`} />
            </div>
            <button className="lb-nav right" onClick={() => setIdx(i => (i + 1) % slides.length)} aria-label="Siguiente">›</button>
            {slides.length > 1 && (
              <div className="lb-dots">
                {slides.map((_, i) => (
                  <button key={i} className={`lb-dot ${i === idx ? "is-active" : ""}`} onClick={() => setIdx(i)} aria-label={`Ir a imagen ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
