/* VISTA DONDE SE MANEJA LA INFORMACION DE LOS DEPARTAMENTOS CON LA RELACION DE SU MUNICIPIO */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../DOCSS/Departamentos.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

const COL_JSON =
  "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json";
const CDN_BASE =
  "https://ihcuejqfabmgyvsdleqf.supabase.co/storage/v1/object/public/municipios";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const pretty = (slug) =>
  slug
    .split("-")
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");

const muniImgUrl = (deptSlug, muniSlug, ext = "jpg") =>
  `${CDN_BASE}/${deptSlug}/${muniSlug}.${ext}`;

const SkeletonItem = () => (
  <li className="mun-item skeleton" aria-hidden="true">
    <span className="mun-photo sk" />
    <span className="sk sk-line" />
  </li>
);

const Departamentos = () => {
  const { slug } = useParams();
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const nombreDepto = useMemo(() => pretty(slug), [slug]);
  const deptoImg = useMemo(
    () => `/ImagenesP/Departamentos/${slug}.jpg`,
    [slug]
  );

  const onDeptImgError = (e) => {
    e.currentTarget.src = imgDemo;
    e.currentTarget.onerror = null;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(COL_JSON, { cache: "no-store" });
        const data = await res.json();
        const dept = data.find((d) => slugify(d.departamento) === slug);
        const lista =
          dept?.ciudades?.map((c) => ({ nombre: c, slug: slugify(c) })) ?? [];
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        if (alive) setMunicipios(lista);
      } catch {
        if (alive) setMunicipios([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const filtered = useMemo(() => {
    if (!search.trim()) return municipios;
    const q = search.trim().toLowerCase();
    return municipios.filter((m) => m.nombre.toLowerCase().includes(q));
  }, [municipios, search]);

  const colA = useMemo(() => filtered.filter((_, i) => i % 2 === 0), [filtered]);
  const colB = useMemo(() => filtered.filter((_, i) => i % 2 === 1), [filtered]);

  return (
    <main className="dep-root">
      {/* HERO */}
      <section className="dep-hero" aria-label={`Resumen de ${nombreDepto}`}>
        <div className="hero-img">
          <img src={deptoImg} alt={nombreDepto} onError={onDeptImgError} />
          <div className="hero-overlay" />
        </div>

        <div className="hero-text">
          <Link to="/Inicio" className="back btn-back" aria-label="Volver al inicio">
            ← Inicio
          </Link>

          {/* Panel oscuro translúcido para mejorar legibilidad */}
          <div className="hero-box">
            <h1 className="dep-title">{nombreDepto}</h1>
            <p className="dep-sub">
              Explora sus municipios, imágenes y datos clave.
            </p>
          </div>
        </div>
      </section>

      <section className="dep-grid">
        {/* IZQUIERDA */}
        <section className="list-card" aria-labelledby="mun-heading">
          <header className="list-head">
            <h2 id="mun-heading">Municipios</h2>
            <div className="toolbar">
              <div className="search">
                <span className="ico" aria-hidden>                   
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder=" 🔍 Buscar municipio…"
                  aria-label="Buscar municipio"
                />
                {search && (
                  <button
                    className="clear"
                    onClick={() => setSearch("")}
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="count" aria-live="polite">
                {loading
                  ? "Cargando…"
                  : `${filtered.length} ${
                      filtered.length === 1 ? "resultado" : "resultados"
                    }`}
              </span>
            </div>
          </header>

          <div className="mun-cols">
            {loading ? (
              <>
                <ul className="mun-list">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonItem key={`sA-${i}`} />
                  ))}
                </ul>
                <ul className="mun-list">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonItem key={`sB-${i}`} />
                  ))}
                </ul>
              </>
            ) : filtered.length === 0 ? (
              <ul className="mun-list full">
                <li className="empty">No se encontraron municipios.</li>
              </ul>
            ) : (
              <>
                {[colA, colB].map((col, idx) => (
                  <ul key={idx} className="mun-list">
                    {col.map((m) => (
                      <li key={m.slug} className="mun-item">
                        <div className="mun-photo">
                          <img
                            loading="lazy"
                            src={muniImgUrl(slug, m.slug, "jpg")}
                            alt={`Foto de ${m.nombre}`}
                            onError={(e) => {
                              if (!e.currentTarget.dataset.triedWebp) {
                                e.currentTarget.dataset.triedWebp = "1";
                                e.currentTarget.src = muniImgUrl(
                                  slug,
                                  m.slug,
                                  "webp"
                                );
                              } else {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${m.slug}`;
                              }
                            }}
                          />
                        </div>
                        <Link
                          className="mun-name"
                          to={`/departamentos/${slug}/${m.slug}`}
                          title={`Ver ${m.nombre}`}
                        >
                          {m.nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </>
            )}
          </div>
        </section>

        {/* DERECHA */}
        <aside className="info-card" aria-labelledby="info-heading">
          <div className="info-sticky">
            <h2 id="info-heading" className="info-title">
              Departamento
            </h2>
            <div className="info-cover">
              <img src={deptoImg} alt={nombreDepto} onError={onDeptImgError} />
            </div>
            <div className="info-body">
              <p className="muted">Resumen general</p>
              <p>
                Reemplaza este texto con datos reales: población, clima,
                principales atractivos, altitud, gentilicio, etc.
              </p>
              <div className="info-pills" role="list">
                <span role="listitem" className="pill">
                  Clima templado
                </span>
                <span role="listitem" className="pill">
                  +100 municipios
                </span>
                <span role="listitem" className="pill">
                  Turismo natural
                </span>
              </div>
              <Link to="/Inicio" className="info-cta">
                Ver otros departamentos
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Departamentos;