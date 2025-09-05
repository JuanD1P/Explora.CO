/* VISTA DONDE SE MANEJA LA INFORMACION DE LOS DEPARTAMENTOS CON LA RELACION DE SU MUNICIPIO */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../DOCSS/Departamentos.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

const COL_JSON =
  "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json";
const CDN_BASE =
  "https://ihcuejqfabmgyvsdleqf.supabase.co/storage/v1/object/public/municipios";

/* ===== Helpers ===== */
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const pretty = (slug) =>
  slug.split("-").map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" ");

const muniImgUrl = (deptSlug, muniSlug, ext = "jpg") =>
  `${CDN_BASE}/${deptSlug}/${muniSlug}.${ext}`;

const nf = new Intl.NumberFormat("es-CO");
const fmtNum = (v) => (v == null ? null : nf.format(Math.round(Number(v))));
const fmtKm2 = (m2) => {
  if (!m2) return null;
  const km2 = Number(m2) / 1_000_000;
  return `${nf.format(Math.round(km2))} km²`;
};

const wikiCandidates = (nombreDepto) => [
  `Departamento de ${nombreDepto}`,
  `${nombreDepto} (departamento)`,
  `${nombreDepto} (Colombia)`,
  `${nombreDepto}`,
];

const wikiSummaryURL = (title) =>
  `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

const wdEntityURL = (qid) =>
  `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;


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

  // ====== Departamento 
  const [depInfo, setDepInfo] = useState({
    extract: null,
    wikiUrl: null,
    thumb: null, 
    qid: null,
    capital: null,
    population: null,
    elevation: null,  
    demonym: null,
    iso: null,        
  });
  const [depLoading, setDepLoading] = useState(true);

  const nombreDepto = useMemo(() => pretty(slug), [slug]);
  const deptoImg = useMemo(() => `/ImagenesP/Departamentos/${slug}.jpg`, [slug]);

  const onDeptImgError = (e) => {
    e.currentTarget.src = imgDemo;
    e.currentTarget.onerror = null;
  };

  /* === Cargar municipios del JSON === */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(COL_JSON, { cache: "no-store" });
        const data = await res.json();
        const dept = data.find((d) => slugify(d.departamento) === slug);
        const lista = dept?.ciudades?.map((c) => ({ nombre: c, slug: slugify(c) })) ?? [];
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        if (alive) setMunicipios(lista);
      } catch {
        if (alive) setMunicipios([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  const filtered = useMemo(() => {
    if (!search.trim()) return municipios;
    const q = search.trim().toLowerCase();
    return municipios.filter((m) => m.nombre.toLowerCase().includes(q));
  }, [municipios, search]);

  const colA = useMemo(() => filtered.filter((_, i) => i % 2 === 0), [filtered]);
  const colB = useMemo(() => filtered.filter((_, i) => i % 2 === 1), [filtered]);

  /* === Cargar resumen Wikipedia + Wikidata del Departamento  === */
  useEffect(() => {
    let alive = true;


    const getAmount = (claims, pid) => {
      const arr = claims?.[pid] || [];
      const best =
        arr.find(c => c.rank === "preferred" && c.mainsnak?.datavalue?.value?.amount) ||
        [...arr].reverse().find(c => c.mainsnak?.datavalue?.value?.amount);
      const raw = best?.mainsnak?.datavalue?.value?.amount;
      if (raw == null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };

    const getMonolingual = (claims, pid) => {
      const v = (claims?.[pid] || [])
        .map(c => c.mainsnak?.datavalue?.value)
        .find(x => x?.text && (x.language === "es" || x.language === "en"));
      return v?.text || null;
    };

    const fetchEntity = async (qid) => {
      const r = await fetch(wdEntityURL(qid));
      if (!r.ok) throw new Error("wd entity error");
      return r.json();
    };

    (async () => {
      setDepLoading(true);
      try {
        // RESUMEN de Wikipedia 
        let summary = null;
        for (const title of wikiCandidates(nombreDepto)) {
          const r = await fetch(wikiSummaryURL(title));
          if (r.ok) { summary = await r.json(); break; }
        }

        const extract = summary?.extract ?? null;
        const wikiUrl = summary?.content_urls?.desktop?.page ?? null;
        const qid = summary?.wikibase_item ?? null;

        // WIKIDATA: capital, población, área, altitud, gentilicio, ISO
        let capital = null, population = null, elevation = null, demonym = null, iso = null;

        if (qid) {
          const data = await fetchEntity(qid);
          const ent = data?.entities?.[qid]?.claims ?? {};

          // población (P1082) y área (P2046 en m²)
          const popAmount = getAmount(ent, "P1082");
          if (popAmount) population = popAmount;


          // altitud (P2044) en metros (m)
          const elev = getAmount(ent, "P2044");
          if (elev) elevation = elev;

          // gentilicio (P1549)
          demonym = getMonolingual(ent, "P1549");

          // ISO 3166-2 (P300)
          const isoClaim = (ent?.P300 || [])
            .map(c => c.mainsnak?.datavalue?.value)
            .find(Boolean);
          if (typeof isoClaim === "string") iso = isoClaim;

          // capital (P36) -> nombre de la entidad
          const capId = ent?.P36?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
          if (capId) {
            const capData = await fetchEntity(capId);
            const capEnt = capData?.entities?.[capId];
            capital = capEnt?.labels?.es?.value || capEnt?.labels?.en?.value || null;
          }
        }

        if (alive) {
          setDepInfo({
            extract,
            wikiUrl,
            thumb: null, 
            qid,
            capital,
            population,
            elevation,
            demonym,
            iso,
          });
        }
      } catch {
        if (alive) {
          setDepInfo({
            extract: null, wikiUrl: null, thumb: null, qid: null,
            capital: null, population: null,
            elevation: null, demonym: null, iso: null,
          });
        }
      } finally {
        if (alive) setDepLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [nombreDepto]);

  const muniCount = municipios.length;
const Stat = ({ icon, label, value }) => (
  <li className="stat" role="listitem">
    <div className="stat-ico" aria-hidden="true" dangerouslySetInnerHTML={{__html: icon}} />
    <div className="stat-text">
      <span className="k">{label}</span>
      <span className="v">{value}</span>
    </div>
  </li>
);

const icons = {
  municipios: '<svg viewBox="0 0 24 24"><path d="M3 11h18v10H3zM7 3h10v8H7z"/></svg>',
  capital:    '<svg viewBox="0 0 24 24"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z"/></svg>',
  poblacion:  '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0z"/></svg>',
  altitud:    '<svg viewBox="0 0 24 24"><path d="M5 18h14l-7-12z"/></svg>',
  gentilicio: '<svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 9a7 7 0 0 1 14 0z"/></svg>',
  iso:        '<svg viewBox="0 0 24 24"><path d="M3 5h18v4H3zm0 5h18v9H3z"/></svg>',
};

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

          <div className="hero-box">
            <h1 className="dep-title">{nombreDepto}</h1>
            <p className="dep-sub">Explora sus municipios, imágenes y datos clave.</p>
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
                <span className="ico" aria-hidden="true"> 
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍Buscar municipio…"
                  aria-label="Buscar municipio"
                />
                {search && (
                  <button className="clear" onClick={() => setSearch("")} aria-label="Limpiar búsqueda">×</button>
                )}
              </div>
              <span className="count" aria-live="polite">
                {loading ? "Cargando…" : `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`}
              </span>
            </div>
          </header>

          <div className="mun-cols">
            {loading ? (
              <>
                <ul className="mun-list">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonItem key={`sA-${i}`} />)}
                </ul>
                <ul className="mun-list">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonItem key={`sB-${i}`} />)}
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
                                e.currentTarget.src = muniImgUrl(slug, m.slug, "webp");
                              } else {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${m.slug}`;
                              }
                            }}
                          />
                        </div>
                        <Link className="mun-name" to={`/departamentos/${slug}/${m.slug}`} title={`Ver ${m.nombre}`}>
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
            <h2 id="info-heading" className="info-title">Departamento</h2>

            <div className="info-cover">
              <img
                src={deptoImg}      
                alt={nombreDepto}
                onError={onDeptImgError}
                loading="lazy"
              />
            </div>

            <div className="info-body">
              <p className="muted">{depLoading ? "Cargando resumen…" : "Resumen general"}</p>
              <p>
                {depInfo.extract
                  ? depInfo.extract
                  : "Reemplaza este texto con datos reales: población, clima, principales atractivos, altitud, gentilicio, etc."}
              </p>

              <ul className="info-stats" role="list">
                  <Stat icon={icons.municipios} label="Municipios" value={municipios.length || "—"} />
                  {depInfo.capital && (
                    <Stat icon={icons.capital} label="Capital" value={depInfo.capital} />
                  )}
                  {Number.isFinite(Number(depInfo.population)) && Number(depInfo.population) > 0 && (
                    <Stat icon={icons.poblacion} label="Población" value={fmtNum(depInfo.population)} />
                  )}

                  {Number.isFinite(Number(depInfo.elevation)) && Number(depInfo.elevation) > 0 && (
                    <Stat icon={icons.altitud} label="Altitud" value={`${fmtNum(depInfo.elevation)} m`} />
                  )}
                  {depInfo.demonym && (
                    <Stat icon={icons.gentilicio} label="Gentilicio" value={depInfo.demonym} />
                  )}
                  {depInfo.iso && (
                    <Stat icon={icons.iso} label="ISO 3166-2" value={depInfo.iso} />
                  )}
                </ul>


              <div className="info-actions">
                {depInfo.wikiUrl && (
                  <a className="btn btn-ghost" href={depInfo.wikiUrl} target="_blank" rel="noreferrer">
                    Ver en Wikipedia
                  </a>
                )}
              </div>

            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Departamentos;
