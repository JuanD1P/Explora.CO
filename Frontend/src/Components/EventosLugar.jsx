import React, { useEffect, useMemo, useRef, useState } from 'react';
const API_URL = 'http://localhost:3000';

// ⚠️ reemplaza por el id real del usuario EMPRESA autenticado
const EMPRESA_ID = 3;

export default function EventosLugar() {
  const [lugares, setLugares] = useState([]);
  const [perfilId, setPerfilId] = useState('');
  const [nombreEvento, setNombreEvento] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [fotoPrincipal, setFotoPrincipal] = useState(null);
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState(null);
  const principalInputRef = useRef(null);

  const [fotosExtra, setFotosExtra] = useState([]); 
  const addExtraInputRef = useRef(null);

  const [enviando, setEnviando] = useState(false);
  const [eventos, setEventos] = useState([]);

  // Cargar lugares de la empresa
  const cargarLugares = async () => {
    const res = await fetch(`${API_URL}/api/perfiles?empresa_id=${EMPRESA_ID}`);
    const data = await res.json();
    setLugares(data);
    if (data.length && !perfilId) setPerfilId(String(data[0].id));
  };

  // Cargar eventos (opcional: por lugar)
  const cargarEventos = async (pid = null) => {
    const url = pid
      ? `${API_URL}/api/eventos?empresa_id=${EMPRESA_ID}&perfil_id=${pid}`
      : `${API_URL}/api/eventos?empresa_id=${EMPRESA_ID}`;
    const res = await fetch(url);
    const data = await res.json();
    setEventos(data);
  };

  useEffect(() => { cargarLugares(); }, []);
  useEffect(() => { if (perfilId) cargarEventos(perfilId); }, [perfilId]);

  // Handlers fotos
  const onPickPrincipal = (e) => {
    const f = e.target.files?.[0] || null;
    setFotoPrincipal(f);
    setFotoPrincipalPreview(f ? URL.createObjectURL(f) : null);
  };
  const onAddExtraFromHidden = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFotosExtra(prev => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
    e.target.value = '';
  };
  const removeExtraAt = (i) => setFotosExtra(prev => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!perfilId) return alert('Selecciona un lugar');
    if (!nombreEvento) return alert('Ingresa el nombre del evento');

    const fd = new FormData();
    fd.append('empresa_id', String(EMPRESA_ID));
    fd.append('perfil_id', perfilId);
    fd.append('nombre_evento', nombreEvento);
    fd.append('descripcion', descripcion);
    if (fotoPrincipal) fd.append('fotos', fotoPrincipal);
    fotosExtra.forEach(({ file }) => fd.append('fotos', file));

    try {
      setEnviando(true);
      const res = await fetch(`${API_URL}/api/eventos`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error creando evento');

      // limpiar
      setNombreEvento('');
      setDescripcion('');
      setFotoPrincipal(null);
      setFotoPrincipalPreview(null);
      setFotosExtra([]);
      await cargarEventos(perfilId);
      alert('Evento creado');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Eventos del lugar</h2>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Lugar</label>
          <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>
            {lugares.length === 0 && <option value="">No tienes lugares. Crea uno primero.</option>}
            {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre_lugar} — {l.ciudad}</option>)}
          </select>
        </div>

        <input
          type="text"
          placeholder="Nombre del evento *"
          value={nombreEvento}
          onChange={(e) => setNombreEvento(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />

        <textarea
          placeholder="Descripción del evento (opcional)"
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />

        {/* Fotos del evento */}
        <div style={{ display: 'grid', gap: 10 }}>
          {/* principal */}
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

          {/* extras */}
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

        <button type="submit" disabled={enviando}
                style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
          {enviando ? 'Guardando...' : 'Crear evento'}
        </button>
      </form>
    </div>
  );
}
