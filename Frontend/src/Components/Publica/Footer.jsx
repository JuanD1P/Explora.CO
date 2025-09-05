/*FOOTER PRINCIPAL SIN FUNCIONALIDADES*/

import React, { useCallback } from "react";
import "../DOCSS/footer.css";
import logo from "../ImagenesP/InicioUsuario/LOGOFOOTER.png";

const Footer = () => {
  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <footer className="ft" role="contentinfo">
      <div className="ft__inner">
        <div className="ft__brandrow">
          <div className="ft__logoWrap" aria-label="Logo">
            <img src={logo} alt="Logo (demo)" className="ft__logo" />
          </div>

          <nav className="ft__social" aria-label="Redes (ejemplo)">
            <a href="#" className="ft__socialBtn" aria-label="Facebook (ejemplo)">
              <svg viewBox="0 0 24 24" className="ft__ico" aria-hidden="true">
                <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.9h2.54V9.84c0-2.5 1.49-3.9 3.77-3.9 1.09 0 2.22.2 2.22.2v2.44h-1.25c-1.24 0-1.63.77-1.63 1.56v1.86h2.78l-.44 2.9h-2.34V22c4.78-.8 8.44-4.94 8.44-9.94z"/>
              </svg>
            </a>
            <a href="#" className="ft__socialBtn" aria-label="Instagram (ejemplo)">
              <svg viewBox="0 0 24 24" className="ft__ico" aria-hidden="true">
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.51 5.51 0 0 1 12 7.5zm5.75-2.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25z"/>
              </svg>
            </a>
            <a href="#" className="ft__socialBtn" aria-label="LinkedIn (ejemplo)">
              <svg viewBox="0 0 24 24" className="ft__ico" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v15H0zM8 8h4.8v2.06h.07c.67-1.27 2.3-2.6 4.74-2.6C21.6 7.46 24 9.5 24 13.54V23H19v-8.1c0-1.93-.03-4.41-2.69-4.41-2.7 0-3.11 2.1-3.11 4.27V23H8z"/>
              </svg>
            </a>
            <a href="#" className="ft__socialBtn" aria-label="YouTube (ejemplo)">
              <svg viewBox="0 0 24 24" className="ft__ico" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5V8.5L15.5 12l-5.75 3.5z"/>
              </svg>
            </a>
          </nav>
        </div>

        <hr className="ft__rule" />


        <div className="ft__grid">
          <section className="ft__col">
            <h4 className="ft__h4">Explora.CO</h4>
            <p className="ft__text">
              Inspira viajes por Colombia con fotos, mapas y reseñas reales.
            </p>
          </section>

          <section className="ft__col">
            <h5 className="ft__h5">Categorías</h5>
            <ul className="ft__list">
              <li><a href="#">Naturaleza</a></li>
              <li><a href="#">Cultura</a></li>
              <li><a href="#">Gastronomía</a></li>
              <li><a href="#">Aventura</a></li>
            </ul>
          </section>

          <section className="ft__col">
            <h5 className="ft__h5">TODA COLOMBIA</h5>

          </section>

          <section className="ft__col">
            <h5 className="ft__h5">La aventura empieza donde acaban los planes</h5>
          </section>

          {/* BLOQUE CONTACTO */}
          <section className="ft__col ft__contact">
            <h5 className="ft__h5">Contáctenos</h5>
            <a href="tel:+573200000000" className="ft__call">
              <svg viewBox="0 0 24 24" className="ft__callIco" aria-hidden="true">
                <path d="M6.6 10.8a15.05 15.05 0 0 0 6.6 6.6l2.2-2.2a1.2 1.2 0 0 1 1.3-.29c1.4.56 2.9.86 4.5.86a1.2 1.2 0 0 1 1.2 1.2V21a1.2 1.2 0 0 1-1.2 1.2C11.6 22.2 1.8 12.4 1.8 1.2A1.2 1.2 0 0 1 3 0h3c.7 0 1.2.5 1.2 1.2 0 1.6.3 3.1.86 4.5.16.4.08.86-.29 1.3L6.6 10.8z"/>
              </svg>
              +57 320 000 0000
            </a>
            <p className="ft__contactLine">
              <a href="mailto:info@ejemplo.com">ExploraCO@ejemplo.com</a>
            </p>
            <p className="ft__contactLine">Calle Falsa 123, Bogotá</p>
          </section>
        </div>

        {/* BOTTOM BAR */}
        <div className="ft__bottom">
          <div className="ft__legal">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
            <a href="#">Cookies</a>
          </div>
          <p className="ft__copy">© Equipo Explora.CO</p>
          <button className="ft__top" onClick={scrollTop} aria-label="Volver arriba">^</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
