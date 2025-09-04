import React from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import "./DOCSS/InicioEmpresa.css";
import imgDemo from "../ImagenesP/InicioUsuario/ImagenPrueba.png";

/* ====== FRONT: base de API y helper fetch ====== */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

async function apiDeletePerfil(id) {
  const res = await fetch(`${API_BASE}/perfiles/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "Error al eliminar";
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

const fadeUp = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };

const IconPlus = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden {...props}>
    <circle cx="24" cy="24" r="22" fill="currentColor" opacity=".1" />
    <path d="M24 14v20M14 24h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const InicioE = () => {
  const navigate = useNavigate();

  const [items, setItems]   = React.useState([]);   // perfiles desde API
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState("");

  // Si tienes auth, toma el id de empresa del usuario logueado
  // const empresaId = JSON.parse(localStorage.getItem("user"))?.id;
  const empresaId = null; // si es null, trae todos

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const url = empresaId
          ? `${API_BASE}/perfiles?empresa_id=${empresaId}`
          : `${API_BASE}/perfiles`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("No se pudieron cargar las publicaciones");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setError("");
      } catch (e) {
        setError(e.message || "Error cargando publicaciones");
      } finally {
        setLoading(false);
      }
    })();
  }, [empresaId]);

  const onImgError = (e) => {
    e.currentTarget.src = imgDemo;
    e.currentTarget.onerror = null;
  };

  const handleEdit = (id) => navigate(`/empresa/editar-publicacion/${id}`);
  const handleView = (id) => navigate(`/empresa/publicacion/${id}`);

  const handleDelete = async (id) => {
    const ok = confirm("¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await apiDeletePerfil(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      alert(e.message || "No se pudo eliminar");
    }
  };

  return (
    <main className="emp-root">
      {/* HEADER */}
      <header className="emp-header glass">
        <div className="emp-brand">
          <span className="emp-logo" aria-hidden>🏢</span>
          <strong>Panel de Empresa</strong>
        </div>
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
          <button className="emp-create-btn" onClick={() => navigate("/PerfilEmpresa")}>
            <IconPlus className="emp-plus" />
            <span>Crear publicación</span>
          </button>
          <button className="emp-create-btn" onClick={() => navigate("/EventosLugar")}>
            <IconPlus className="emp-plus" />
            <span>Crear Evento</span>
          </button>
        </motion.div>
      </section>

      {/* GRID DE PUBLICACIONES */}
      <section className="emp-section emp-section--glass">
        <div className="emp-section__head">
          <h3>Publicaciones recientes</h3>
          <p>Gestiona y mejora tu alcance</p>
        </div>

        {loading && <div style={{ padding: 12 }}>Cargando publicaciones…</div>}
        {error && !loading && <div style={{ padding: 12, color: "crimson" }}>{error}</div>}

        <div className="emp-grid">
          {!loading && !items.length && !error && (
            <div style={{ gridColumn: "1/-1", padding: 12 }}>No hay publicaciones aún.</div>
          )}

          {items.map((p) => {
            // Tu backend devuelve { fotos: [{ imagen_url }] }
            const firstImg = p.fotos?.[0]?.imagen_url || imgDemo;
            const title   = p.nombre_lugar || p.titulo || "Publicación";
            const desc    = p.descripcion || p.desc || "";

            return (
              <motion.article
                key={p.id}
                className="emp-card hover-raise"
                initial={{ y: 12, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="emp-card__media">
                  <img src={firstImg} onError={onImgError} alt={title} loading="lazy" />
                </div>
                <div className="emp-card__body">
                  <h4 className="emp-card__title">{title}</h4>
                  <p className="emp-card__desc">{desc}</p>
                </div>
                <footer className="emp-card__actions">
                  <button className="icon-btn" title="Editar" onClick={() => handleEdit(p.id)}>✏️</button>
                  <button className="icon-btn" title="Eliminar" onClick={() => handleDelete(p.id)}>🗑️</button>
                  <button className="icon-btn" title="Ver" onClick={() => handleView(p.id)} aria-label={`Ver ${title}`}>👁️</button>
                </footer>
              </motion.article>
            );
          })}
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
