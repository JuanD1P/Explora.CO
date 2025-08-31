import React, { useEffect, useMemo, useRef, useState } from 'react';
const API_URL = 'http://localhost:3000';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, map.getZoom(), { animate: true }); }, [center, map]);
  return null;
}

const CATEGORIAS = [
  'Atractivos Naturales',
  'Atractivos Culturales',
  'Atractivos Recreativos',
  'Atractivos Gastronómicos',
  'Atractivos Arqueológicos',
  'Atractivos Históricos',
];

// ⚠️ reemplaza por el id real del usuario EMPRESA autenticado
const EMPRESA_ID = 3;

const PerfilEmpresa = () => {
  // ------ Form datos del lugar ------
  const [nombreLugar, setNombreLugar] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');

  // Horarios / precios
  const [horarioDesde, setHorarioDesde] = useState('');   // "HH:MM"
  const [horarioHasta, setHorarioHasta] = useState('');   // "HH:MM"
  const [moneda, setMoneda] = useState('COP');
  const [precioDesde, setPrecioDesde] = useState('');     // string numérica
  const [precioHasta, setPrecioHasta] = useState('');     // string numérica
  const [infoPrecios, setInfoPrecios] = useState('');

  // Fotos del lugar
  const [fotoPrincipal, setFotoPrincipal] = useState(null);
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState(null);
  const [fotosExtra, setFotosExtra] = useState([]); // [{file, preview}]
  const addExtraInputRef = useRef(null);
  const principalInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [perfiles, setPerfiles] = useState([]);

  // ------ Avatar empresa ------
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // ------ Mapa / ubicación ------
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loc, setLoc] = useState({ lat: 4.711, lng: -74.0721, address: '', chosen: false });
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoErr, setGeoErr] = useState('');
  const center = useMemo(() => [loc.lat, loc.lng], [loc.lat, loc.lng]);

  const cargarPerfiles = async () => {
    const res = await fetch(`${API_URL}/api/perfiles?empresa_id=${EMPRESA_ID}`, { credentials: 'include' });
    const data = await res.json();
    setPerfiles(data);
  };
  useEffect(() => { cargarPerfiles(); }, []);

  // ------- Avatar (preview + subir) -------
  const onPickAvatar = (e) => {
    const f = e.target.files?.[0] || null;
    setAvatarFile(f);
    setAvatarPreview(f ? URL.createObjectURL(f) : null);
  };

  const subirAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return alert('Selecciona una imagen');
    const fd = new FormData();
    fd.append('empresa_id', String(EMPRESA_ID));
    fd.append('avatar', avatarFile);
    try {
      setSubiendoAvatar(true);
      const res = await fetch(`${API_URL}/api/empresa/avatar`, { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al subir avatar');
      alert('Foto de perfil actualizada');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendoAvatar(false);
    }
  };

  // ------- Fotos del lugar (principal + extras con botón) -------
  const onPickPrincipal = (e) => {
    const f = e.target.files?.[0] || null;
    setFotoPrincipal(f);
    setFotoPrincipalPreview(f ? URL.createObjectURL(f) : null);
  };

  const onAddExtraFromHidden = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFotosExtra((prev) => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
    e.target.value = ''; // permite volver a elegir el mismo archivo si se quiere
  };

  const removeExtraAt = (idx) => {
    setFotosExtra((prev) => prev.filter((_, i) => i !== idx));
  };

  // ====== geolocalización / mapa ======
  const searchAddress = async (text) => {
    try {
      if (!text || text.trim().length < 3) { setSuggestions([]); return; }
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.map(d => ({
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        display: d.display_name,
        city: d.address?.city || d.address?.town || d.address?.village || '',
      })));
    } catch { setSuggestions([]); }
  };

  const handlePickSuggestion = (s) => {
    setLoc({ lat: s.lat, lng: s.lng, address: s.display, chosen: true });
    setDireccion(s.display);
    if (s.city && !ciudad) setCiudad(s.city);
    setQuery(s.display);
    setSuggestions([]);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url);
      const data = await res.json();
      const display = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLoc({ lat, lng, address: display, chosen: true });
      setDireccion(display);
      const city = data?.address?.city || data?.address?.town || data?.address?.village || '';
      if (city) setCiudad(city);
      setQuery(display);
    } catch {
      setLoc({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, chosen: true });
    }
  };

  const getMyLocation = () => {
    if (!('geolocation' in navigator)) { setGeoStatus('error'); setGeoErr('Este navegador no soporta geolocalización.'); return; }
    setGeoStatus('prompt'); setGeoErr('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoStatus('granted');
        await reverseGeocode(latitude, longitude);
      },
      (err) => {
        setGeoStatus(err.code === 1 ? 'denied' : 'error');
        setGeoErr(err.code === 1 ? 'Permiso de ubicación denegado' : 'No fue posible obtener la ubicación.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const ClickToSetMarker = () => {
    useMapEvents({ click(e) { reverseGeocode(e.latlng.lat, e.latlng.lng); } });
    return null;
  };

  // ------- Enviar lugar -------
  const onSubmit = async (e) => {
    e.preventDefault();

    // Requeridos básicos
    if (!nombreLugar || !categoria || !ciudad || !direccion || !loc.lat || !loc.lng) {
      alert('Completa los campos obligatorios');
      return;
    }

    // Validaciones Horario
    if ((horarioDesde && !horarioHasta) || (!horarioDesde && horarioHasta)) {
      return alert('Si defines horario, completa ambos: desde y hasta.');
    }
    if (horarioDesde && horarioHasta && horarioDesde >= horarioHasta) {
      return alert('El horario "desde" debe ser menor al "hasta".');
    }

    // Validaciones Precios
    const pDesde = precioDesde ? parseFloat(precioDesde) : null;
    const pHasta = precioHasta ? parseFloat(precioHasta) : null;
    if ((pDesde !== null && pDesde < 0) || (pHasta !== null && pHasta < 0)) {
      return alert('Los precios no pueden ser negativos.');
    }
    if (pDesde !== null && pHasta !== null && pDesde > pHasta) {
      return alert('"Precio desde" no puede ser mayor a "precio hasta".');
    }

    const formData = new FormData();
    formData.append('empresa_id', String(EMPRESA_ID));
    formData.append('nombre_lugar', nombreLugar);
    formData.append('categoria', categoria);
    formData.append('descripcion', descripcion); // se guarda (no se muestra en la lista)
    formData.append('ciudad', ciudad);
    formData.append('direccion', direccion);
    formData.append('lat', String(loc.lat));
    formData.append('lng', String(loc.lng));

    // Horarios / precios
    formData.append('horario_desde', horarioDesde || '');
    formData.append('horario_hasta', horarioHasta || '');
    formData.append('moneda', moneda || 'COP');
    formData.append('precio_desde', precioDesde || '');
    formData.append('precio_hasta', precioHasta || '');
    formData.append('info_precios', infoPrecios || '');

    // Agregamos primero la principal si existe, luego las extras
    if (fotoPrincipal) formData.append('fotos', fotoPrincipal);
    fotosExtra.forEach(({ file }) => formData.append('fotos', file));

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/perfiles`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al crear el perfil');

      // limpiar
      setNombreLugar('');
      setCategoria('');
      setDescripcion('');
      setCiudad('');
      setDireccion('');
      setFotoPrincipal(null);
      setFotoPrincipalPreview(null);
      setFotosExtra([]);

      setHorarioDesde('');
      setHorarioHasta('');
      setMoneda('COP');
      setPrecioDesde('');
      setPrecioHasta('');
      setInfoPrecios('');

      await cargarPerfiles();
      alert('Perfil guardado');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Perfil de Empresa — Crear lugar</h2>

      {/* Avatar empresa (preview + subir) */}
      <form onSubmit={subirAvatar} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div
          style={{
            width: 96, height: 96, borderRadius: '50%',
            background: '#f3f4f6', overflow: 'hidden',
            display: 'grid', placeItems: 'center', border: '1px solid #e5e7eb'
          }}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 28, opacity: .5 }}>📷</span>
          )}
        </div>

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={onPickAvatar}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            Seleccionar foto
          </button>
          <button
            type="submit"
            disabled={subiendoAvatar || !avatarFile}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', cursor: 'pointer' }}
          >
            {subiendoAvatar ? 'Subiendo...' : 'Guardar foto de perfil'}
          </button>
        </div>
      </form>

      {/* Crear lugar */}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, padding: 12, border: '1px solid #ddd', borderRadius: 10, marginBottom: 24 }}>
        <input type="text" placeholder="Nombre del lugar *" value={nombreLugar}
               onChange={(e) => setNombreLugar(e.target.value)}
               style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>
          <option value="">Selecciona categoría *</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <textarea placeholder="Descripción del lugar (opcional)" value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)} rows={3}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />

        <input type="text" placeholder="Ciudad *" value={ciudad}
               onChange={(e) => setCiudad(e.target.value)}
               style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="Dirección / punto *" value={query}
                 onChange={(e) => { setQuery(e.target.value); setDireccion(e.target.value); searchAddress(e.target.value); }}
                 style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
          <button type="button" onClick={getMyLocation}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#f3f4f6', whiteSpace: 'nowrap' }}>
            📍 Mi ubicación
          </button>
        </div>

        {geoStatus === 'denied' && <p style={{ margin: '6px 0', color: '#b91c1c' }}>⚠️ Permiso de ubicación denegado. Actívalo en el navegador.</p>}
        {geoStatus === 'error' && geoErr && <p style={{ margin: '6px 0', color: '#b91c1c' }}>⚠️ {geoErr}</p>}

        {suggestions.length > 0 && (
          <ul style={{ margin: 0, padding: 6, listStyle: 'none', border: '1px solid #ddd', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
            {suggestions.map((s, i) => (
              <li key={`${s.lat}-${s.lng}-${i}`} onMouseDown={(e) => e.preventDefault()} onClick={() => handlePickSuggestion(s)}
                  style={{ padding: '8px 10px', cursor: 'pointer' }}>
                {s.display}
              </li>
            ))}
          </ul>
        )}

        <div style={{ height: 380, width: '100%', borderRadius: 10, overflow: 'hidden' }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

        {/* Horarios de atención */}
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Horarios de atención (opcional)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Desde</span>
              <input type="time" value={horarioDesde} onChange={(e) => setHorarioDesde(e.target.value)}
                     style={{ padding: 6, borderRadius: 8, border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Hasta</span>
              <input type="time" value={horarioHasta} onChange={(e) => setHorarioHasta(e.target.value)}
                     style={{ padding: 6, borderRadius: 8, border: '1px solid #ccc' }} />
            </div>
          </div>
          <small style={{ opacity: .7 }}>
            Déjalos vacíos si no quieres mostrar un horario fijo.
          </small>
        </div>

        {/* Precios */}
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Información de precios (opcional)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <input type="number" min="0" step="0.01" placeholder="Precio desde"
                   value={precioDesde} onChange={(e) => setPrecioDesde(e.target.value)}
                   style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', maxWidth: 160 }} />
            <input type="number" min="0" step="0.01" placeholder="Precio hasta"
                   value={precioHasta} onChange={(e) => setPrecioHasta(e.target.value)}
                   style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', maxWidth: 160 }} />
          </div>
          <input
            type="text"
            placeholder="Detalle de precios (ej: Niños 50%, incluye guía...)"
            value={infoPrecios}
            onChange={(e) => setInfoPrecios(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>

        {/* Fotos del lugar */}
        <div style={{ display: 'grid', gap: 10 }}>
          {/* Foto principal */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Foto principal (opcional)</label>
            {fotoPrincipalPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={fotoPrincipalPreview} alt="principal" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => principalInputRef.current?.click()}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}>
                    Cambiar
                  </button>
                  <button type="button" onClick={() => { setFotoPrincipal(null); setFotoPrincipalPreview(null); }}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fee2e2' }}>
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => principalInputRef.current?.click()}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', width: 'fit-content' }}>
                Seleccionar foto principal
              </button>
            )}
            <input ref={principalInputRef} type="file" accept="image/*" onChange={onPickPrincipal} style={{ display: 'none' }} />
          </div>

          {/* Fotos extra con botón “+ Agregar otra foto” */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, margin: '8px 0' }}>Más fotos (opcional)</label>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {fotosExtra.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={f.preview} alt={`extra-${i}`} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                  <button type="button" onClick={() => removeExtraAt(i)}
                          title="Quitar" style={{
                            position: 'absolute', top: 6, right: 6, border: 'none',
                            background: '#ef4444', color: '#fff', borderRadius: 999, width: 22, height: 22, cursor: 'pointer'
                          }}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => addExtraInputRef.current?.click()}
                    style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}>
              + Agregar otra foto
            </button>
            <input ref={addExtraInputRef} type="file" accept="image/*" onChange={onAddExtraFromHidden} style={{ display: 'none' }} />
          </div>
        </div>

        <button type="submit" disabled={loading}
                style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
          {loading ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </form>
    </div>
  );
};

export default PerfilEmpresa;
