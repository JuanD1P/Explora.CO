/*---------------- CREACIÓN DE PUBLICACIONES ----------------*/
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../DOCSS/PerfilEmpresa.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const API_URL = "http://localhost:3000";
const UPLOADS_HOST = "http://localhost:3000";
const COL_JSON =
  "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

const CATEGORIAS = [
  "Atractivos Naturales",
  "Atractivos Culturales",
  "Atractivos Recreativos",
  "Atractivos Gastronómicos",
  "Atractivos Arqueológicos",
  "Atractivos Históricos",
];

const EMPRESA_ID = parseInt(localStorage.getItem("user-id"), 10);
const MAX_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// Bounding box Colombia [minLon, minLat, maxLon, maxLat]
const CO_BBOX = [-79.02, -4.24, -66.85, 13.52];
const withinColombia = (lat, lng) =>
  lng >= CO_BBOX[0] && lng <= CO_BBOX[2] && lat >= CO_BBOX[1] && lat <= CO_BBOX[3];

const slugify2 = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const RAPID_HOURS = [
  { k: "none", label: "— Elegir manual —", desde: "", hasta: "" },
  { k: "8-17", label: "Lunes a Domingo · 8:00–17:00", desde: "08:00", hasta: "17:00" },
  { k: "9-18", label: "Lunes a Domingo · 9:00–18:00", desde: "09:00", hasta: "18:00" },
  { k: "10-19", label: "Lunes a Domingo · 10:00–19:00", desde: "10:00", hasta: "19:00" },
];

const PerfilEmpresa = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // ------ Form datos del lugar ------
  const [nombreLugar, setNombreLugar] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad, setCiudad] = useState(""); // se guarda como dep/mun
  const [direccion, setDireccion] = useState("");

  // Departamento/Municipio
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [deptos, setDeptos] = useState([]);
  const [munis, setMunis] = useState([]);

  // Horarios / precios
  const [horarioDesde, setHorarioDesde] = useState("");
  const [horarioHasta, setHorarioHasta] = useState("");
  const [horarioPreset, setHorarioPreset] = useState("none");
  const [moneda, setMoneda] = useState("COP");
  const [precioDesde, setPrecioDesde] = useState("");
  const [precioHasta, setPrecioHasta] = useState("");
  const [infoPrecios, setInfoPrecios] = useState("");

  // Fotos
  const [fotoPrincipal, setFotoPrincipal] = useState(null);
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState(null);
  const [fotosExtra, setFotosExtra] = useState([]);
  const [fotosExistentes, setFotosExistentes] = useState([]);
  const addExtraInputRef = useRef(null);
  const principalInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  // ------ Avatar empresa ------
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // ------ Mapa / ubicación ------
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loc, setLoc] = useState({ lat: 4.711, lng: -74.0721, address: "", chosen: false });
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoErr, setGeoErr] = useState("");
  const center = useMemo(() => [loc.lat, loc.lng], [loc.lat, loc.lng]);

  // ------- helpers upload -------
  const fileIsOk = (f) => {
    const okType = ACCEPTED.includes(f.type);
    const okSize = f.size <= MAX_MB * 1024 * 1024;
    if (!okType) alert("Solo se permiten JPG, PNG o WEBP.");
    if (!okSize) alert(`El archivo supera ${MAX_MB}MB.`);
    return okType && okSize;
  };

  // ------- Avatar -------
  const onPickAvatar = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f || !fileIsOk(f)) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const subirAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return alert("Selecciona una imagen");
    const fd = new FormData();
    fd.append("empresa_id", String(EMPRESA_ID));
    fd.append("avatar", avatarFile);
    try {
      setSubiendoAvatar(true);
      const res = await fetch(`${API_URL}/api/empresa/avatar`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al subir avatar");
      alert("Foto de perfil actualizada");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendoAvatar(false);
    }
  };

  // ------- Fotos -------
  const onPickPrincipal = (file) => {
    if (!file || !fileIsOk(file)) return;
    setFotoPrincipal(file);
    setFotoPrincipalPreview(URL.createObjectURL(file));
  };

  const onAddExtraFromHidden = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file || !fileIsOk(file)) return;
    setFotosExtra((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
    e.target.value = "";
  };

  const removeExtraAt = (idx) => setFotosExtra((prev) => prev.filter((_, i) => i !== idx));

  // ====== geolocalización / mapa ======
  const NOMI_SEARCH = "https://nominatim.openstreetmap.org/search";
  const NOMI_REVERSE = "https://nominatim.openstreetmap.org/reverse";

  // Sugerencias restringidas a Colombia
  const searchAddress = async (text) => {
    try {
      if (!text || text.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      const url = `${NOMI_SEARCH}?format=json&q=${encodeURIComponent(
        text
      )}&addressdetails=1&limit=6&countrycodes=co&viewbox=${CO_BBOX[0]},${CO_BBOX[3]},${CO_BBOX[2]},${CO_BBOX[1]}&bounded=1`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(
        data.map((d) => ({
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          display: d.display_name,
          city: d.address?.city || d.address?.town || d.address?.village || "",
        }))
      );
    } catch {
      setSuggestions([]);
    }
  };

  const handlePickSuggestion = (s) => {
    if (!withinColombia(s.lat, s.lng)) {
      alert("Solo direcciones dentro de Colombia.");
      return;
    }
    setLoc({ lat: s.lat, lng: s.lng, address: s.display, chosen: true });
    setDireccion(s.display);
    if (s.city && !municipio) setMunicipio(s.city);
    setQuery(s.display);
    setSuggestions([]);
  };

  async function geocodeMunicipio(dep, mun) {
    const q = `${mun}, ${dep}, Colombia`;
    const url = `${NOMI_SEARCH}?format=json&q=${encodeURIComponent(
      q
    )}&addressdetails=1&limit=1&countrycodes=co&viewbox=${CO_BBOX[0]},${CO_BBOX[3]},${CO_BBOX[2]},${CO_BBOX[1]}&bounded=1`;
    const res = await fetch(url);
    const data = await res.json();
    const hit = data?.[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat),
      lng = parseFloat(hit.lon);
    if (!withinColombia(lat, lng)) return null;
    return { lat, lng, display: hit.display_name, address: hit.address };
  }

  async function centerOnMunicipio(dep, mun) {
    const hit = await geocodeMunicipio(dep, mun);
    if (!hit) {
      alert("No se pudo ubicar el municipio en Colombia.");
      return;
    }
    setLoc({ lat: hit.lat, lng: hit.lng, address: hit.display, chosen: true });
    setDireccion(hit.display);
    setQuery(hit.display);
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      if (!withinColombia(lat, lng)) {
        alert("Solo se permiten ubicaciones dentro de Colombia.");
        return;
      }
      const url = `${NOMI_REVERSE}?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url);
      const data = await res.json();
      const display = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLoc({ lat, lng, address: display, chosen: true });
      setDireccion(display);
      const city = data?.address?.city || data?.address?.town || data?.address?.village || "";
      if (city) setMunicipio(city);
      setQuery(display);
    } catch {
      setLoc({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, chosen: true });
    }
  };

  const ClickToSetMarker = () => {
    useMapEvents({
      click(e) {
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  // ==================== Cargar JSON Colombia ====================
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(COL_JSON);
        const data = await res.json();
        const shape = data.map((d) => ({
          nombre: d.departamento,
          slug: slugify2(d.departamento),
          municipios: (d.ciudades || []).map((c) => ({
            nombre: c,
            slug: slugify2(c),
          })),
        }));
        setDeptos(shape.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      } catch {
        setDeptos([]);
      }
    })();
  }, []);

  // ==================== Cargar datos en edición ====================
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/perfiles/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el perfil");

        setNombreLugar(data.nombre_lugar || "");
        setCategoria(data.categoria || "");
        setDescripcion(data.descripcion || "");
        setDireccion(data.direccion || "");
        setQuery(data.direccion || "");
        setLoc({
          lat: Number(data.lat) || 4.711,
          lng: Number(data.lng) || -74.0721,
          address: data.direccion || "",
          chosen: true,
        });

        const ciudadStr = data.ciudad || "";
        setCiudad(ciudadStr);
        const parts = ciudadStr.split("/");
        if (parts.length === 2) {
          setDepartamento(parts[0]);
          setMunicipio(parts[1]);
          const depObj = deptos.find((d) => d.nombre === parts[0]);
          if (depObj) setMunis(depObj.municipios);
        }

        setHorarioDesde(data.horario_desde ? String(data.horario_desde).slice(0, 5) : "");
        setHorarioHasta(data.horario_hasta ? String(data.horario_hasta).slice(0, 5) : "");
        setMoneda(data.moneda || "COP");
        setPrecioDesde(data.precio_desde ?? "");
        setPrecioHasta(data.precio_hasta ?? "");
        setInfoPrecios(data.info_precios || "");

        const fotos = Array.isArray(data.fotos) ? data.fotos : [];
        setFotosExistentes(fotos);
        if (fotos[0]?.imagen_url) {
          setFotoPrincipalPreview(`${UPLOADS_HOST}${fotos[0].imagen_url}`);
        }
      } catch (e) {
        console.error(e);
        alert(e.message);
      }
    })();
  }, [isEdit, id, deptos]);

  // ====== Ubicación actual ======
  const getMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoErr("Este navegador no soporta geolocalización.");
      return;
    }
    setGeoStatus("prompt");
    setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoStatus("granted");
        await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGeoStatus(err.code === 1 ? "denied" : "error");
        setGeoErr(
          err.code === 1 ? "Permiso de ubicación denegado" : "No fue posible obtener la ubicación."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Presets de horario
  useEffect(() => {
    const preset = RAPID_HOURS.find((p) => p.k === horarioPreset);
    if (!preset || preset.k === "none") return;
    setHorarioDesde(preset.desde);
    setHorarioHasta(preset.hasta);
  }, [horarioPreset]);

  // ------- Enviar -------
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!nombreLugar || !categoria || !departamento || !municipio || !direccion) {
      alert("Completa los campos obligatorios");
      return;
    }
    if (!withinColombia(loc.lat, loc.lng)) {
      alert("Selecciona una ubicación válida dentro de Colombia.");
      return;
    }

    if ((horarioDesde && !horarioHasta) || (!horarioDesde && horarioHasta)) {
      return alert("Si defines horario, completa ambos: desde y hasta.");
    }
    if (horarioDesde && horarioHasta && horarioDesde >= horarioHasta) {
      return alert('El horario "desde" debe ser menor al "hasta".');
    }

    const pDesde = precioDesde ? parseFloat(precioDesde) : null;
    const pHasta = precioHasta ? parseFloat(precioHasta) : null;
    if ((pDesde !== null && pDesde < 0) || (pHasta !== null && pHasta < 0))
      return alert("Los precios no pueden ser negativos.");
    if (pDesde !== null && pHasta !== null && pDesde > pHasta)
      return alert('"Precio desde" no puede ser mayor a "precio hasta".');

    const ciudadCompuesta = `${departamento}/${municipio}`;

    const formData = new FormData();
    formData.append("empresa_id", String(EMPRESA_ID));
    formData.append("nombre_lugar", nombreLugar);
    formData.append("categoria", categoria);
    formData.append("descripcion", descripcion);
    formData.append("ciudad", ciudadCompuesta);
    formData.append("direccion", direccion);
    formData.append("lat", String(loc.lat));
    formData.append("lng", String(loc.lng));
    formData.append("horario_desde", horarioDesde || "");
    formData.append("horario_hasta", horarioHasta || "");
    formData.append("moneda", moneda || "COP");
    formData.append("precio_desde", precioDesde || "");
    formData.append("precio_hasta", precioHasta || "");
    formData.append("info_precios", infoPrecios || "");

    if (fotoPrincipal) formData.append("fotos", fotoPrincipal);
    fotosExtra.forEach(({ file }) => formData.append("fotos", file));

    try {
      setLoading(true);
      const url = isEdit ? `${API_URL}/api/perfiles/${id}` : `${API_URL}/api/perfiles`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, body: formData, credentials: "include" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || (isEdit ? "No se pudo actualizar" : "Error al crear"));
      navigate("/InicioEmpresa");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pe-root">
      {/* ENCABEZADO */}
      <header className="pe-header glass card-3d">
        <div className="pe-header__left">
          {/* 🔙 Botón para regresar */}
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate("/InicioEmpresa")}
            style={{ marginRight: 12 }}
          >
            Inicio
          </button>
          <span className="pe-logo" aria-hidden>🏢</span>
          <div>
            <h1>{isEdit ? "Editar lugar" : "Perfil de Lugar"}</h1>
            <p>{isEdit ? "Actualiza los datos de tu publicación" : "Crea un lugar atractivo para tus visitantes"}</p>
          </div>
        </div>
      
      </header>

      {/* CONTENIDO */}
      <form onSubmit={onSubmit} className="pe-form card-3d">
        {/* Columna izquierda */}
        <section className="pe-col">
          <div className="pe-block">
            <div className="pe-block__head">
              <h3>Información del lugar</h3>
              <p>Lo esencial para que la gente te encuentre</p>
            </div>

            <div className="pe-grid">
              <div className="field">
                <label>Nombre del lugar *</label>
                <input type="text" value={nombreLugar} onChange={(e) => setNombreLugar(e.target.value)} placeholder="Ej: Cascadas del Café" />
              </div>

              <div className="field">
                <label>Categoría *</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Selecciona categoría</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field field-colspan">
                <label>Descripción</label>
                <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Cuenta por qué es especial, qué incluye, tips, etc." />
              </div>

              {/* Departamento / Municipio */}
              <div className="field">
                <label>Departamento *</label>
                <select
                  value={departamento}
                  onChange={(e) => {
                    const dep = e.target.value;
                    setDepartamento(dep);
                    const found = deptos.find((d) => d.nombre === dep);
                    setMunis(found ? found.municipios : []);
                    setMunicipio("");
                  }}
                >
                  <option value="">Selecciona departamento</option>
                  {deptos.map((d) => <option key={d.slug} value={d.nombre}>{d.nombre}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Municipio *</label>
                <select
                  value={municipio}
                  onChange={async (e) => {
                    const m = e.target.value;
                    setMunicipio(m);
                    if (departamento && m) await centerOnMunicipio(departamento, m);
                  }}
                  disabled={!departamento}
                >
                  <option value="">Selecciona municipio</option>
                  {munis.map((m) => <option key={m.slug} value={m.nombre}>{m.nombre}</option>)}
                </select>
              </div>

              <div className="field field-colspan">
                <label>Dirección / punto *</label>
                <div className="combo">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setDireccion(e.target.value); searchAddress(e.target.value); }}
                    placeholder="Busca una dirección o coloca un punto en el mapa"
                  />
                  <button type="button" className="btn btn-light" onClick={getMyLocation}>📍 Mi ubicación</button>
                </div>

                {geoStatus === "denied" && <p className="msg-error">⚠️ Permiso de ubicación denegado. Actívalo en el navegador.</p>}
                {geoStatus === "error" && geoErr && <p className="msg-error">⚠️ {geoErr}</p>}

                {suggestions.length > 0 && (
                  <ul className="pe-suggest">
                    {suggestions.map((s, i) => (
                      <li key={`${s.lat}-${s.lng}-${i}`} onMouseDown={(e) => e.preventDefault()} onClick={() => handlePickSuggestion(s)}>
                        {s.display}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="field field-colspan">
                <div className="pe-map card-3d">
                  <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution="&copy; OSM" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RecenterMap center={center} />
                    <ClickToSetMarker />
                    <Marker position={[loc.lat, loc.lng]}>
                      <Popup>
                        <div style={{ fontWeight: 600 }}>Dirección</div>
                        <div style={{ maxWidth: 240 }}>{loc.address || direccion}</div>
                        <div style={{ marginTop: 6, fontSize: 12 }}>({loc.lat.toFixed(5)}, {loc.lng.toFixed(5)})</div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="pe-block">
            <div className="pe-block__head">
              <h3>Horarios</h3>
              <p>Elige un preset o define manualmente</p>
            </div>

            <div className="pe-row">
              <div className="field">
                <label>Horario rápido</label>
                <select value={horarioPreset} onChange={(e) => setHorarioPreset(e.target.value)}>
                  {RAPID_HOURS.map((h) => (
                    <option key={h.k} value={h.k}>{h.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Desde</label>
                <input type="time" value={horarioDesde} onChange={(e) => { setHorarioDesde(e.target.value); setHorarioPreset("none"); }} />
              </div>
              <div className="field">
                <label>Hasta</label>
                <input type="time" value={horarioHasta} onChange={(e) => { setHorarioHasta(e.target.value); setHorarioPreset("none"); }} />
              </div>
            </div>
          </div>
        </section>

        {/* Columna derecha */}
        <section className="pe-col">
          <div className="pe-block">
            <div className="pe-block__head">
              <h3>Precios</h3>
            </div>

            <div className="pe-row">
              <div className="field">
                <label>Moneda</label>
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="field">
                <label>Precio desde</label>
                <input type="number" min="0" step="0.01" value={precioDesde} onChange={(e) => setPrecioDesde(e.target.value)} />
              </div>
              <div className="field">
                <label>Precio hasta</label>
                <input type="number" min="0" step="0.01" value={precioHasta} onChange={(e) => setPrecioHasta(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Detalle de precios</label>
              <input type="text" value={infoPrecios} onChange={(e) => setInfoPrecios(e.target.value)} placeholder="Ej: Niños 50%, incluye guía..." />
            </div>
          </div>

          <div className="pe-block">
            <div className="pe-block__head">
              <h3>Fotos del lugar</h3>
            </div>

            {/* Foto principal */}
            <div className="field">
              <label>Foto principal</label>

              {!fotoPrincipalPreview ? (
                <div
                  className="pe-dropzone"
                  onClick={() => principalInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) onPickPrincipal(f);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && principalInputRef.current?.click()}
                >
                  <div className="pe-dropzone__icon">📷</div>
                  <div className="pe-dropzone__text">
                    <strong>Arrastra una imagen aquí</strong>
                    <span>o</span>
                    <button type="button" className="btn btn-outline">Selecciona una imagen</button>
                  </div>
                  <small className="pe-hint">JPG/PNG/WEBP • máx. {MAX_MB}MB</small>
                  <input
                    ref={principalInputRef}
                    type="file"
                    accept={ACCEPTED.join(",")}
                    onChange={(e) => onPickPrincipal(e.target.files?.[0] || null)}
                    hidden
                  />
                </div>
              ) : (
                <div className="pe-photo-main">
                  <img src={fotoPrincipalPreview} alt="principal" />
                  <div className="pe-photo-actions">
                    <button type="button" className="btn btn-outline" onClick={() => principalInputRef.current?.click()}>
                      Cambiar imagen
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => { setFotoPrincipal(null); setFotoPrincipalPreview(null); }}
                    >
                      Quitar
                    </button>
                    <input
                      ref={principalInputRef}
                      type="file"
                      accept={ACCEPTED.join(",")}
                      onChange={(e) => onPickPrincipal(e.target.files?.[0] || null)}
                      hidden
                    />
                  </div>
                </div>
              )}
            </div>

            {isEdit && fotosExistentes.length > 0 && (
              <div className="field">
                <label>Fotos existentes</label>
                <div className="pe-gallery">
                  {fotosExistentes.map((f) => (
                    <div key={f.id} className="pe-thumb">
                      <img src={`${UPLOADS_HOST}${f.imagen_url}`} alt="existente" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label>Más fotos (agregar nuevas)</label>
              <div className="pe-gallery">
                {fotosExtra.map((f, i) => (
                  <div key={i} className="pe-thumb">
                    <img src={f.preview} alt={`extra-${i}`} />
                    <button type="button" className="pe-thumb__remove" title="Quitar" onClick={() => removeExtraAt(i)}>×</button>
                  </div>
                ))}
              </div>

              <div
                className="file-btn"
                onClick={() => addExtraInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && addExtraInputRef.current?.click()}
              >
                <span className="file-btn__icon">➕</span>
                <span className="file-btn__label">Agregar otra foto</span>
              </div>

              <input
                ref={addExtraInputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                onChange={onAddExtraFromHidden}
                hidden
              />
            </div>
          </div>

          <div className="pe-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
};

export default PerfilEmpresa;
