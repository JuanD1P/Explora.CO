
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./DOCSS/Departamentos.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

const COL_JSON =
  "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const pretty = (slug) =>
  slug.split("-").map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ");

const Departamentos = () => {
  const { slug } = useParams();
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);

  const nombreDepto = useMemo(() => pretty(slug), [slug]);
  const deptoImg = useMemo(() => `/ImagenesP/Departamentos/${slug}.jpg`, [slug]);

  const onImgError = (e) => {
    e.currentTarget.src = imgDemo;
    e.currentTarget.onerror = null;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(COL_JSON, { cache: "no-store" });
        const data = await res.json(); // [{departamento, ciudades:[...]}, ...]
        const dept = data.find((d) => slugify(d.departamento) === slug);
        const lista =
          dept?.ciudades?.map((c) => ({ nombre: c, slug: slugify(c) })) ?? [];
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        if (alive) setMunicipios(lista);
      } catch (err) {
        console.error(err);
        if (alive) setMunicipios([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);


  const colA = municipios.filter((_, i) => i % 2 === 0);
  const colB = municipios.filter((_, i) => i % 2 === 1);

  return (
    <main className="depdtl-root">
      <header className="depdtl-header">
        <Link to="/Inicio" className="back">← Inicio</Link>
        <h1>{nombreDepto}</h1>
      </header>

      <section className="depdtl-grid">
        {/* Panel izquierdo */}
        <aside className="depdtl-aside">
          <div className="depdtl-photoCircle">
            <img src={deptoImg} alt={nombreDepto} onError={onImgError} />
          </div>
          <h2 className="depdtl-asideTitle">Departamento seleccionado</h2>
          <p className="depdtl-asideText">
            Información del departamento (clima, atractivos, datos rápidos). Puedes
            reemplazar este texto con contenido real desde tu backend o un JSON.
          </p>
        </aside>

        {/* Panel derecho */}
        <section className="depdtl-listWrap">
          {loading && <p className="muted">Cargando municipios…</p>}

          {!loading && municipios.length === 0 && (
            <p className="muted">No se encontraron municipios.</p>
          )}

          {!loading && municipios.length > 0 && (
            <div className="depdtl-twoCols">
              {[colA, colB].map((col, idx) => (
                <ul key={idx} className="mun-col" role="list">
                  {col.map((m) => (
                    <li key={m.slug} className="mun-item">
                      <div className="mun-photo">
                        <img
                          src={`https://api.dicebear.com/7.x/shapes/svg?seed=${m.slug}`}
                          alt={`Foto de ${m.nombre}`}
                          onError={onImgError}
                        />
                      </div>
                      <a
                        className="mun-name"
                        href={`/departamentos/${slug}/${m.slug}`}
                        title={`Ver ${m.nombre}`}
                      >
                        {m.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Departamentos;
