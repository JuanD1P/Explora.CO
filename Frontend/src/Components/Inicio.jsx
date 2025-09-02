
import React, { useMemo } from "react";
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
    const depImgs = departamentos.map(d => `/ImagenesP/Departamentos/${slugify(d)}.jpg`);
    return { heroImgs, catImgs, depImgs };
  }, []);


  const onImgError = (e) => { e.currentTarget.src = imgDemo; e.currentTarget.onerror = null; };
  const fadeUp = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <main className="ini-root" role="main">

      <div aria-hidden className="ini-hero-bg">
        <span className="ini-bg-bubble b1" />
        <span className="ini-bg-bubble b2" />
        <span className="ini-bg-bubble b3" />
      </div>


      <section className="ini-intro">
        <motion.div
          className="ini-intro__text glass"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: .35 }}
          transition={{ duration: .5, ease: "easeOut" }}
        >
          <h1 className="ini-title">Explora.CO</h1>
          <h2 className="ini-h2">Descubre Colombia</h2>
          <p>
            Encuentra lugares increíbles con fotos, descripciones, mapas y reseñas reales. Filtra por
            <em> naturaleza</em>, <em> cultura</em>, <em> gastronomía</em> y <em> aventura</em>.
          </p>
          <p className="ini-muted">Hecho para viajeros, operadores y entidades — todo en una sola experiencia.</p>
        </motion.div>

        <motion.div
          className="ini-hero card-3d"
          initial={{ scale: .99, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: .35 }}
          transition={{ duration: .5, ease: "easeOut" }}
        >
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
                  initial={{ scale: 1.015 }}
                  animate={{ scale: 1.055 }}
                  transition={{ duration: 9, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </section>

      {/* ===== ¿QUÉ PUEDES HACER? ===== */}
      <section className="ini-section">
        <div className="ini-section__head">
          <h3>¿Qué puedes hacer?</h3>
          <p>TODO EN UN SOLO LUGAR</p>
        </div>

        <ul className="ini-actions" role="list">
          {/* Toda Colombia */}
          <li className="ini-action hover-raise" tabIndex={0}>
            <div className="ini-illu">
              <svg viewBox="0 0 160 120" className="illu" aria-hidden>
                <defs>
                  <linearGradient id="glow" x1="0" x2="1">
                    <stop offset="0" stopColor="#0ea5e9"/>
                    <stop offset="1" stopColor="#0369a1"/>
                  </linearGradient>
                </defs>
                <path d="M15 75c0-28 24-50 60-50s70 22 70 50-30 32-66 32-64-4-64-32z" fill="url(#glow)" opacity=".12"/>
                <g stroke="#0b2f4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M60 84c-10-6-16-17-16-29 0-19 15-34 34-34s34 15 34 34c0 12-6 23-16 29" opacity=".3"/>
                  <circle cx="78" cy="56" r="6"/>
                  <path d="M78 62v20"/>
                </g>
                <path d="M108 24v58" stroke="#0b2f4a" strokeWidth="3" strokeLinecap="round"/>
                <g transform="translate(109 28)" aria-label="Bandera de Colombia">
                  <path className="flag f1" d="M0 0 C18 4, 28 -4, 44 2 L44 12 C28 6, 18 14, 0 10 Z" fill="#FCD116"/>
                  <path className="flag f2" d="M0 10 C18 14, 28 6, 44 12 L44 20 C28 14, 18 22, 0 18 Z" fill="#0038A8"/>
                  <path className="flag f3" d="M0 18 C18 22, 28 14, 44 20 L44 28 C28 22, 18 30, 0 26 Z" fill="#CE1126"/>
                </g>
              </svg>
            </div>
            <div className="ini-action__body">
              <h4>Toda Colombia</h4>
              <p>Explora destinos de norte a sur con la bandera ondeando como bienvenida.</p>
            </div>
          </li>

          {/* Busca rápido */}
          <li className="ini-action hover-raise" tabIndex={0}>
            <div className="ini-illu illu--blue">
              <svg viewBox="0 0 160 120" className="illu" aria-hidden>
                <path d="M15 75c0-28 24-50 60-50s70 22 70 50-30 32-66 32-64-4-64-32z" fill="#0ea5e9" opacity=".12"/>
                <g stroke="#0b2f4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="30" y="30" width="60" height="40" rx="6"/>
                  <path d="M40 42h40M40 50h28"/>
                  <circle cx="102" cy="62" r="16"/>
                  <path d="M112 72l12 12"/>
                </g>
              </svg>
            </div>
            <div className="ini-action__body">
              <h4>Busca rápido</h4>
              <p>Encuentra lugares al instante con filtros por interés.</p>
            </div>
          </li>

          {/* Compara con confianza */}
          <li className="ini-action hover-raise" tabIndex={0}>
            <div className="ini-illu illu--gold">
              <svg viewBox="0 0 160 120" className="illu" aria-hidden>
                <path d="M15 75c0-28 24-50 60-50s70 22 70 50-30 32-66 32-64-4-64-32z" fill="#E7C46A" opacity=".15"/>
                <g stroke="#0b2f4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="28" y="28" width="48" height="60" rx="8"/>
                  <rect x="84" y="36" width="48" height="52" rx="8"/>
                  <path d="M40 44h24M92 52h28M92 62h18M92 72h24"/>
                  <rect x="98" y="42" width="10" height="10" fill="#0ea5e9" stroke="none" rx="2"/>
                  <rect x="112" y="42" width="10" height="10" fill="#C89B3C" stroke="none" rx="2"/>
                </g>
              </svg>
            </div>
            <div className="ini-action__body">
              <h4>Compara con confianza</h4>
              <p>Reseñas y servicios en una sola vista. Sin sorpresas.</p>
            </div>
          </li>

          {/* Ahorra a lo grande */}
          <li className="ini-action hover-raise" tabIndex={0}>
            <div className="ini-illu illu--rose">
              <svg viewBox="0 0 160 120" className="illu" aria-hidden>
                <path d="M15 75c0-28 24-50 60-50s70 22 70 50-30 32-66 32-64-4-64-32z" fill="#f43f5e" opacity=".12"/>
                <g stroke="#0b2f4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="36" y="50" width="88" height="24" rx="6"/>
                  <rect x="52" y="40" width="56" height="12" rx="6"/>
                  <path d="M46 62h8M106 62h8" />
                  <rect x="72" y="20" width="16" height="12" rx="3"/>
                  <text x="80" y="29" textAnchor="middle" fontSize="10" fill="#0b2f4a" fontWeight="700">$</text>
                </g>
              </svg>
            </div>
            <div className="ini-action__body">
              <h4>Busca a lo Grande</h4>
              <p>Contacta con las empresas directamente.</p>
            </div>
          </li>

          {/* Rutas y mapas */}
          <li className="ini-action hover-raise" tabIndex={0}>
            <div className="ini-illu illu--green">
              <svg viewBox="0 0 160 120" className="illu" aria-hidden>
                <path d="M15 75c0-28 24-50 60-50s70 22 70 50-30 32-66 32-64-4-64-32z" fill="#10b981" opacity=".12"/>
                <g stroke="#0b2f4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M40 88c16-24 32-24 48-12s24 12 36 4" />
                  <circle cx="56" cy="64" r="8"/>
                  <path d="M56 72v12"/>
                  <circle cx="116" cy="72" r="6"/>
                  <path d="M116 78v8"/>
                </g>
              </svg>
            </div>
            <div className="ini-action__body">
              <h4>Rutas y mapas</h4>
              <p>Navegación sin enredos.</p>
            </div>
          </li>

          {/* Reseñas */}
          <li className="ini-action hover-raise" tabIndex={0}>
            <div className="ini-illu illu--purple">
              <svg viewBox="0 0 160 120" className="illu" aria-hidden>
                <path d="M15 75c0-28 24-50 60-50s70 22 70 50-30 32-66 32-64-4-64-32z" fill="#8b5cf6" opacity=".12"/>
                <g stroke="#0b2f4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="28" y="36" width="104" height="48" rx="10"/>
                  <path d="M40 56h10M58 56h10M76 56h10" />
                  <g fill="#f59e0b" stroke="none">
                    <polygon points="52,74 55,66 58,74 66,74 60,79 62,87 55,82 48,87 50,79 44,74"/>
                  </g>
                </g>
              </svg>
            </div>
            <div className="ini-action__body">
              <h4>Reseñas de viajeros</h4>
              <p>Opiniones verificadas y fotos reales para decidir sin dudas.</p>
            </div>
          </li>
        </ul>
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
                    <img src={catImgs[idx]} onError={onImgError} alt={c.titulo} loading="lazy" decoding="async" />
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
      <motion.section
        className="ini-banner card-3d"
        initial={{ y: 14, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: .35 }}
        transition={{ duration: .5, ease: "easeOut" }}
      >
        <img src="/ImagenesP/Banners/elige-destino.jpg" onError={onImgError} alt="Banner informativo" />
      </motion.section>

      {/* ===== DEPARTAMENTOS  ===== */}
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
            {departamentos.map((d, idx) => {
              const src = depImgs[idx];
              const slug = slugify(d);
              return (
                <SwiperSlide key={d}>
                  <a href={`/departamentos/${slug}`} className="dep-card" aria-label={`Ver destinos en ${d}`}>
                    <span className="dep-card__border" aria-hidden />
                    <div className="dep-card__media">
                      <img
                        src={src}
                        onError={onImgError}
                        alt={d}
                        loading="lazy"
                        decoding="async"
                        className="dep-card__img"
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
