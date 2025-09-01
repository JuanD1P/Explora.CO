import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../ImagenesP/InicioUsuario/LOGOFOOTER.png";
import "./DOCSS/Navbar.css"; // Archivo CSS para estilos

const Navbar = () => {
  const navigate = useNavigate();
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");

  // 👉 Aquí integrarás la API para cargar los departamentos
  useEffect(() => {
    // Ejemplo actual (simulación)
    setDepartamentos(["Cundinamarca", "Antioquia", "Valle del Cauca"]);

    // Cuando integres la API, reemplaza lo de arriba por:
    /*
    fetch("URL_DE_LA_API")
      .then((res) => res.json())
      .then((data) => {
        const listaDepartamentos = [...new Set(data.map(item => item.departamento))].sort();
        setDepartamentos(listaDepartamentos);
      })
      .catch(err => console.error("Error al cargar departamentos:", err));
    */
  }, []);

  // 👉 Aquí integrarás la API para cargar los municipios según el departamento seleccionado
  useEffect(() => {
    if (departamentoSeleccionado === "Cundinamarca") {
      setMunicipios(["Facatativá", "Bogotá", "Soacha"]);
    } else if (departamentoSeleccionado === "Antioquia") {
      setMunicipios(["Medellín", "Envigado", "Bello"]);
    } else if (departamentoSeleccionado === "Valle del Cauca") {
      setMunicipios(["Cali", "Palmira", "Buenaventura"]);
    } else {
      setMunicipios([]);

      // Cuando integres la API, reemplaza lo de arriba por:
      /*
      fetch("URL_DE_LA_API")
        .then((res) => res.json())
        .then((data) => {
          const listaMunicipios = data
            .filter(item => item.departamento === departamentoSeleccionado)
            .map(item => item.municipio)
            .sort();
          setMunicipios(listaMunicipios);
        })
        .catch(err => console.error("Error al cargar municipios:", err));
      */
    }
  }, [departamentoSeleccionado]);

  const handleLogout = () => {
    navigate("/login");
  };

  const handleSearch = () => {
    if (departamentoSeleccionado && municipioSeleccionado) {
      alert(
        `🔍 Buscando en ${departamentoSeleccionado}, ${municipioSeleccionado}`
      );
    } else {
      alert("⚠️ Selecciona primero un departamento y un municipio.");
    }
  };

  return (
    <header className="nv">
      <div className="nv__inner">
        {/* Logo */}
        <div className="nv__logoWrap">
          <img src={logo} alt="Explora.CO" className="nv__logo" />
        </div>

        {/* Selectores */}
        <div className="nv__selectors">
          <select
            value={departamentoSeleccionado}
            onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
            className="nv__select"
          >
            <option value="">Departamento</option>
            {departamentos.map((dep, i) => (
              <option key={i} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          <select
            value={municipioSeleccionado}
            onChange={(e) => setMunicipioSeleccionado(e.target.value)}
            className="nv__select"
            disabled={!departamentoSeleccionado}
          >
            <option value="">Municipio</option>
            {municipios.map((mun, i) => (
              <option key={i} value={mun}>
                {mun}
              </option>
            ))}
          </select>

          {/* Botón Buscar */}
          <button onClick={handleSearch} className="nv__search">
            Buscar
          </button>
        </div>

        {/* Botón cerrar sesión */}
        <button onClick={handleLogout} className="nv__logout">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
