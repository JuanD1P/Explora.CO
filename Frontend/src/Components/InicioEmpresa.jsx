import React, { useEffect, useMemo, useState } from 'react';
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
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const InicioE = () => {

  const [titulo, setTitulo] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);


  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);


  const [loc, setLoc] = useState({
    lat: 4.711,
    lng: -74.0721,
    address: '',
    chosen: false,
  });

  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoErr, setGeoErr] = useState('');

  const center = useMemo(() => [loc.lat, loc.lng], [loc.lat, loc.lng]);

  const cargarImagenes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/imagenes`, { credentials: 'include' });
      const data = await res.json();
      setImagenes(data);
    } catch (e) {
      console.error(e);
      alert('Error cargando imágenes');
    }
  };

  useEffect(() => {
    cargarImagenes();
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Selecciona una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('imagen', file);

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/imagenes`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen');

      setTitulo('');
      setFile(null);
      setPreview(null);

      await cargarImagenes();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const searchAddress = async (text) => {
    try {
      if (!text || text.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        text
      )}&addressdetails=1&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(
        data.map((d) => ({
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          display: d.display_name,
        }))
      );
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  const handlePickSuggestion = (sug) => {
    setLoc({ lat: sug.lat, lng: sug.lng, address: sug.display, chosen: true });
    setQuery(sug.display);
    setSuggestions([]);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url);
      const data = await res.json();
      const display = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLoc({ lat, lng, address: display, chosen: true });
      setQuery(display);
    } catch (err) {
      console.error(err);
      setLoc({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, chosen: true });
    }
  };

  const getMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      setGeoErr('Este navegador no soporta geolocalización.');
      return;
    }
    setGeoStatus('prompt');
    setGeoErr('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoStatus('granted');
        await reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setGeoStatus(err.code === 1 ? 'denied' : 'error');
        setGeoErr(
          err.code === 1
            ? 'Permiso denegado. Puedes habilitarlo en la configuración del navegador.'
            : 'No fue posible obtener la ubicación.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {

    getMyLocation();

  }, []);

  const ClickToSetMarker = () => {
    useMapEvents({
      click(e) {
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Explora.co — Publicaciones con imagen</h2>


      <form
        onSubmit={onSubmit}
        style={{
          display: 'grid',
          gap: 12,
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 10,
          marginBottom: 24,
        }}
      >
        <input
          type="text"
          placeholder="Título (opcional)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <input type="file" accept="image/*" onChange={onFileChange} style={{ padding: 8 }} />
        {preview && (
          <div>
            <p style={{ margin: '4px 0' }}>Vista previa:</p>
            <img src={preview} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Subiendo...' : 'Subir imagen'}
        </button>
      </form>

      <h3 style={{ marginBottom: 8 }}>Últimas imágenes</h3>
      {!imagenes.length && <p>No hay imágenes aún.</p>}

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          marginBottom: 28,
        }}
      >
        {imagenes.map((img) => (
          <article key={img.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{img.titulo || 'Sin título'}</div>
            <img
              src={`${API_URL}${img.imagen_url}`}
              alt={img.alt_text || img.titulo || 'imagen'}
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }}
              loading="lazy"
            />
          </article>
        ))}
      </div>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 12,
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: '0 0 10px' }}>Selecciona una dirección en el mapa</h3>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={getMyLocation}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              background: '#f3f4f6',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📍 Usar mi ubicación
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Escribe una dirección, barrio, ciudad..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                searchAddress(e.target.value);
              }}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
            {suggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  margin: 0,
                  padding: 6,
                  listStyle: 'none',
                  maxHeight: 220,
                  overflowY: 'auto',
                  zIndex: 10,
                }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.lat}-${s.lng}-${i}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSuggestion(s)}
                    style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6 }}
                  >
                    {s.display}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {geoStatus === 'denied' && (
          <p style={{ margin: '6px 0', color: '#b91c1c' }}>
            ⚠️ Permiso de ubicación denegado. Actívalo en la configuración del navegador o usa el
            buscador.
          </p>
        )}
        {geoStatus === 'error' && geoErr && (
          <p style={{ margin: '6px 0', color: '#b91c1c' }}>⚠️ {geoErr}</p>
        )}

        <div style={{ height: 380, width: '100%', borderRadius: 10, overflow: 'hidden' }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={center} />
            <ClickToSetMarker />
            {loc && (
              <Marker position={[loc.lat, loc.lng]}>
                <Popup>
                  {loc.address ? (
                    <>
                      <div style={{ fontWeight: 600 }}>Dirección</div>
                      <div style={{ maxWidth: 240 }}>{loc.address}</div>
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        ({loc.lat.toFixed(5)}, {loc.lng.toFixed(5)})
                      </div>
                    </>
                  ) : (
                    'Ubicación seleccionada'
                  )}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {loc.chosen && (
          <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.4 }}>
            <div>
              <b>Seleccionado:</b>{' '}
              {loc.address || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`}
            </div>
            <div>
              <b>Coordenadas:</b> {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default InicioE;
