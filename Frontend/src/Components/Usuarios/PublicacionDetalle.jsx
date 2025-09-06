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

// ⭐ util: estrellas accesibles
function Stars({ value = 0, outOf = 5, size = "md" }) {
  const whole = Math.floor(value);
  const half = value - whole >= 0.25 && value - whole < 0.75;
  const total = half ? whole + 1 : whole;
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
      } catch (e) { console.error(e); if (alive) setPub(null); }
      finally { alive && setLoading(false); }
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

  // --------- DATOS FICTICIOS: EVENTOS ---------
  const mockEventos = useMemo(() => ([
    {
      id: "e1",
      nombre: "Festival del Cacao Artesanal",
      fecha: "21/09/2025",
      descripcion: "Talleres y catas de chocolate.",
      imagen: "data:image/jpeg;base64,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"
    },
    {
      id: "e2",
      nombre: "Música al Parque",
      fecha: "04/10/2025",
      descripcion: "Conciertos al aire libre.",
      imagen: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "e3",
      nombre: "Feria de Emprendedores",
      fecha: "19/10/2025",
      descripcion: "Marcas locales y gastronomía.",
      imagen: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=800&auto=format&fit=crop"
    }
  ]), []);

  // --------- DATOS FICTICIOS: VALORACIONES ---------
  const mockRating = {
    promedio: 4.7,
    total: 12,
    dist: { 5: 8, 4: 3, 3: 1, 2: 0, 1: 0 },
    opiniones: [
      {
        id: "r1",
        autor: "Angelica Rodríguez",
        hace: "hace 3 años",
        estrellas: 5,
        texto:
          "Sus postres son deliciosos y visualmente atractivos. La atención al cliente es muy buena. Realmente recomiendo este lugar."
      },
      {
        id: "r2",
        autor: "Carlos M.",
        hace: "hace 1 año",
        estrellas: 4,
        texto:
          "Buen ambiente y precios justos. Podrían ampliar los horarios los fines de semana."
      }
    ]
  };

  const maxBar = Math.max(...Object.values(mockRating.dist));

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

          <button
            className="pubk-btn-back"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            title="Volver"
          >
            <span className="pubk-back-ico">↩</span>
            Volver
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
                          <a
                            className="pubk-link"
                            href={`https://www.google.com/maps?q=${encodeURIComponent(pub.lat + "," + pub.lng)}`}
                            target="_blank" rel="noreferrer"
                          >
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

        {/* ===================== APARTADOS NUEVOS ===================== */}

        {/* EVENTOS */}
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

        {/* VALORACIONES */}

<section className="pubk-section" aria-labelledby="sec-valoraciones">
  <div className="pubk-sec-head">
    <h2 id="sec-valoraciones" className="pubk-sec-title">Valoraciones</h2>
  </div>

  <div className="rating-god">
    {/* Izquierda: score principal */}
    <div className="rating-main">
      <div className="rating-number">{mockRating.promedio.toFixed(1)}</div>
      <Stars value={mockRating.promedio} size="xl" />
      <div className="rating-count">{mockRating.total} opiniones</div>
    </div>

    {/* Derecha: barras */}
    <div className="rating-bars">
      {[5,4,3,2,1].map(n => {
        const val = mockRating.dist[n] ?? 0;
        const pct = maxBar ? (val / maxBar) * 100 : 0;
        return (
          <div key={n} className={`bar-row bar-${n}`}>
            <span className="bar-label">{n}★</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="bar-val">{val}</span>
          </div>
        );
      })}
    </div>
  </div>

  {/* Opiniones */}
  <div className="reviews">
    {mockRating.opiniones.map(op => (
      <article key={op.id} className="review-card">
        <div className="review-avatar">
          <img src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(op.autor)}`} alt={op.autor} />
        </div>
        <div className="review-body">
          <header className="review-head">
            <h3 className="review-author">{op.autor}</h3>
            <span className="review-when">{op.hace}</span>
          </header>
          <Stars value={op.estrellas} />
          <p className="review-text">{op.texto}</p>
        </div>
      </article>
    ))}
  </div>

  <button type="button" className="pubk-btn-review">✍️ Escribir una opinión</button>
</section>


      </div>
    </main>
  );
}
