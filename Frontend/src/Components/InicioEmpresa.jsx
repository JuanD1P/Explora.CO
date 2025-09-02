import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import "./DOCSS/InicioEmpresa.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

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
    <path
      d="M24 14v20M14 24h20"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const InicioE = () => {
  const { cards } = useMemo(() => {
    const cards = publicacionesDemo;
    return { cards };
  }, []);

  const navigate = useNavigate(); 

  const onImgError = (e) => {
    e.currentTarget.src = imgDemo;
    e.currentTarget.onerror = null;
  };

  return (
    <main className="emp-root">
      {/* HEADER */}
      <header className="emp-header glass">
        <div className="emp-brand">
          <span className="emp-logo" aria-hidden>
            🏢
          </span>
          <strong>Panel de Empresa</strong>
        </div>
        <nav className="emp-nav">
          <a href="/empresa/inicio" className="emp-link">
            Inicio
          </a>
          <a href="/empresa/mis-publicaciones" className="emp-link">
            Mis publicaciones
          </a>
          <a href="/empresa/estadisticas" className="emp-link">
            Estadísticas
          </a>
          <a href="/ayuda" className="emp-link">
            Ayuda
          </a>
          <button className="emp-avatar" aria-label="Perfil de empresa">
            👤
          </button>
        </nav>
      </header>

      {/* HERO DE ACCIONES */}
      <section className="emp-hero card-3d">
        <motion.div
          className="emp-cta"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <button
            className="emp-create-btn"
            onClick={() => navigate("/PerfilEmpresa")} 
          >
            <IconPlus className="emp-plus" />
            <span>Crear publicación</span>
          </button>
          <button
            className="emp-create-btn"
            onClick={() => navigate("/EventosLugar")} 
          >
            <IconPlus className="emp-plus" />
            <span>Crear Eventos Para tus Lugares</span>
          </button>

          <p className="emp-hero-title">Agrega tu publicación</p>

          <a
            className="emp-secondary-btn"
            href="/empresa/mis-publicaciones"
            role="button"
          >
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
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="emp-card__media">
                <img
                  src={c.img}
                  onError={onImgError}
                  alt={c.titulo}
                  loading="lazy"
                />
              </div>
              <div className="emp-card__body">
                <h4 className="emp-card__title">{c.titulo}</h4>
                <p className="emp-card__desc">{c.desc}</p>
              </div>
              <footer className="emp-card__actions">
                <button className="icon-btn" title="Editar">
                  ✏️
                </button>
                <button className="icon-btn" title="Eliminar">
                  🗑️
                </button>
                <a
                  className="icon-btn"
                  href={`/empresa/publicacion/${c.id}`}
                  title="Ver"
                >
                  👁️
                </a>
              </footer>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="emp-footer">
        <small>
          © {new Date().getFullYear()} Tu Empresa — Panel de publicaciones
        </small>
      </footer>
    </main>
  );
};

export default InicioE;
