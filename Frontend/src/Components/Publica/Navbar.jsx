import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../ImagenesP/InicioUsuario/LOGOFOOTER.png";
import "../DOCSS/Navbar.css";
import DepartmentCombo from "./DepartmentCombo";

const slugify = (s) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "-");

const DEPARTAMENTOS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca",
  "Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta",
  "Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés","Santander","Sucre","Tolima",
  "Valle del Cauca","Vaupés","Vichada"
];

function avatarFrom(name = "Usuario", photo = "") {
  const fallback = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
  if (!photo) return fallback;
  if (/^https?:\/\//i.test(photo)) return photo;
  try {
    const url = new URL(photo, window.location.origin);
    return url.toString();
  } catch {
    return fallback;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const [depto, setDepto] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  const departamentos = useMemo(
    () => [...DEPARTAMENTOS].sort((a, b) => a.localeCompare(b, "es")),
    []
  );

  const goDepto = (name) => {
    if (!name) return;
    navigate(`/departamentos/${slugify(name)}`);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current || !btnRef.current) return;
      if (!menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const userName = localStorage.getItem("user-name") || localStorage.getItem("nombre_completo") || "Opciones";
  const userPhoto = localStorage.getItem("user-avatar") || localStorage.getItem("foto_url") || "";
  const userAvatar = avatarFrom(userName, userPhoto);

  return (
    <header className={`nv ${stuck ? "nv--stuck" : ""}`} role="banner">
      <div className="nv__inner">
        <button className="nv__logoWrap" onClick={() => navigate("/Inicio")} aria-label="Ir al inicio">
          <img src={logo} alt="Explora.CO" className="nv__logo" />
        </button>

        <div className="nv__center">
          <DepartmentCombo
            items={departamentos}
            value={depto}
            onChange={setDepto}
            onEnter={goDepto}
            placeholder="Buscar Dpto (ctrl+k)"
            id="navbar-depto"
          />
          <button
            className="nv__btn nv__btn--primary"
            onClick={() => goDepto(depto)}
            disabled={!departamentoValido(depto, departamentos)}
            aria-disabled={!departamentoValido(depto, departamentos)}
            title="Ir al departamento"
          >
            <span className="nv__btnIcon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11 4a7 7 0 015.291 11.707l3.001 3.002-1.414 1.414-3.002-3A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z" fill="currentColor"/></svg>
            </span>
            Buscar
          </button>
        </div>

        <div className="nv__user">
          <button
            ref={btnRef}
            className="userBtn"
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="menuUsuario"
          >
            <span className="userBtn__avatar" aria-hidden="true">
              <img
                src={userAvatar}
                alt=""
                className="userBtn__avatarImg"
                onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userName)}`; }}
              />
            </span>
            <span className="userBtn__name">{userName || "Mi cuenta"}</span>
            <svg className={`chev ${menuOpen ? "is-open" : ""}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div
            ref={menuRef}
            id="menuUsuario"
            role="menu"
            className={`menu ${menuOpen ? "is-open" : ""}`}
          >

            <div className="menu__sep" role="separator" />
            <button
              role="menuitem"
              className="menu__item menu__item--danger"
              onClick={() => { setMenuOpen(false); navigate("/userlogin"); }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function departamentoValido(v, list) {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return list.some(d => d.toLowerCase() === s);
}
