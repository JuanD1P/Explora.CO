import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../ImagenesP/InicioUsuario/LOGOFOOTER.png";
import "./DOCSS/Navbar.css";


const COL_JSON =
  "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json";

const Navbar = () => {
  const navigate = useNavigate();
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [dataColombia, setDataColombia] = useState([]); 

  // 🔹 Cargar todos los departamentos desde la API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(COL_JSON);
        const data = await res.json(); 
        setDataColombia(data);
        const listaDepartamentos = data
          .map((d) => d.departamento)
          .sort((a, b) => a.localeCompare(b, "es"));
        setDepartamentos(listaDepartamentos);
      } catch (err) {
        console.error("Error al cargar departamentos:", err);
      }
    })();
  }, []);

  // 🔹 Cargar municipios según el departamento seleccionado
  useEffect(() => {
    if (!departamentoSeleccionado) {
      setMunicipios([]);
      return;
    }

    const depto = dataColombia.find(
      (d) => d.departamento === departamentoSeleccionado
    );
    if (depto) {
      const listaMunicipios = [...depto.ciudades].sort((a, b) =>
        a.localeCompare(b, "es")
      );
      setMunicipios(listaMunicipios);
    } else {
      setMunicipios([]);
    }
  }, [departamentoSeleccionado, dataColombia]);

  const handleLogout = () => {
    navigate("/userlogin");
  };

  // 🔹 Acción de búsqueda
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
        <div className="nv__logoWrap" onClick={() => navigate("/Inicio")}>
          <img src={logo} alt="Explora.CO" className="nv__logo" />
        </div>

        {/* Selectores */}
        <div className="nv__selectors">
          {/* Departamentos */}
          <select
            value={departamentoSeleccionado}
            onChange={(e) => {
              setDepartamentoSeleccionado(e.target.value);
              setMunicipioSeleccionado(""); 
            }}
            className="nv__select"
          >
            <option value="">Departamento</option>
            {departamentos.map((dep, i) => (
              <option key={i} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          {/* Municipios */}
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
