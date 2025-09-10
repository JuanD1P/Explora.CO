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

const nfMoney = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const hhmm = (t) => (t ? String(t).slice(0, 5) : "—");
const fmtMoney = (v, cur = "COP") => {
  if (v === null || v === undefined || v === "") return "—";
  try { return new Intl.NumberFormat("es-CO", { style: "currency", currency: cur }).format(Number(v)); }
  catch { return nfMoney.format(Number(v)); }
};


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

  const [loading, setLoading] = useState(true);
  const [pub, setPub] = useState(null);
  const [tab, setTab] = useState("resumen");
  const [idx, setIdx] = useState(0);
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
    ? `${API_URL}${fotos[0].imagen_url}`
    : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(pub?.nombre_lugar || "publicacion")}`;
  const slides = fotos.length ? fotos.map(f => `${API_URL}${f.imagen_url}`) : [portada];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => { if (!hoverRef.current) setIdx(i => (i + 1) % slides.length); }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  const hasCoords = Number.isFinite(Number(pub?.lat)) && Number.isFinite(Number(pub?.lng));
  const center = useMemo(() => {
    const lat = Number(pub?.lat) || 4.711;
    const lng = Number(pub?.lng) || -74.0721;
    return [lat, lng];
  }, [pub]);


  const mockEventos = useMemo(() => ([
    { id: "e1", nombre: "Festival del Cacao Artesanal", fecha: "21/09/2025", descripcion: "Talleres y catas de chocolate.", imagen: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=800&auto=format&fit=crop" },
    { id: "e2", nombre: "Música al Parque", fecha: "04/10/2025", descripcion: "Conciertos al aire libre.", imagen: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop" },
    { id: "e3", nombre: "Feria de Emprendedores", fecha: "19/10/2025", descripcion: "Marcas locales y gastronomía.", imagen: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=800&auto=format&fit=crop" }
  ]), []);


  const perfilId = Number(id);
  const userId = Number(localStorage.getItem("user-id") || 0);

  const [ratLoading, setRatLoading] = useState(true);   // solo para cargas/fetch, NO para guardar
  const [ratError, setRatError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);      // evitar parpadeo negro al guardar
  const [isDeleting, setIsDeleting] = useState(false);  // idem al eliminar

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

  // eliminar (optimista)
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

  return (
    <main className="pubk-root" aria-busy={loading ? "true" : "false"}>
      <div className="pubk-container">

        {/* ENCABEZADO */}
        <header className="pubk-head">
          <div className="pubk-head-left">
            <h1 className="pubk-title">{pub?.nombre_lugar || "—"}</h1>
            <div className="pubk-chips">
              <span className="pubk-chip">{pub?.categoria || "—"}</span>
              <span className="pubk-chip">{pub?.ciudad || "—"}</span>
            </div>
          </div>

          <button className="pubk-btn-back" onClick={() => navigate(-1)} aria-label="Volver" title="Volver">
            <span className="pubk-back-ico">↩</span> Volver
          </button>
        </header>

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
          <div
            className="pubk-carousel"
            onMouseEnter={() => (hoverRef.current = true)}
            onMouseLeave={() => (hoverRef.current = false)}
          >
            <button className="pubk-carr-arrow is-left" onClick={() => setIdx(i => (i - 1 + slides.length) % slides.length)} aria-label="Anterior">‹</button>
            <div className="pubk-carr-box" role="region" aria-label="Galería destacada">
              {slides.map((src, i) => (
                <div key={i} className={`pubk-carr-slide ${i === idx ? "is-active" : ""}`} aria-hidden={i !== idx}>
                  <img
                    src={src}
                    alt={pub?.nombre_lugar || "imagen destacada"}
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(pub?.nombre_lugar || "publicacion")}`; }}
                  />
                </div>
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

          <aside className="pubk-side">
            <div className="pubk-side-content">
              {loading && <div className="pubk-empty">Cargando…</div>}
              {!loading && !pub && <div className="pubk-empty">No se encontró la publicación.</div>}

              {!loading && pub && (
                <>
                  {tab === "resumen" && (
                    <div className="pubk-card">
                      <dl className="pubk-kv">
                        <div className="pubk-kv-row"><dt>Empresa ID</dt><dd>{pub?.empresa_id ?? "—"}</dd></div>
                        <div className="pubk-kv-row"><dt>Dirección</dt><dd>{pub?.direccion || "—"}</dd></div>
                        <div className="pubk-kv-row pubk-row-multi"><dt>Descripción</dt><dd>{pub?.descripcion || "—"}</dd></div>
                        <div className="pubk-kv-row"><dt>Creado</dt><dd>{pub?.created_at ? new Date(pub.created_at).toLocaleString("es-CO") : "—"}</dd></div>
                        <div className="pubk-kv-row"><dt>Actualizado</dt><dd>{pub?.updated_at ? new Date(pub.updated_at).toLocaleString("es-CO") : "—"}</dd></div>
                      </dl>
                    </div>
                  )}

                  {tab === "ubicacion" && (
                    <div className="pubk-card">
                      <div className="pubk-loc-top">
                        <div className="pubk-pill"><span>Lat</span><strong>{pub?.lat ?? "—"}</strong></div>
                        <div className="pubk-pill"><span>Lng</span><strong>{pub?.lng ?? "—"}</strong></div>
                        {hasCoords && (
                          <a className="pubk-link" href={`https://www.google.com/maps?q=${encodeURIComponent(pub.lat + "," + pub.lng)}`} target="_blank" rel="noreferrer">
                            ¿No Sabes llegar? Mira la ruta con Google Maps
                          </a>
                        )}
                      </div>
                      <div className="pubk-map">
                        {hasCoords ? (
                          <MapContainer center={center} zoom={13} style={{ width: "100%", height: 240 }}>
                            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={center}>
                              <Popup><b>{pub?.nombre_lugar}</b><div style={{ maxWidth: 220, marginTop: 6 }}>{pub?.direccion || pub?.ciudad}</div></Popup>
                            </Marker>
                          </MapContainer>
                        ) : <div className="pubk-empty">Sin coordenadas</div>}
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
                            <div><span>Precio desde</span><strong>{fmtMoney(pub?.precio_desde, pub?.moneda)}</strong></div>
                            <div><span>Precio hasta</span><strong>{fmtMoney(pub?.precio_hasta, pub?.moneda)}</strong></div>
                            <div className="pubk-row-full"><span>Detalle</span><strong>{pub?.info_precios || "—"}</strong></div>
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

        {/* ===================== EVENTOS ===================== */}
        <section className="pubk-section" aria-labelledby="sec-eventos">
          <div className="pubk-sec-head">
            <h2 id="sec-eventos" className="pubk-sec-title">Eventos</h2>
          </div>

          <div className="pubk-events-grid">
            {mockEventos.map(ev => (
              <article key={ev.id} className="event-card">
                <div className="event-media">
                  <img src={ev.imagen} alt={ev.nombre} />
                </div>
                <div className="event-body">
                  <h3 className="event-title">{ev.nombre}</h3>
                  <div className="event-meta">
                    <span className="event-date" aria-label="Fecha del evento">{ev.fecha}</span>
                  </div>
                  <p className="event-desc">{ev.descripcion}</p>
                </div>
              </article>
            ))}
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
    </main>
  );
}



