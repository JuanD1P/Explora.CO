import React, { useMemo } from "react";
import { motion } from "framer-motion";
import "./DOCSS/InicioEmpresa.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";
import fondoEmp from "../ImagenesP/ImagenesEmp/fondo_emp.jpg";

const publicacionesDemo = [
  {
    id: 1,
    titulo: "Promo fin de semana",
    desc: "20% de descuento en tours de aventura.",
    img: "/ImagenesP/Empresa/promo-1.jpg",
  },
  {
    id: 2,
    titulo: "Nuevo paquete corporativo",
    desc: "Eventos y convenciones en la zona cafetera.",
    img: "/ImagenesP/Empresa/promo-2.jpg",
  },
  {
    id: 3,
    titulo: "Experiencia gastronómica",
    desc: "Sabores locales con chefs invitados.",
    img: "/ImagenesP/Empresa/promo-3.jpg",
  },
  {
    id: 4,
    titulo: "Temporada de ballenas",
    desc: "Salida especial con guías certificados.",
    img: "/ImagenesP/Empresa/promo-4.jpg",
  },
];

const fadeUp = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };

const IconPlus = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden {...props}>
    <circle cx="24" cy="24" r="22" fill="currentColor" opacity=".1" />
    <path d="M24 14v20M14 24h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path d="M4 20h4l10-10-4-4L4 16v4z" fill="currentColor" />
  </svg>
);

const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path d="M6 7h12M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const IconEye = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path d="M1.5 12S5.5 5.5 12 5.5 22.5 12 22.5 12 18.5 18.5 12 18.5 1.5 12 1.5 12z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);

const InicioE = () => {
  const { cards } = useMemo(() => {
    const cards = publicacionesDemo;
    return { cards };
  }, []);

  const onImgError = (e) => { e.currentTarget.src = imgDemo; e.currentTarget.onerror = null; };

  return (
    <main className="emp-root">
      {/* HEADER */}
      <header className="emp-header glass">
        <div className="emp-brand">
          <span className="emp-logo" aria-hidden>🏢</span>
          <strong>Panel de Empresa</strong>
        </div>
        <nav className="emp-nav">
          <a href="/empresa/inicio" className="emp-link">Inicio</a>
          <a href="/empresa/mis-publicaciones" className="emp-link">Mis publicaciones</a>
          <a href="/empresa/estadisticas" className="emp-link">Estadísticas</a>
          <a href="/ayuda" className="emp-link">Ayuda</a>
          <button className="emp-avatar" aria-label="Perfil de empresa">👤</button>
        </nav>
      </header>

      {/* HERO DE ACCIONES */}
      <section className="emp-hero card-3d">
        <motion.div
          className="emp-cta"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: .55, ease: "easeOut" }}
        >
          <button className="emp-create-btn" onClick={() => (window.location.href = "/empresa/crear-publicacion")}>
            <IconPlus className="emp-plus" />
            <span>Crear publicación</span>
          </button>

          <p className="emp-hero-title">Agrega tu publicación</p>

          <a className="emp-secondary-btn" href="/empresa/mis-publicaciones" role="button">
            Ver mis publicaciones
          </a>
        </motion.div>
      </section>

      {/* GRID DE PUBLICACIONES */}
      <section className="emp-section">
        <div className="emp-section__head">
          <h3>Publicaciones recientes</h3>
          <p>Gestiona y mejora tu alcance</p>
        </div>

        <div className="emp-grid">
          {cards.map((c) => (
            <motion.article
              key={c.id}
              className="emp-card hover-raise"
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: .3 }}
              transition={{ duration: .4, ease: "easeOut" }}
            >
              <div className="emp-card__media">
                <img src={c.img} onError={onImgError} alt={c.titulo} loading="lazy" />
              </div>
              <div className="emp-card__body">
                <h4 className="emp-card__title">{c.titulo}</h4>
                <p className="emp-card__desc">{c.desc}</p>
              </div>
              <footer className="emp-card__actions">
                <button className="icon-btn" title="Editar">
                  <IconEdit />
                </button>
                <button className="icon-btn" title="Eliminar">
                  <IconTrash />
                </button>
                <a className="icon-btn" href={`/empresa/publicacion/${c.id}`} title="Ver">
                  <IconEye />
                </a>
              </footer>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="emp-footer">
        <small>© {new Date().getFullYear()} Tu Empresa — Panel de publicaciones</small>
      </footer>
    </main>
  );
};

export default InicioE;