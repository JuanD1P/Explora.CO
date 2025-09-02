import React, { useEffect, useMemo } from "react";
import "./DOCSS/Inicio.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

import { motion } from "framer-motion"; 
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  Navigation,
  EffectFade,
  EffectCoverflow,
  A11y,
  Keyboard,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "swiper/css/effect-coverflow";

const Inicio = () => {
  const CDN_PUBLIC =
    "https://ihcuejqfabmgyvsdleqf.supabase.co/storage/v1/object/public";

  const ASSET_VER = import.meta.env.DEV
    ? Date.now()
    : import.meta.env.VITE_ASSET_VERSION || "1";

  const depImgUrl = (slug, ext = "webp") =>
    `${CDN_PUBLIC}/departamentos/${slug}.${ext}?v=${ASSET_VER}`;

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

  const slugify = (s) =>
    s.toLowerCase()
      .replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i").replace(/ó/g,"o").replace(/ú/g,"u").replace(/ñ/g,"n")
      .replace(/\s+/g,"-");

  const { heroImgs, catImgs, depImgs } = useMemo(() => {
    const heroImgs = [
      "/ImagenesP/InicioUsuario/Hero1.jpg",
      "/ImagenesP/InicioUsuario/Hero2.jpg",
      "/ImagenesP/InicioUsuario/Hero3.jpg",
      "/ImagenesP/InicioUsuario/Hero4.jpg",
      "/ImagenesP/InicioUsuario/Hero5.jpg",
    ];
    const catImgs = categorias.map(c => `/ImagenesP/Categorias/${c.id}.jpg`);
    const depImgs = departamentos.map(d => depImgUrl(slugify(d), "webp"));
    return { heroImgs, catImgs, depImgs };

  }, []);

  useEffect(() => {
    const head = document.head;

    const addPreload = (href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      head.appendChild(link);
      return link;
    };

    const warm = (src) => { const im = new Image(); im.src = src; };

    const preloadLinks = [
      ...heroImgs.map(src => addPreload(src)),
      ...catImgs.map(src => addPreload(src)),
    ];


    const firstBatch = depImgs.slice(0, 12);
    const restBatch  = depImgs.slice(12);

    const depPreloads = firstBatch.map(src => addPreload(src));
    firstBatch.forEach(warm); 


    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
    const idleId = idle(() => { restBatch.forEach(warm); });


    return () => {
      [...preloadLinks, ...depPreloads].forEach(l => head.contains(l) && head.removeChild(l));
      if ("cancelIdleCallback" in window && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [heroImgs, catImgs, depImgs]);

  const onImgError = (e) => { e.currentTarget.src = imgDemo; e.currentTarget.onerror = null; };

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
          <p>
            Encuentra lugares increíbles con fotos, descripciones, mapas y reseñas reales. Filtra por
            <em> naturaleza</em>, <em> cultura</em>, <em> gastronomía</em> y <em> aventura</em>.
          </p>
          <p className="ini-muted">Hecho para viajeros, operadores y entidades — todo en una sola experiencia.</p>
        </div>

        <div className="ini-hero card-3d">
          <div className="ini-hero__parallax">
            <span className="parallax p1" />
            <span className="parallax p2" />
          </div>

          <Swiper
            className="ini-hero-swiper"
            modules={[Autoplay, Pagination, Navigation, EffectFade, A11y, Keyboard]}
            effect="fade"
            speed={900}
            loop
            autoplay={{ delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true }}
            navigation
            keyboard
            pagination={{ clickable: true }}
            a11y={{ prevSlideMessage: "Anterior", nextSlideMessage: "Siguiente" }}
            aria-label="Galería principal"
          >
            {heroImgs.map((src, i) => (
              <SwiperSlide key={i}>
                <motion.img
                  src={src}
                  onError={onImgError}
                  alt={`Imagen destacada ${i + 1}`}
                  className="ini-hero__img"
                  decoding="async"
                  loading="eager"
                  fetchpriority={i === 0 ? "high" : "low"}
                  initial={{ scale: 1.015 }}
                  animate={{ scale: 1.055 }}
                  transition={{ duration: 9, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ===== ¿QUÉ PUEDES HACER? ===== */}
      <section className="ini-section">
        <div className="ini-section__head">
          <h3>¿Qué puedes hacer?</h3>
          <p>TODO EN UN SOLO LUGAR</p>
        </div>
        <ul className="ini-actions" role="list">{/*6 items */}</ul>
      </section>

      {/* ===== CATEGORÍAS ===== */}
      <section className="ini-section">
        <div className="ini-section__head">
          <h3>Categorías</h3>
          <p>Explora por tipo de experiencia</p>
        </div>

        <div className="ini-carousel glass">
          <Swiper
            modules={[Autoplay, Pagination, Navigation, A11y, Keyboard]}
            loop
            autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            navigation
            keyboard
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1.2}
            breakpoints={{ 540: { slidesPerView: 2 }, 900: { slidesPerView: 3 } }}
            aria-label="Carrusel de categorías"
          >
            {categorias.map((c, idx) => (
              <SwiperSlide key={c.id}>
                <a href={c.href} className="ini-card hover-raise" aria-label={c.titulo}>
                  <div className="ini-thumb">
                    <img
                      src={catImgs[idx]}
                      onError={onImgError}
                      alt={c.titulo}
                      loading="eager"
                      decoding="async"
                      fetchpriority="high"
                    />
                    <span className="shine" aria-hidden />
                  </div>
                  <span>{c.titulo}</span>
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ===== BANNER ===== */}
      <section className="ini-banner card-3d">
        <img
          src="/ImagenesP/Banners/elige-destino.jpg"
          onError={onImgError}
          alt="Banner informativo"
          loading="eager"
          decoding="async"
          fetchpriority="low"
        />
      </section>

      {/* ===== DEPARTAMENTOS===== */}
      <section className="ini-section" aria-labelledby="deps-title">
        <div className="ini-section__head">
          <h3 id="deps-title">Departamentos</h3>
          <p>Descubre destinos y experiencias por región</p>
        </div>

        <div className="deps-wrap glass">
          <Swiper
            className="deps-swiper"
            modules={[Autoplay, Pagination, Navigation, EffectCoverflow, A11y, Keyboard]}
            effect="coverflow"
            coverflowEffect={{ rotate: 10, stretch: 20, depth: 120, modifier: 1, slideShadows: false }}
            loop
            centeredSlides
            slidesPerView={1.15}
            spaceBetween={16}
            speed={700}
            autoplay={{ delay: 3600, disableOnInteraction: false, pauseOnMouseEnter: true }}
            navigation={{ nextEl: ".deps-nav--next", prevEl: ".deps-nav--prev" }}
            keyboard
            breakpoints={{
              520:  { slidesPerView: 1.5, spaceBetween: 18 },
              900:  { slidesPerView: 2.5, spaceBetween: 20 },
              1200: { slidesPerView: 3.5, spaceBetween: 22 },
              1440: { slidesPerView: 4.2, spaceBetween: 24 },
            }}
            aria-label="Carrusel de departamentos de Colombia"
          >
            {departamentos.map((d) => {
              const slug = slugify(d);
              const src = depImgUrl(slug, "webp");
              return (
                <SwiperSlide key={d}>
                  <a href={`/departamentos/${slug}`} className="dep-card" aria-label={`Ver destinos en ${d}`}>
                    <span className="dep-card__border" aria-hidden />
                    <div className="dep-card__media">
                      <img
                        src={src}
                        alt={d}
                        loading="lazy"
                        decoding="async"
                        className="dep-card__img"
                        onError={(e) => {
                          const triedJpg = e.currentTarget.dataset.fallbackTried;
                          if (!triedJpg) {
                            e.currentTarget.dataset.fallbackTried = "1";
                            e.currentTarget.src = depImgUrl(slug, "jpg");
                          } else {
                            e.currentTarget.src = imgDemo;
                          }
                        }}
                      />
                      <span className="dep-card__skeleton" aria-hidden />
                      <span className="dep-chip">Explorar</span>
                      <span className="shine" aria-hidden />
                    </div>
                    <div className="dep-card__foot">
                      <h4 className="dep-card__title">{d}</h4>
                      <span className="dep-card__cta" aria-hidden></span>
                    </div>
                  </a>
                </SwiperSlide>
              );
            })}
          </Swiper>

          <button className="deps-nav deps-nav--prev" aria-label="Anterior" tabIndex={0}>‹</button>
          <button className="deps-nav deps-nav--next" aria-label="Siguiente" tabIndex={0}>›</button>
        </div>
      </section>
    </main>
  );
};

export default Inicio;
