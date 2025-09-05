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
            {id:"resumen", label:"Resumen"},
            {id:"ubicacion", label:"Ubicación"},
            {id:"precios", label:"Precios"},
          ].map(t => (
            <button
              key={t.id}
              className={`pubk-view ${tab===t.id ? "is-active":""}`}
              onClick={()=>setTab(t.id)}
              role="tab"
              aria-selected={tab===t.id}
            >
              {t.label}
            </button>
          ))}
        </nav>


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
                    onError={(e)=>{ e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(pub?.nombre_lugar || "publicacion")}`; }}
                  />
                </div>
              ))}
            </div>
            <button className="pubk-carr-arrow is-right" onClick={() => setIdx(i => (i + 1) % slides.length)} aria-label="Siguiente">›</button>
            {slides.length > 1 && (
              <div className="pubk-carr-dots">
                {slides.map((_, i) => (
                  <button key={i} className={`pubk-dot ${i === idx ? "is-active" : ""}`} onClick={() => setIdx(i)} aria-label={`Ir a imagen ${i+1}`} />
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
                  {tab==="resumen" && (
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

                  {tab==="ubicacion" && (
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
                              <Popup><b>{pub?.nombre_lugar}</b><div style={{maxWidth:220, marginTop:6}}>{pub?.direccion || pub?.ciudad}</div></Popup>
                            </Marker>
                          </MapContainer>
                        ) : <div className="pubk-empty">Sin coordenadas</div>}
                      </div>
                    </div>
                  )}

                  {tab==="precios" && (
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
      </div>
    </main>
  );
}
