/*VISTA DE INICIO DE UN USUARIO NORMAL*/

import React, { useMemo, useRef, useEffect, useState } from "react";
import "../DOCSS/Inicio.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

const slugify = (s) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "-");

const ImgSmart = ({ src, alt, className, w=1200, h=800, loading="lazy", fetchPriority, fit="cover" }) => (
  <img
    src={src}
    alt={alt}
    decoding="async"
    loading={loading}
    fetchPriority={fetchPriority}   // ✅ camelCase
    width={w}
    height={h}
    className={`img-smart ${fit === "contain" ? "fit-contain" : "fit-cover"} ${className || ""}`}
  />
);

const useScrollButtons = (ref, step = 0.9) => {
  const prev = () => {
    const el = ref.current; if (!el) return;
    el.scrollBy({ left: -Math.floor(el.clientWidth * step), behavior: "smooth" });
  };
  const next = () => {
    const el = ref.current; if (!el) return;
    el.scrollBy({ left:  Math.floor(el.clientWidth * step), behavior: "smooth" });
  };
  return { prev, next };
};

const useAutoScroll = (ref, { interval = 4500, step = 1, pause = true } = {}) => {
  const [isPaused, setPaused] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let id = setInterval(() => {
      if (pause && isPaused) return;
      const w = el.clientWidth;
      const max = el.scrollWidth - w;
      const next = el.scrollLeft + Math.floor(w * step);
      if (el.scrollLeft >= max - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollTo({ left: Math.min(next, max), behavior: "smooth" });
      }
    }, interval);
    return () => clearInterval(id);
  }, [ref, interval, step, pause, isPaused]);
  return { setPaused };
};

const Carousel = ({ children, className, ariaLabel, dots = true, step = 0.9, showArrows = true, auto = true, interval = 4500 }) => {
  const trackRef = useRef(null);
  const { prev, next } = useScrollButtons(trackRef, step);
  const { setPaused } = useAutoScroll(trackRef, { interval, step: 1, pause: auto });
  const count = React.Children.count(children);
  return (
    <div className={`carousel ${className || ""}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div ref={trackRef} className="carousel__track" role="region" aria-label={ariaLabel} tabIndex={0}>
        {children}
      </div>
      {showArrows && (
        <>
          <button className="carousel__nav is-prev" aria-label="Anterior" onClick={prev}>‹</button>
          <button className="carousel__nav is-next" aria-label="Siguiente" onClick={next}>›</button>
        </>
      )}
      {dots && count > 1 && (
        <div className="carousel__dots" role="tablist" aria-label="Paginación">
          {Array.from({ length: count }).map((_, i) => (<span key={i} className="dot" />))}
        </div>
      )}
    </div>
  );
};

const DepsGridScroll = ({ deps, depImgs, auto = true, interval = 5000 }) => {
  const trackRef = useRef(null);
  const { prev, next } = useScrollButtons(trackRef, 0.9);
  const { setPaused } = useAutoScroll(trackRef, { interval, step: 1, pause: auto });
  return (
    <div className="deps-wrap glass" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        ref={trackRef}
        className="carousel__track deps__track"
        role="region"
        aria-label="Carrusel de departamentos de Colombia"
        tabIndex={0}
      >
        {deps.map((d, idx) => {
          const src = depImgs[idx];
          const slug = slugify(d);
          return (
            <div className="carousel__slide dep-card-wrap" key={d}>
              <a href={`/departamentos/${slug}`} className="dep-card" aria-label={`Ver destinos en ${d}`}>
                <div className="dep-card__media">
                  <ImgSmart src={src} alt={d} className="dep-card__img" w={640} h={420} fit="cover" />
                  <span className="dep-chip">Explorar</span>
                </div>
                <div className="dep-card__foot">
                  <h4 className="dep-card__title">{d}</h4>
                  <span className="dep-card__cta" aria-hidden />
                </div>
              </a>
            </div>
          );
        })}
      </div>
      <button className="deps-nav deps-nav--prev carousel__nav is-prev" aria-label="Anterior" onClick={prev}>‹</button>
      <button className="deps-nav deps-nav--next carousel__nav is-next" aria-label="Siguiente" onClick={next}>›</button>
    </div>
  );
};

const Inicio = () => {
  const categorias = [
    { id: "naturaleza",  titulo: "Naturaleza",  href: "/1" },
    { id: "cultura",     titulo: "Cultura",     href: "/2" },
    { id: "gastronomia", titulo: "Gastronomía", href: "/3" },
    { id: "recreativo",  titulo: "Recreativo",  href: "/4" },
    { id: "historia",    titulo: "Historia",    href: "/5" },
    { id: "arqueologicos", titulo: "Arqueológicos", href: "/6" },
  ];
  const departamentos = [
    "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca",
    "Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta",
    "Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés","Santander","Sucre","Tolima",
    "Valle del Cauca","Vaupés","Vichada"
  ];

  const { heroImgs, catImgs, depImgs } = useMemo(() => {
    const heroImgs = [
      "/ImagenesP/InicioUsuario/Hero1.jpg",
      "/ImagenesP/InicioUsuario/Hero2.jpg",
      "/ImagenesP/InicioUsuario/Hero3.jpg",
      "/ImagenesP/InicioUsuario/Hero4.jpg",
      "/ImagenesP/InicioUsuario/Hero5.jpg",
    ];
    const catImgs = categorias.map(c => `/ImagenesP/Categorias/${c.id}.jpg`);
    const depImgs = departamentos.map(d => `/ImagenesP/Departamentos/${slugify(d)}.jpg`);
    return { heroImgs, catImgs, depImgs };
  }, []);

  const heroTrackRef = useRef(null);
  const { setPaused: setHeroPaused } = useAutoScroll(heroTrackRef, { interval: 5000, step: 1, pause: true });

  return (
    <main className="ini-root" role="main">
      <div aria-hidden className="ini-hero-bg">
        <span className="ini-bg-bubble b1" />
        <span className="ini-bg-bubble b2" />
        <span className="ini-bg-bubble b3" />
      </div>

      <section className="ini-intro">
        <div className="ini-intro__text glass">
          <h1 className="ini-title">Explora.CO</h1>
          <h2 className="ini-h2">Descubre Colombia</h2>
          <p>Encuentra lugares increíbles con fotos, descripciones, mapas y reseñas reales. Filtra por<em> naturaleza</em>, <em> cultura</em>, <em> gastronomía</em> y <em> aventura</em>.</p>
          <p className="ini-muted">Hecho para viajeros, operadores y entidades — todo en una sola experiencia.</p>
        </div>

        <div className="ini-hero card-3d" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)}>
          <div className="hero carousel ini-hero-carousel">
            <div ref={heroTrackRef} className="carousel__track hero__track" role="region" aria-label="Galería principal" tabIndex={0}>
              {heroImgs.map((src, i) => (
                <div className="carousel__slide hero__slide" key={i}>
                  <ImgSmart
                    src={src}
                    alt={`Imagen destacada ${i + 1}`}
                    className="ini-hero__img"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchpriority={i === 0 ? "high" : "auto"}
                    w={1920} h={1080}
                    fit="contain"
                  />
                </div>
              ))}
            </div>
            <button className="carousel__nav is-prev" aria-label="Anterior"
              onClick={() => heroTrackRef.current?.scrollBy({ left: -heroTrackRef.current.clientWidth, behavior: "smooth" })}>‹</button>
            <button className="carousel__nav is-next" aria-label="Siguiente"
              onClick={() => heroTrackRef.current?.scrollBy({ left:  heroTrackRef.current.clientWidth, behavior: "smooth" })}>›</button>
            <div className="carousel__dots" role="tablist" aria-label="Paginación">
              {heroImgs.map((_, i) => <span key={i} className="dot" />)}
            </div>
          </div>
        </div>
      </section>

      <section className="ini-section">
        <div className="ini-section__head">
          <h3>Categorías</h3>
          <p>Explora por tipo de experiencia</p>
        </div>

        <Carousel className="ini-carousel glass" ariaLabel="Carrusel de categorías" step={0.8} auto interval={4200}>
          {categorias.map((c, idx) => (
            <a key={c.id} href={c.href} className="ini-card hover-raise carousel__slide" aria-label={c.titulo}>
              <div className="ini-thumb">
                <ImgSmart src={catImgs[idx]} alt={c.titulo} w={600} h={400} fit="cover" />
              </div>
              <span>{c.titulo}</span>
            </a>
          ))}
        </Carousel>
      </section>

      <section className="ini-banner card-3d">
        <ImgSmart src="/ImagenesP/Banners/elige-destino.jpg" alt="Banner informativo" w={1920} h={480} fit="cover" />
      </section>

      <section className="ini-section" aria-labelledby="deps-title">
        <div className="ini-section__head">
          <h3 id="deps-title">Departamentos</h3>
          <p>Descubre destinos y experiencias por región</p>
        </div>
        <DepsGridScroll deps={departamentos} depImgs={depImgs} auto interval={5200} />
      </section>
    </main>
  );
};

export default Inicio;
