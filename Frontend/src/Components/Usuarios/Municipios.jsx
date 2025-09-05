import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../DOCSS/Municipio.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const HERO_OVERRIDE =
  "https://cloudfront-us-east-1.images.arcpublishing.com/infobae/FEC67PB62VC3VF6LF5KNEGB2EE.jpg";

const CDN_BASE =
  "https://ihcuejqfabmgyvsdleqf.supabase.co/storage/v1/object/public/municipios";
const muniImgUrl = (deptSlug, muniSlug, ext = "jpg") =>
  `${CDN_BASE}/${deptSlug}/${muniSlug}.${ext}`;


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ========= Helpers ========= */
const pretty = (slug = "") =>
  slug
    .split("-")
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");

const nf = new Intl.NumberFormat("es-CO");
const fmtNum = (v) => (v == null ? "—" : nf.format(Math.round(Number(v))));
const timeHHMM = (t) => (t ? String(t).slice(0, 5) : "—");

/* Wikipedia / Wikidata */
const wikiSummaryURL = (title) =>
  `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;
const wikiQueryURL = (title) =>
  `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
    title
  )}&format=json&origin=*`;
const wdEntityURL = (qid) =>
  `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
const wdSearchURL = (q) =>
  `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    q
  )}&language=es&format=json&origin=*`;

/* Nominatim (mapa) */
const NOMI_SEARCH = "https://nominatim.openstreetmap.org/search";


const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 12, { animate: true });
  }, [center, map]);
  return null;
};

function useBucketCover(deptSlug, muniSlug) {
  const [ext, setExt] = useState("jpg");
  const [failed, setFailed] = useState(false);

  const src = failed
    ? `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
        muniSlug
      )}`
    : muniImgUrl(deptSlug, muniSlug, ext);

  const onError = () => {
    if (ext === "jpg") setExt("webp");
    else setFailed(true);
  };

  return { src, onError };
}

const DEMO_POSTS = [
  {
    id: "1",
    empresa_nombre: "Café Don Pedro",
    nombre_lugar: "Mirador La Serranita",
    categoria: "Gastronomía",
    descripcion:
      "Café especial de origen con vista al valle. Música en vivo los fines de semana.",
    direccion: "Cra 7 #12-34, Centro",
    horario_desde: "08:00",
    horario_hasta: "19:30",
    info_precios: "Capuchino $8.000 – Brunch $28.000",
    created_at: "2025-08-12T15:21:00Z",
    updated_at: "2025-08-20T09:02:00Z",
    thumb: "https://api.dicebear.com/7.x/abstract/svg?seed=demo1",
  },
  {
    id: "2",
    empresa_nombre: "Hostal Andino",
    nombre_lugar: "Hostal Andino – Zona Histórica",
    categoria: "Alojamiento",
    descripcion:
      "Habitaciones privadas y compartidas. Terraza con fogata y tours a páramo.",
    direccion: "Calle 3 #4-55",
    horario_desde: "00:00",
    horario_hasta: "23:59",
    info_precios: "Desde $55.000/noche",
    created_at: "2025-07-30T10:00:00Z",
    updated_at: "2025-08-04T18:45:00Z",
    thumb: "https://api.dicebear.com/7.x/abstract/svg?seed=demo2",
  },
  {
    id: "3",
    empresa_nombre: "Tours Kuntur",
    nombre_lugar: "Ruta del Agua",
    categoria: "Turismo",
    descripcion:
      "Recorrido ecológico por cascadas y miradores. Incluye seguro y guía local.",
    direccion: "Parque Principal (punto de encuentro)",
    horario_desde: "07:00",
    horario_hasta: "16:00",
    info_precios: "Plan completo $95.000",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-02T16:12:00Z",
    thumb: "https://api.dicebear.com/7.x/abstract/svg?seed=demo3",
  },
];

async function tryWiki(title) {
  try {
    const r = await fetch(wikiSummaryURL(title));
    if (r.ok) {
      const js = await r.json();
      return {
        extract: js?.extract ?? null,
        wikiUrl: js?.content_urls?.desktop?.page ?? null,
        qid: js?.wikibase_item ?? null,
      };
    }
  } catch {}
  try {
    const r = await fetch(wikiQueryURL(title));
    if (r.ok) {
      const js = await r.json();
      const pages = js?.query?.pages || {};
      const first = Object.values(pages)[0];
      const extract = first?.extract || null;
      const wikiUrl = first?.pageid
        ? `https://es.wikipedia.org/?curid=${first.pageid}`
        : null;
      return { extract, wikiUrl, qid: null };
    }
  } catch {}
  return { extract: null, wikiUrl: null, qid: null };
}

export default function Municipio() {
  const { deptSlug, muniSlug } = useParams();
  const nombreDepto = useMemo(() => pretty(deptSlug), [deptSlug]);
  const nombreMuni = useMemo(() => pretty(muniSlug), [muniSlug]);


  const {
    src: coverMini,
    onError: onCoverMiniError,
  } = useBucketCover(deptSlug, muniSlug);


  const [loadingInfo, setLoadingInfo] = useState(true);
  const [info, setInfo] = useState({
    extract: null,
    wikiUrl: null,
    qid: null,
    population: null,
    elevation: null,
    demonym: null,
  });


  const [center, setCenter] = useState([4.711, -74.0721]); 
  const [addr, setAddr] = useState("");


  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingInfo(true);
      try {
        const q = `${nombreMuni} ${nombreDepto} Colombia`;
        let qid = null;
        let resolvedTitle = null;
        try {
          const r = await fetch(wdSearchURL(q));
          const data = await r.json();
          qid = data?.search?.[0]?.id || null;
          if (qid) {
            const entResp = await fetch(wdEntityURL(qid));
            const entJson = await entResp.json();
            const ent = entJson?.entities?.[qid];
            resolvedTitle = ent?.sitelinks?.eswiki?.title || null;
          }
        } catch {}


        const candidates = [
          resolvedTitle,
          `${nombreMuni} (${nombreDepto})`,
          `${nombreMuni} (municipio)`,
          `${nombreMuni}, ${nombreDepto}, Colombia`,
          `${nombreMuni}, Colombia`,
          `${nombreMuni}`,
        ].filter(Boolean);

        let extract = null,
          wikiUrl = null,
          qidFinal = qid ?? null;

        for (const t of candidates) {
          const got = await tryWiki(t);
          if (got.extract || got.wikiUrl) {
            extract = got.extract;
            wikiUrl = got.wikiUrl;
            qidFinal = got.qid || qidFinal;
            break;
          }
        }

        let population = null,
          elevation = null,
          demonym = null;
        if (qidFinal) {
          try {
            const entResp = await fetch(wdEntityURL(qidFinal));
            if (entResp.ok) {
              const entJson = await entResp.json();
              const claims = entJson?.entities?.[qidFinal]?.claims ?? {};

              const getAmount = (pid) => {
                const arr = claims?.[pid] || [];
                const best =
                  arr.find(
                    (c) =>
                      c.rank === "preferred" &&
                      c.mainsnak?.datavalue?.value?.amount
                  ) ||
                  [...arr]
                    .reverse()
                    .find((c) => c.mainsnak?.datavalue?.value?.amount);
                const raw = best?.mainsnak?.datavalue?.value?.amount;
                const n = raw == null ? null : Number(raw);
                return Number.isFinite(n) ? n : null;
              };
              const getMono = (pid) => {
                const v = (claims?.[pid] || [])
                  .map((c) => c.mainsnak?.datavalue?.value)
                  .find(
                    (x) => x?.text && (x.language === "es" || x.language === "en")
                  );
                return v?.text || null;
              };

              population = getAmount("P1082");
              elevation = getAmount("P2044");
              demonym = getMono("P1549");
            }
          } catch {}
        }

        if (alive) {
          setInfo({
            extract,
            wikiUrl,
            qid: qidFinal,
            population,
            elevation,
            demonym,
          });
        }
      } catch {
        if (alive) {
          setInfo({
            extract: null,
            wikiUrl: null,
            qid: null,
            population: null,
            elevation: null,
            demonym: null,
          });
        }
      } finally {
        alive && setLoadingInfo(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [nombreMuni, nombreDepto]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const q = `${nombreMuni}, ${nombreDepto}, Colombia`;
        const url = `${NOMI_SEARCH}?format=json&q=${encodeURIComponent(
          q
        )}&limit=1&countrycodes=co`;
        const r = await fetch(url, { headers: { "Accept-Language": "es" } });
        const data = await r.json();
        const hit = data?.[0];
        if (hit && alive) {
          const lat = parseFloat(hit.lat);
          const lon = parseFloat(hit.lon);
          setCenter([lat, lon]);
          setAddr(hit.display_name || q);
        }
      } catch {
      }
    })();
    return () => {
      alive = false;
    };
  }, [nombreMuni, nombreDepto]);

  return (
    <main className="muni-wrap">
      <section className="muni-hero white">
        <div className="hero-img">
          <img src={HERO_OVERRIDE} alt={nombreMuni} />
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <Link to={`/departamentos/${deptSlug}`} className="back-link pill">
            ← {nombreDepto}
          </Link>

          <div className="title-band">
            <h1 className="title">{nombreMuni}</h1>
            <p className="subtitle">
              INFORMACION DEL MUNICIPIO Y PUBLICACIONES
            </p>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="muni-grid">
        <aside className="left-pane card">
          <header className="pane-head">
            <h2>Información del municipio</h2>
            <span className="badge-pill">
              {loadingInfo ? "Cargando…" : "Datos en vivo"}
            </span>
          </header>

          <div className="cover-mini">
            <img
              src={coverMini}
              alt={`Portada de ${nombreMuni}`}
              onError={onCoverMiniError}
            />
          </div>

          <p className="extract">
            {info.extract
              ? info.extract
              : "Resumen no disponible por ahora. Intenté resolver por Wikipedia y Wikidata con el nombre del municipio + departamento."}
          </p>

          <ul className="stats" role="list">
            <li>
              <span className="k">Departamento</span>
              <span className="v">{nombreDepto}</span>
            </li>
            <li>
              <span className="k">Población</span>
              <span className="v">{fmtNum(info.population)}</span>
            </li>
            <li>
              <span className="k">Altitud</span>
              <span className="v">
                {info.elevation ? `${fmtNum(info.elevation)} m` : "—"}
              </span>
            </li>
            <li>
              <span className="k">Gentilicio</span>
              <span className="v">{info.demonym || "—"}</span>
            </li>
          </ul>

          <div className="block">
            <h3>Ubicación</h3>
            <div className="map-wrap">
              <MapContainer
                center={center}
                zoom={12}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Recenter center={center} />
                <Marker position={center}>
                  <Popup>
                    <b>{nombreMuni}</b>
                    <div style={{ maxWidth: 240, marginTop: 6 }}>
                      {addr || "Colombia"}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          <div className="actions">
            {info.wikiUrl && (
              <a
                className="btn-ghost"
                href={info.wikiUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver en Wikipedia
              </a>
            )}
          </div>
        </aside>

        <section className="right-pane">
          <div className="right-head">
            <h2>Publicaciones</h2>
            <span className="muted">{DEMO_POSTS.length} resultados</span>
          </div>

          <ul className="cards" role="list">
            {DEMO_POSTS.map((p) => (
              <li key={p.id} className="card post">
                <div className="media">
                  <img
                    src={p.thumb}
                    alt={p.nombre_lugar}
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                        p.nombre_lugar
                      )}`;
                    }}
                  />
                </div>

                <div className="body">
                  <div className="topline">
                    <span className="cat">{p.categoria}</span>
                    <span className="dates">
                      Creado:{" "}
                      {new Date(p.created_at).toLocaleDateString("es-CO")}
                    </span>
                  </div>

                  <h3 className="post-title">{p.nombre_lugar}</h3>
                  <p className="empresa">
                    Empresa: <b>{p.empresa_nombre}</b>
                  </p>
                  <p className="desc">{p.descripcion}</p>

                  <div className="grid2">
                    <div className="kv">
                      <span className="k">Dirección</span>
                      <span className="v">{p.direccion}</span>
                    </div>
                    <div className="kv">
                      <span className="k">Horario</span>
                      <span className="v">
                        {timeHHMM(p.horario_desde)} – {timeHHMM(p.horario_hasta)}
                      </span>
                    </div>
                  </div>

                  <div className="kv">
                    <span className="k">Info precios</span>
                    <span className="v">{p.info_precios}</span>
                  </div>

                  <div className="foot">
                    <span className="dates muted">
                      Actualizado:{" "}
                      {new Date(p.updated_at).toLocaleDateString("es-CO")}
                    </span>
                    <button
                      className="btn-primary"
                      onClick={(e) => e.preventDefault()}
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
